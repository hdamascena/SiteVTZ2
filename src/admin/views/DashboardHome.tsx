import React, { useMemo } from 'react';
import {
  CheckSquare,
  Users,
  FileCheck2,
  MessageSquare,
  Crosshair,
  FileText,
  HeartHandshake,
  AlertCircle,
  ArrowRight,
  Award,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { AdminSectionId, AdminUserProfile } from '../types.ts';
import { ROLE_LABELS, resolveProjectIdFromRsvp } from '../permissions.ts';
import { useClubData } from '../../context/ClubDataContext.tsx';

interface DashboardHomeProps {
  profile: AdminUserProfile;
  onNavigate: (section: AdminSectionId, queryParams?: Record<string, string>) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  profile,
  onNavigate,
}) => {
  const {
    projects,
    rsvps,
    contactMessages,
    scoutInquiries,
    newsArticles,
    events,
    transparencyDocs,
    siteSettings,
  } = useClubData();

  const role = profile.role;

  const allowedProjects = useMemo(() => {
    if (role === 'professor') {
      return projects.filter((p) => (profile.projectIds || []).includes(p.id));
    }
    return projects;
  }, [projects, role, profile.projectIds]);

  const attendanceSessions = siteSettings.attendanceSessions || [];
  const donationPledges = siteSettings.donationPledges || [];

  // Students without recent attendance (for professor / admin)
  const absentAlertStudents = useMemo(() => {
    const list: { studentName: string; projectName: string; missCount: number }[] = [];
    allowedProjects.forEach((proj) => {
      const projSessions = attendanceSessions
        .filter((s) => s.projectId === proj.id)
        .slice(0, 5);
      (proj.participants || []).forEach((pt) => {
        let misses = 0;
        projSessions.forEach((sess) => {
          const entry = sess.entries.find((e) => e.participantId === pt.id);
          if (entry && entry.status === 'falta') misses += 1;
        });
        if (misses > 0 || projSessions.length === 0) {
          list.push({
            studentName: pt.name,
            projectName: proj.name,
            missCount: misses,
          });
        }
      });
    });
    return list.sort((a, b) => b.missCount - a.missCount).slice(0, 6);
  }, [allowedProjects, attendanceSessions]);

  const unreadMessages = contactMessages.filter((m) => !m.read);
  const pendingEnrollments = rsvps.filter((r) => {
    const pid = resolveProjectIdFromRsvp(r, projects);
    if (role === 'professor' && (!pid || !profile.projectIds.includes(pid))) {
      return false;
    }
    return (r.enrollmentStatus || 'pendente') === 'pendente';
  });
  const newScoutInquiries = scoutInquiries.filter((s) => s.status === 'nova');
  const draftNews = newsArticles.filter((n) => n.status === 'rascunho');

  // My records for visitante / apoiador
  const myEnrollments = rsvps.filter(
    (r) =>
      (r.userId && r.userId === profile.uid) ||
      (r.email && r.email.toLowerCase() === profile.email.toLowerCase())
  );
  const myDonations = donationPledges.filter(
    (d) =>
      (d.userId && d.userId === profile.uid) ||
      (d.donorEmail && d.donorEmail.toLowerCase() === profile.email.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-[#0284c7] dark:text-sky-400">
              {ROLE_LABELS[role]}
            </span>
            <span aria-hidden="true">·</span>
            <span>{profile.email}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Olá, {profile.nome}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(role === 'professor' || role === 'admin' || role === 'super_admin') && (
            <button
              type="button"
              onClick={() => onNavigate('chamada')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Chamada Rápida na Quadra</span>
            </button>
          )}
          {(role === 'admin' || role === 'super_admin' || role === 'professor') && (
            <button
              type="button"
              onClick={() => onNavigate('inscricoes')}
              className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Gerenciar Inscrições ({pendingEnrollments.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. PAINEL DO PROFESSOR */}
      {role === 'professor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Minhas Turmas Hoje
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {allowedProjects.length}
              </div>
              <span className="text-[11px] text-slate-500">
                Projetos vinculados ao seu perfil
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Inscrições Pendentes nas Turmas
              </span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
                {pendingEnrollments.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inscricoes', { status: 'pendente' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Avaliar inscrições</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total de Alunos nas Turmas
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                {allowedProjects.reduce((acc, p) => acc + (p.participants?.length || 0), 0)}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('participantes')}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver fichas dos alunos</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Minhas turmas hoje */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Minhas Turmas Hoje
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('chamada')}
                  className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Abrir chamada →
                </button>
              </div>
              {allowedProjects.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Nenhum projeto atribuído ao seu perfil ainda. Solicite vínculo à coordenação.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {allowedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {proj.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {proj.schedule} · {proj.location}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('chamada', { projectId: proj.id })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                      >
                        Fazer Chamada
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alunos sem presença recente */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Atenção: Alunos sem Presença Recente</span>
                </h2>
              </div>
              {absentAlertStudents.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Todos os alunos estão com presença em dia nas chamadas recentes.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {absentAlertStudents.map((st, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {st.studentName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {st.projectName}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {st.missCount > 0 ? `${st.missCount} falta(s)` : 'Sem chamada recente'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PAINEL DO ADMIN / SUPER_ADMIN */}
      {(role === 'admin' || role === 'super_admin') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Inscrições Pendentes</span>
                <FileCheck2 className="w-4 h-4 text-[#0284c7]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {pendingEnrollments.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inscricoes', { status: 'pendente' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Gerenciar matrículas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mensagens Não Lidas</span>
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {unreadMessages.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'mensagens' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir caixa de entrada</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Contatos de Olheiros</span>
                <Crosshair className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {newScoutInquiries.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'olheiros' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Ver solicitações técnicas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Apoiadores / Doações PIX</span>
                <HeartHandshake className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
                {donationPledges.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'doacoes' })}
                className="text-[11px] font-semibold text-[#0284c7] dark:text-sky-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Conferir doações e apoiadores</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Últimas Inscrições nos Projetos
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('inscricoes')}
                  className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Ver todas →
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {rsvps.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                        {r.studentName || r.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {r.eventTitle} · {r.date}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
                      {r.enrollmentStatus || 'pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Pendências de Mensagens e Olheiros
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('comunidade')}
                  className="text-xs font-semibold text-[#0284c7] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Abrir atendimento →
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {unreadMessages.slice(0, 3).map((m) => (
                  <div key={m.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {m.name} · {m.subject}
                      </span>
                      <span className="text-[11px] text-amber-600 font-semibold">
                        Não lida
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {m.message}
                    </p>
                  </div>
                ))}
                {newScoutInquiries.slice(0, 2).map((s) => (
                  <div key={s.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Olheiro: {s.scoutName} ({s.organization})
                      </span>
                      <span className="text-[11px] text-emerald-600 font-mono">
                        {s.protocol}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Interesse: {s.targetPlayerName || s.targetCategory}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAINEL DO EDITOR */}
      {role === 'editor' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Notícias Publicadas / Rascunhos</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {newsArticles.length} ({draftNews.length} rascunhos)
            </div>
            <button
              type="button"
              onClick={() => onNavigate('noticias')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Editar notícias</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Agenda de Eventos</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {events.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('eventos')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar agenda</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Projetos Institucionais</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {projects.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projetos')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Editar conteúdo público</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 4. PAINEL DO FINANCEIRO */}
      {role === 'financeiro' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Registros de Doação PIX</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
              {donationPledges.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('comunidade', { tab: 'doacoes' })}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Conferir doações e promover apoiadores</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Documentos de Transparência</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {transparencyDocs.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transparencia')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Conferir prestação de contas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Chave PIX Oficial</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {siteSettings.pixConfig?.pixKeyFormatted || '63.083.068/0001-00'}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('configuracoes')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Conferir configuração PIX</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 5. PAINEL DO PARCEIRO */}
      {role === 'parceiro' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Projetos Apoiados na Rede</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {projects.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('patrocinadores')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Gerenciar perfil de parceiro</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Relatórios de Transparência</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {transparencyDocs.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transparencia')}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Consultar certidões e balancetes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-500">Avaliações & Captação Técnica</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {scoutInquiries.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('comunidade', { tab: 'olheiros' })}
              className="text-[11px] font-semibold text-[#0284c7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Acompanhar solicitações</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 6. PAINEL DO VISITANTE & APOIADOR */}
      {(role === 'visitante' || role === 'apoiador') && (
        <div className="space-y-4">
          {role === 'apoiador' && (
            <div className="bg-emerald-950 text-white border border-emerald-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Certificado Oficial · Apoiador Vitalizar</span>
                </div>
                <h2 className="text-base font-extrabold">
                  Obrigado por apoiar o esporte educacional gratuito em Cariacica!
                </h2>
                <p className="text-xs text-emerald-200">
                  Seu perfil possui o selo de Apoiador por contribuir diretamente com a manutenção das escolinhas e projetos sociais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transparencia')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
              >
                Ver Prestação de Contas
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Minhas Inscrições em Projetos
                </span>
                <Calendar className="w-4 h-4 text-[#0284c7]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {myEnrollments.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inscricoes')}
                className="text-xs font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Acompanhar ou fazer nova inscrição</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Minhas Doações Registradas (PIX)
                </span>
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {myDonations.length}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('comunidade', { tab: 'doacoes' })}
                className="text-xs font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {role === 'visitante'
                    ? 'Fazer doação PIX e tornar-se Apoiador'
                    : 'Ver meu histórico de apoio'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
