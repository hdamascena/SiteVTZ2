import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  CheckSquare,
  Users,
  FolderKanban,
  Newspaper,
  Calendar,
  Image as ImageIcon,
  Award,
  MapPin,
  FileText,
  MessageSquareHeart,
  Settings,
  Shield,
  ClipboardList,
  Search,
  Sun,
  Moon,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Lock,
  Loader2,
  UserPlus,
} from 'lucide-react';
import type { AdminSectionId, AdminUserProfile } from '../admin/types.ts';
import {
  ROLE_LABELS,
  ROLE_SECTIONS,
  canAccessSection,
} from '../admin/permissions.ts';
import { useClubData } from '../context/ClubDataContext.tsx';
import {
  loginWithGoogleAdmin,
  loginWithEmailPasswordFirebase,
  registerVisitorWithEmailFirebase,
  sendPasswordResetFirebase,
  logoutFirebaseAuth,
} from '../services/firebaseService.ts';
import { DashboardHome } from '../admin/views/DashboardHome.tsx';
import { ChamadaQuadraView } from '../admin/views/ChamadaQuadraView.tsx';
import { InscricoesProjetosView } from '../admin/views/InscricoesProjetosView.tsx';
import { ParticipantesView } from '../admin/views/ParticipantesView.tsx';
import { ComunidadeView } from '../admin/views/ComunidadeView.tsx';
import { ConteudoView, type ConteudoSection } from '../admin/views/ConteudoView.tsx';
import { UsuariosLogView } from '../admin/views/UsuariosLogView.tsx';

interface AdminPanelProps {
  isOpen?: boolean;
  onClose: () => void;
}

const SECTION_META: Record<
  AdminSectionId,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  'visao-geral': { label: 'Visão Geral', icon: LayoutDashboard },
  inscricoes: { label: 'Inscrições nos Projetos', icon: FileCheck2 },
  chamada: { label: 'Chamada na Quadra', icon: CheckSquare },
  participantes: { label: 'Participantes (Alunos)', icon: Users },
  projetos: { label: 'Projetos Sociais', icon: FolderKanban },
  noticias: { label: 'Notícias', icon: Newspaper },
  eventos: { label: 'Agenda de Eventos', icon: Calendar },
  galeria: { label: 'Galeria de Fotos', icon: ImageIcon },
  patrocinadores: { label: 'Parceiros & Apoio', icon: Award },
  polos: { label: 'Polos Esportivos', icon: MapPin },
  transparencia: { label: 'Transparência', icon: FileText },
  comunidade: { label: 'Comunidade & Doações', icon: MessageSquareHeart },
  configuracoes: { label: 'Configurações & PIX', icon: Settings },
  usuarios: { label: 'Usuários & Perfis', icon: Shield },
  auditoria: { label: 'Log de Auditoria', icon: ClipboardList },
};

function parseAdminHash(hash: string): {
  section: AdminSectionId;
  query: Record<string, string>;
} {
  const cleaned = hash.replace(/^#/, '');
  if (!cleaned.startsWith('admin')) {
    return { section: 'visao-geral', query: {} };
  }
  const [pathPart, queryPart] = cleaned.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const rawSection = (segments[1] || 'visao-geral') as AdminSectionId;
  const section: AdminSectionId = SECTION_META[rawSection]
    ? rawSection
    : 'visao-geral';

  const query: Record<string, string> = {};
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    params.forEach((v, k) => {
      query[k] = v;
    });
  }
  return { section, query };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen = true, onClose }) => {
  const {
    currentUserProfile,
    authLoading,
    refreshUserProfile,
    projects,
    newsArticles,
    events,
    rsvps,
    contactMessages,
    recordAuditEvent,
  } = useClubData();

  // Theme state (Light/Dark toggle in header)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vitalizar_admin_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vitalizar_admin_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSectionId>('visao-geral');
  const [sectionQuery, setSectionQuery] = useState<Record<string, string>>({});

  // Global search (Ctrl+K)
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // 10-second Undo banner state
  const [undoBanner, setUndoBanner] = useState<{
    label: string;
    secondsLeft: number;
    restoreFn: () => void | Promise<void>;
  } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      window.clearInterval(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const triggerUndoToast = (
    label: string,
    restoreFn: () => void | Promise<void>
  ) => {
    clearUndoTimer();
    setUndoBanner({ label, secondsLeft: 10, restoreFn });
    undoTimerRef.current = window.setInterval(() => {
      setUndoBanner((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          clearUndoTimer();
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
  };

  const handleScheduleUndoDelete = (
    label: string,
    performDelete: () => void,
    undoRestore: () => void
  ) => {
    performDelete();
    triggerUndoToast(label, undoRestore);
  };

  // Sync URL hash with active section
  useEffect(() => {
    if (!isOpen) return;
    const syncFromHash = () => {
      const parsed = parseAdminHash(window.location.hash);
      setActiveSection(parsed.section);
      setSectionQuery(parsed.query);
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [isOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const navigateToSection = (
    section: AdminSectionId,
    queryParams?: Record<string, string>
  ) => {
    setActiveSection(section);
    const q = queryParams || {};
    setSectionQuery(q);
    const searchStr = new URLSearchParams(q).toString();
    const nextHash = `#admin/${section}${searchStr ? `?${searchStr}` : ''}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  };

  const allowedSections = useMemo<AdminSectionId[]>(() => {
    if (!currentUserProfile || !currentUserProfile.ativo) return [];
    return ROLE_SECTIONS[currentUserProfile.role] || ['visao-geral'];
  }, [currentUserProfile]);

  // Ensure current section is allowed for current role
  useEffect(() => {
    if (
      currentUserProfile &&
      currentUserProfile.ativo &&
      !canAccessSection(currentUserProfile.role, activeSection)
    ) {
      navigateToSection('visao-geral');
    }
  }, [currentUserProfile, activeSection]);

  // Global search results (Ctrl+K)
  const globalSearchResults = useMemo(() => {
    if (!cmdQuery.trim() || !currentUserProfile) return [];
    const q = cmdQuery.toLowerCase();
    const role = currentUserProfile.role;
    const items: {
      id: string;
      title: string;
      subtitle: string;
      section: AdminSectionId;
      query?: Record<string, string>;
    }[] = [];

    if (canAccessSection(role, 'participantes')) {
      projects
        .filter((p) =>
          role === 'professor'
            ? (currentUserProfile.projectIds || []).includes(p.id)
            : true
        )
        .forEach((p) => {
          (p.participants || []).forEach((pt) => {
            if (pt.name.toLowerCase().includes(q)) {
              items.push({
                id: `pt-${pt.id}`,
                title: pt.name,
                subtitle: `Aluno · ${p.name}`,
                section: 'participantes',
              });
            }
          });
        });
    }

    if (canAccessSection(role, 'inscricoes')) {
      rsvps.forEach((r) => {
        const name = r.studentName || r.name || '';
        if (
          name.toLowerCase().includes(q) ||
          (r.eventTitle || '').toLowerCase().includes(q)
        ) {
          items.push({
            id: `rsvp-${r.id}`,
            title: name,
            subtitle: `Inscrição · ${r.eventTitle}`,
            section: 'inscricoes',
          });
        }
      });
    }

    if (canAccessSection(role, 'noticias')) {
      newsArticles.forEach((n) => {
        if (n.title.toLowerCase().includes(q)) {
          items.push({
            id: `news-${n.id}`,
            title: n.title,
            subtitle: `Notícia · ${n.category}`,
            section: 'noticias',
          });
        }
      });
    }

    if (canAccessSection(role, 'eventos')) {
      events.forEach((ev) => {
        if (ev.title.toLowerCase().includes(q)) {
          items.push({
            id: `evt-${ev.id}`,
            title: ev.title,
            subtitle: `Evento · ${ev.date}`,
            section: 'eventos',
          });
        }
      });
    }

    if (
      canAccessSection(role, 'comunidade') &&
      (role === 'admin' || role === 'super_admin')
    ) {
      contactMessages.forEach((m) => {
        if (
          m.name.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
        ) {
          items.push({
            id: `msg-${m.id}`,
            title: `${m.name} — ${m.subject}`,
            subtitle: 'Mensagem de Contato',
            section: 'comunidade',
            query: { tab: 'mensagens' },
          });
        }
      });
    }

    return items.slice(0, 12);
  }, [
    cmdQuery,
    currentUserProfile,
    projects,
    rsvps,
    newsArticles,
    events,
    contactMessages,
  ]);

  if (!isOpen) return null;

  const handleClosePanel = () => {
    if (window.location.hash.startsWith('#admin')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    onClose();
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setAuthSubmitting(true);
    try {
      const user = await loginWithGoogleAdmin();
      if (user) {
        await refreshUserProfile();
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Não foi possível autenticar com o Google.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'register') {
        await registerVisitorWithEmailFirebase(
          nameInput,
          emailInput,
          passwordInput
        );
        await refreshUserProfile();
      } else {
        await loginWithEmailPasswordFirebase(emailInput, passwordInput);
        await refreshUserProfile();
      }
    } catch (err: any) {
      setAuthError(
        err?.message || 'Falha na autenticação. Verifique suas credenciais.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setAuthError(null);
    setAuthInfo(null);
    if (!emailInput.trim()) {
      setAuthError('Digite seu e-mail no campo acima para receber o link de redefinição de senha.');
      return;
    }
    setAuthSubmitting(true);
    try {
      await sendPasswordResetFirebase(emailInput);
      setAuthInfo(`Link de redefinição enviado para ${emailInput.trim()}. Verifique sua caixa de entrada.`);
    } catch (err: any) {
      setAuthError(err?.message || 'Não foi possível enviar o e-mail de redefinição.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await recordAuditEvent({
      action: 'logout',
      collection: 'admins',
      itemId: currentUserProfile?.uid || '',
      afterSummary: 'Sessão encerrada pelo usuário',
    });
    await logoutFirebaseAuth();
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="h-14 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentUserProfile && currentUserProfile.ativo && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={
                  sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
                }
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
              <span className="font-extrabold text-sm tracking-tight truncate">
                Vitalizar · Painel de Gestão & Comunidade
              </span>
            </div>
          </div>

          {/* Global Search Trigger (Ctrl+K) */}
          {currentUserProfile && currentUserProfile.ativo && (
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center justify-between gap-6 px-3 py-1.5 w-72 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Buscar aluno, inscrição, notícia...</span>
              </span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Right Controls: Role badge, Theme Toggle, Logout, Close */}
          <div className="flex items-center gap-2">
            {currentUserProfile && (
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {currentUserProfile.nome}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#0284c7] dark:text-sky-400">
                    {ROLE_LABELS[currentUserProfile.role]}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={
                darkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'
              }
              aria-label="Alternar tema claro ou escuro"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {currentUserProfile && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClosePanel}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar ao Site</span>
            </button>
          </div>
        </header>

        {/* BODY: AUTHENTICATION OR WORKSPACE */}
        {authLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
              <span>Verificando credenciais e perfil de acesso...</span>
            </div>
          </div>
        ) : !currentUserProfile ? (
          /* LOGIN / REGISTER SCREEN */
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              {/* Mode Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthInfo(null);
                    setAuthMode('login');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Já tenho conta (Entrar)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthInfo(null);
                    setAuthMode('register');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Primeiro Acesso / Criar Conta
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0284c7] dark:text-sky-400">
                  Autenticação Firebase · LGPD
                </span>
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {authMode === 'login'
                    ? 'Acessar Painel Vitalizar'
                    : 'Configurar Primeiro Acesso ou Conta'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {authMode === 'login'
                    ? 'Entre com sua conta Google ou com e-mail e senha cadastrados.'
                    : 'Defina sua senha de acesso (o e-mail principal da coordenação recebe perfil Super Admin automaticamente; demais contas entram conforme convite ou como Visitante).'}
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
                  {authError}
                </div>
              )}

              {authInfo && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  {authInfo}
                </div>
              )}

              <button
                type="button"
                disabled={authSubmitting}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar com Conta Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="shrink-0 mx-3 text-[11px] text-slate-400">
                  ou com e-mail e senha
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nome e sobrenome"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="higor.rock2011@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Senha
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold cursor-pointer"
                >
                  {authSubmitting
                    ? 'Autenticando…'
                    : authMode === 'login'
                      ? 'Entrar no Painel'
                      : 'Concluir Cadastro e Entrar'}
                </button>
              </form>
            </div>
          </div>
        ) : !currentUserProfile.ativo ? (
          /* BLOCKED ACCOUNT SCREEN */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center space-y-3">
              <Lock className="w-8 h-8 text-red-600 mx-auto" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Acesso Desativado
              </h2>
              <p className="text-xs text-slate-500">
                Sua conta ({currentUserProfile.email}) está marcada como inativa (<code>ativo: false</code>). Entre em contato com a coordenação da Associação Esportiva Vitalizar.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Sair da conta
              </button>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED WORKSPACE */
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* COLLAPSIBLE LEFT SIDEBAR */}
            <aside
              className={`${
                sidebarCollapsed ? 'w-14' : 'w-60'
              } shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-150 overflow-y-auto`}
            >
              <nav className="p-2 space-y-1" aria-label="Menu do Painel">
                {allowedSections.map((secId) => {
                  const meta = SECTION_META[secId];
                  const Icon = meta.icon;
                  const isActive = activeSection === secId;
                  return (
                    <button
                      key={secId}
                      type="button"
                      onClick={() => navigateToSection(secId)}
                      title={sidebarCollapsed ? meta.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="truncate">{meta.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {!sidebarCollapsed && (
                <div className="p-3 m-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Proteção LGPD Ativa
                  </span>
                  <span>
                    Dados sensíveis de menores possuem máscara e registro em log.
                  </span>
                </div>
              )}
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-6xl mx-auto">
                {activeSection === 'visao-geral' && (
                  <DashboardHome
                    profile={currentUserProfile}
                    onNavigate={navigateToSection}
                  />
                )}

                {activeSection === 'chamada' && (
                  <ChamadaQuadraView
                    profile={currentUserProfile}
                    initialProjectId={sectionQuery.projectId}
                  />
                )}

                {activeSection === 'inscricoes' && (
                  <InscricoesProjetosView
                    profile={currentUserProfile}
                    initialStatusFilter={sectionQuery.status}
                  />
                )}

                {activeSection === 'participantes' && (
                  <ParticipantesView
                    profile={currentUserProfile}
                    onScheduleUndoDelete={handleScheduleUndoDelete}
                  />
                )}

                {activeSection === 'comunidade' && (
                  <ComunidadeView
                    profile={currentUserProfile}
                    initialSubTab={sectionQuery.tab}
                    onScheduleUndoDelete={handleScheduleUndoDelete}
                  />
                )}

                {(activeSection === 'projetos' ||
                  activeSection === 'noticias' ||
                  activeSection === 'eventos' ||
                  activeSection === 'galeria' ||
                  activeSection === 'patrocinadores' ||
                  activeSection === 'polos' ||
                  activeSection === 'transparencia' ||
                  activeSection === 'configuracoes') && (
                  <ConteudoView
                    section={activeSection as ConteudoSection}
                    profile={currentUserProfile}
                    initialQuery={sectionQuery}
                    onRegisterUndo={(label, restoreFn) =>
                      triggerUndoToast(label, restoreFn)
                    }
                  />
                )}

                {(activeSection === 'usuarios' ||
                  activeSection === 'auditoria') && (
                  <UsuariosLogView
                    section={activeSection}
                    profile={currentUserProfile}
                  />
                )}
              </div>
            </main>
          </div>
        )}

        {/* 10-SECOND UNDO TOAST BANNER */}
        {undoBanner && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-4 text-xs"
          >
            <span>
              {undoBanner.label} ({undoBanner.secondsLeft}s)
            </span>
            <button
              type="button"
              onClick={async () => {
                const fn = undoBanner.restoreFn;
                clearUndoTimer();
                setUndoBanner(null);
                await fn();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Desfazer</span>
            </button>
          </div>
        )}

        {/* CTRL+K GLOBAL SEARCH MODAL */}
        {cmdOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 flex items-start justify-center pt-20 p-4"
            onClick={() => setCmdOpen(false)}
          >
            <div
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  autoFocus
                  value={cmdQuery}
                  onChange={(e) => setCmdQuery(e.target.value)}
                  placeholder="Digite o nome de um aluno, inscrição, notícia ou evento..."
                  className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCmdOpen(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
                >
                  ESC
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {!cmdQuery.trim() ? (
                  <p className="p-4 text-xs text-slate-500 text-center">
                    Digite para buscar rapidamente nas seções autorizadas para seu perfil.
                  </p>
                ) : globalSearchResults.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">
                    Nenhum resultado encontrado para "{cmdQuery}".
                  </p>
                ) : (
                  globalSearchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigateToSection(item.section, item.query);
                        setCmdOpen(false);
                        setCmdQuery('');
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate">
                          {item.subtitle}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#0284c7] dark:text-sky-400 shrink-0">
                        Abrir →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
