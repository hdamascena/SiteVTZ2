import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Shield,
  Edit3,
  Trash2,
  RefreshCw,
  Search,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  AdminInviteRecord,
  AdminRole,
  AdminSectionId,
  AdminUserProfile,
} from '../types.ts';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../permissions.ts';
import {
  fetchAllAdminsAndInvites,
  saveAdminProfile,
  saveAdminInvite,
  deleteAdminInvite,
} from '../../services/firebaseService.ts';
import { useClubData } from '../../context/ClubDataContext.tsx';
import type { AuditLogEntry } from '../../utils/adminAuth.ts';
import { CampoTexto } from '../components/CampoTexto.tsx';
import { Tabela, type ColunaTabela } from '../components/Tabela.tsx';
import { PainelLateral } from '../components/PainelLateral.tsx';
import { ConfirmarExclusao } from '../components/ConfirmarExclusao.tsx';

interface UsuariosLogViewProps {
  section: Extract<AdminSectionId, 'usuarios' | 'auditoria'>;
  profile: AdminUserProfile;
}

const ALL_ROLES: AdminRole[] = [
  'super_admin',
  'admin',
  'editor',
  'professor',
  'financeiro',
  'parceiro',
  'apoiador',
  'visitante',
];

export const UsuariosLogView: React.FC<UsuariosLogViewProps> = ({
  section,
  profile,
}) => {
  const { projects, auditLogs, recordAuditEvent } = useClubData();
  const isSuperAdmin = profile.role === 'super_admin';

  // ==================== USUÁRIOS & CONVITES ====================
  const [admins, setAdmins] = useState<AdminUserProfile[]>([]);
  const [invites, setInvites] = useState<AdminInviteRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  const [editingUser, setEditingUser] = useState<AdminUserProfile | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newInvite, setNewInvite] = useState<AdminInviteRecord>({
    email: '',
    nome: '',
    role: 'professor',
    projectIds: [],
    criadoEm: '',
    criadoPor: profile.email,
  });
  const [savingUser, setSavingUser] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState<AdminInviteRecord | null>(
    null
  );

  const loadUsersAndInvites = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetchAllAdminsAndInvites();
      setAdmins(res.admins);
      setInvites(res.invites);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (section === 'usuarios') {
      loadUsersAndInvites();
    }
  }, [section]);

  const assignableRoles = useMemo(
    () => (isSuperAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => r !== 'super_admin')),
    [isSuperAdmin]
  );

  // ==================== AUDITORIA ====================
  const [logPersonFilter, setLogPersonFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('todas');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');

  const safeLogs = Array.isArray(auditLogs) ? auditLogs : [];

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    safeLogs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [safeLogs]);

  const filteredLogs = useMemo(() => {
    return safeLogs.filter((log) => {
      if (logPersonFilter.trim()) {
        const q = logPersonFilter.toLowerCase();
        const matchEmail = (log.adminEmail || '').toLowerCase().includes(q);
        if (!matchEmail) return false;
      }
      if (logActionFilter !== 'todas' && log.action !== logActionFilter) {
        return false;
      }
      if (logDateFrom) {
        const logDate = (log.timestamp || '').slice(0, 10);
        if (logDate < logDateFrom) return false;
      }
      if (logDateTo) {
        const logDate = (log.timestamp || '').slice(0, 10);
        if (logDate > logDateTo) return false;
      }
      return true;
    });
  }, [safeLogs, logPersonFilter, logActionFilter, logDateFrom, logDateTo]);

  // ==================== RENDER: AUDITORIA ====================
  if (section === 'auditoria') {
    const logColumns: ColunaTabela<AuditLogEntry>[] = [
      {
        id: 'timestamp',
        header: 'Data / Hora (ISO)',
        render: (l) => (
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
            {l.timestamp ? l.timestamp.replace('T', ' ').slice(0, 19) : '-'}
          </span>
        ),
      },
      {
        id: 'actor',
        header: 'Quem / Perfil',
        render: (l) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
              {l.adminEmail}
            </span>
            <span className="text-[11px] text-slate-500">
              Perfil: <strong className="uppercase">{l.role || 'admin'}</strong>
            </span>
          </div>
        ),
      },
      {
        id: 'action',
        header: 'Ação / Coleção',
        render: (l) => (
          <div>
            <span className="font-mono text-xs font-bold text-[#0284c7] dark:text-sky-400 block">
              {l.action}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {l.collection || 'sistema'} {l.itemId ? `(${l.itemId})` : ''}
            </span>
          </div>
        ),
      },
      {
        id: 'summary',
        header: 'Antes / Depois Resumidos',
        render: (l) => (
          <div className="text-xs space-y-0.5 max-w-md">
            {l.beforeSummary && (
              <p className="text-[11px] text-slate-500 truncate">
                <strong>Antes:</strong> {l.beforeSummary}
              </p>
            )}
            {l.afterSummary ? (
              <p className="text-xs text-slate-800 dark:text-slate-200 truncate">
                <strong>Depois:</strong> {l.afterSummary}
              </p>
            ) : (
              <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                {l.details}
              </p>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Log de Auditoria e Proteção de Dados (LGPD)
              </h2>
              <p className="text-xs text-slate-500">
                Registro imutável (somente inserção) de revelação de dados sensíveis, exportações CSV, chamadas e alterações administrativas.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              {filteredLogs.length} registro(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filtrar por Pessoa (E-mail)
              </label>
              <input
                type="search"
                value={logPersonFilter}
                onChange={(e) => setLogPersonFilter(e.target.value)}
                placeholder="Ex.: usuario@exemplo.com"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filtrar por Ação
              </label>
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="todas">Todas as ações</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Período: De
              </label>
              <input
                type="date"
                value={logDateFrom}
                onChange={(e) => setLogDateFrom(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Período: Até
              </label>
              <input
                type="date"
                value={logDateTo}
                onChange={(e) => setLogDateTo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <Tabela
          items={filteredLogs}
          columns={logColumns}
          keyExtractor={(l) => l.id}
          emptyMessage="Nenhum registro de auditoria encontrado para os filtros aplicados."
        />
      </div>
    );
  }

  // ==================== RENDER: USUÁRIOS E PERFIS ====================
  const filteredAdmins = admins.filter((u) => {
    if (roleFilter !== 'todos' && u.role !== roleFilter) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!isSuperAdmin && editingUser.role === 'super_admin') return;
    setSavingUser(true);
    try {
      await saveAdminProfile(editingUser);
      recordAuditEvent({
        action: 'update_admin_user',
        collection: 'admins',
        itemId: editingUser.uid,
        afterSummary: `${editingUser.email} -> role=${editingUser.role}, ativo=${editingUser.ativo}`,
        role: profile.role,
      });
      await loadUsersAndInvites();
      setEditingUser(null);
    } finally {
      setSavingUser(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvite.email.trim()) return;
    if (!isSuperAdmin && newInvite.role === 'super_admin') return;
    setSavingUser(true);
    try {
      const payload: AdminInviteRecord = {
        ...newInvite,
        email: newInvite.email.trim().toLowerCase(),
        nome: newInvite.nome.trim() || newInvite.email.trim().toLowerCase(),
        criadoEm: new Date().toISOString(),
        criadoPor: profile.email,
      };
      await saveAdminInvite(payload);
      recordAuditEvent({
        action: 'create_admin_invite',
        collection: 'admin_invites',
        itemId: payload.email,
        afterSummary: `Convite ${payload.email} (${payload.role})`,
        role: profile.role,
      });
      await loadUsersAndInvites();
      setInviteOpen(false);
      setNewInvite({
        email: '',
        nome: '',
        role: 'professor',
        projectIds: [],
        criadoEm: '',
        criadoPor: profile.email,
      });
    } finally {
      setSavingUser(false);
    }
  };

  const toggleProjectInList = (list: string[], projectId: string): string[] => {
    return list.includes(projectId)
      ? list.filter((id) => id !== projectId)
      : [...list, projectId];
  };

  const userColumns: ColunaTabela<AdminUserProfile>[] = [
    {
      id: 'nome',
      header: 'Usuário / E-mail',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {u.nome}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Perfil de Acesso',
      render: (u) => (
        <div>
          <span className="text-xs font-bold text-[#0284c7] dark:text-sky-400 block">
            {ROLE_LABELS[u.role] || u.role}
          </span>
          {u.role === 'professor' && (
            <span className="text-[11px] text-slate-500">
              {u.projectIds?.length || 0} projeto(s) vinculado(s)
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'ativo',
      header: 'Status',
      render: (u) =>
        u.ativo ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ativo</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>Bloqueado</span>
          </span>
        ),
    },
    {
      id: 'actions',
      header: 'Ações',
      align: 'right',
      render: (u) => {
        const lockedSuperAdmin = u.role === 'super_admin' && !isSuperAdmin;
        return (
          <button
            type="button"
            disabled={lockedSuperAdmin}
            onClick={() => setEditingUser({ ...u })}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
          >
            {lockedSuperAdmin ? (
              <>
                <Lock className="w-3 h-3" />
                <span>Restrito</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                <span>Gerenciar</span>
              </>
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Usuários, Perfis de Acesso e Convites
          </h2>
          <p className="text-xs text-slate-500">
            Gerencie perfis internos (Super Admin, Admin, Editor, Professor, Financeiro) e comunitários (Parceiro, Apoiador, Visitante).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadUsersAndInvites}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Recarregar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Convidar E-mail (/admin_invites)</span>
          </button>
        </div>
      </div>

      {/* Filtros de Usuários */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos os perfis ({admins.length})</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full sm:w-64"
          />
        </div>
      </div>

      <Tabela
        items={filteredAdmins}
        columns={userColumns}
        keyExtractor={(u) => u.uid}
        emptyMessage="Nenhum usuário encontrado em /admins."
      />

      {/* Convites Pendentes (/admin_invites) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0284c7]" />
          <span>Convites Pré-Aprovados (/admin_invites)</span>
        </h3>
        <p className="text-xs text-slate-500">
          Quando a pessoa convidada faz o primeiro login com e-mail verificado, o sistema cria automaticamente o perfil em <code>/admins/&#123;uid&#125;</code> com o mesmo cargo do convite.
        </p>

        {invites.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            Nenhum convite pendente no momento.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {invites.map((inv) => (
              <div
                key={inv.email}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {inv.nome} ({inv.email})
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Perfil: <strong>{ROLE_LABELS[inv.role] || inv.role}</strong> · Criado por {inv.criadoPor}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteToDelete(inv)}
                  className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revogar Convite</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel Lateral: Editar Usuário Existente */}
      <PainelLateral
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Gerenciar Perfil de Usuário"
        subtitle={editingUser?.email}
        saveState={savingUser ? 'saving' : 'idle'}
        onSave={handleSaveUserEdit}
        saveLabel="Salvar Alterações"
      >
        {editingUser && (
          <div className="space-y-4">
            <CampoTexto
              label="Nome de Exibição"
              required
              value={editingUser.nome}
              onChange={(v) => setEditingUser({ ...editingUser, nome: v })}
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Perfil de Acesso (Role)
              </label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as AdminRole,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {ROLE_DESCRIPTIONS[editingUser.role]}
              </p>
            </div>

            {editingUser.role === 'professor' && (
              <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Turmas / Projetos Vinculados ao Professor (projectIds)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {projects.map((proj) => (
                    <label
                      key={proj.id}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(editingUser.projectIds || []).includes(proj.id)}
                        onChange={() =>
                          setEditingUser({
                            ...editingUser,
                            projectIds: toggleProjectInList(
                              editingUser.projectIds || [],
                              proj.id
                            ),
                          })
                        }
                        className="rounded border-slate-300"
                      />
                      <span>{proj.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    Conta Ativa (ativo: true)
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Desmarcar bloqueia o acesso imediatamente nas regras do Firestore.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingUser.ativo}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, ativo: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300"
                />
              </label>
            </div>
          </div>
        )}
      </PainelLateral>

      {/* Painel Lateral: Novo Convite */}
      <PainelLateral
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Novo Convite (/admin_invites)"
        subtitle="Autorize um e-mail para ingressar com perfil específico"
        saveState={savingUser ? 'saving' : 'idle'}
        onSave={handleCreateInvite}
        saveLabel="Criar Convite"
      >
        <div className="space-y-4">
          <CampoTexto
            label="E-mail do Convidado"
            type="email"
            required
            placeholder="nome@exemplo.com"
            value={newInvite.email}
            onChange={(v) => setNewInvite({ ...newInvite, email: v })}
          />
          <CampoTexto
            label="Nome Completo"
            required
            placeholder="Nome e sobrenome"
            value={newInvite.nome}
            onChange={(v) => setNewInvite({ ...newInvite, nome: v })}
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Perfil Concedido no Primeiro Login
            </label>
            <select
              value={newInvite.role}
              onChange={(e) =>
                setNewInvite({ ...newInvite, role: e.target.value as AdminRole })
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {ROLE_DESCRIPTIONS[newInvite.role]}
            </p>
          </div>

          {newInvite.role === 'professor' && (
            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Selecione as Turmas do Professor (projectIds)
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {projects.map((proj) => (
                  <label
                    key={proj.id}
                    className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newInvite.projectIds.includes(proj.id)}
                      onChange={() =>
                        setNewInvite({
                          ...newInvite,
                          projectIds: toggleProjectInList(
                            newInvite.projectIds,
                            proj.id
                          ),
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>{proj.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </PainelLateral>

      <ConfirmarExclusao
        isOpen={!!inviteToDelete}
        title="Revogar Convite"
        description={`Deseja revogar o convite para "${inviteToDelete?.email}"?`}
        confirmLabel="Revogar"
        onCancel={() => setInviteToDelete(null)}
        onConfirm={async () => {
          if (!inviteToDelete) return;
          await deleteAdminInvite(inviteToDelete.email);
          recordAuditEvent({
            action: 'delete_admin_invite',
            collection: 'admin_invites',
            itemId: inviteToDelete.email,
            afterSummary: `Convite revogado: ${inviteToDelete.email}`,
            role: profile.role,
          });
          setInviteToDelete(null);
          await loadUsersAndInvites();
        }}
      />
    </div>
  );
};
