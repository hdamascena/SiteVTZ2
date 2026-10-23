import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Trash2,
  Award,
  Plus,
  Edit3,
  Trophy,
} from 'lucide-react';
import type { AdminUserProfile } from '../types.ts';
import { canDeleteRecords } from '../permissions.ts';
import {
  CampoSensivelMascara,
  CampoTexto,
  SeloSensivel,
} from '../components/CampoTexto.tsx';
import { Tabela, type ColunaTabela } from '../components/Tabela.tsx';
import {
  PainelLateral,
  type SaveIndicatorState,
} from '../components/PainelLateral.tsx';
import { ConfirmarExclusao } from '../components/ConfirmarExclusao.tsx';
import {
  useClubData,
  type ContactMessageRecord,
} from '../../context/ClubDataContext.tsx';
import type {
  DonationPledgeRecord,
  ScoutInquiryRecord,
  VolunteerApplicationRecord,
  MatchResultRecord,
  ClubTrophyRecord,
} from '../../types/index.ts';

interface ComunidadeViewProps {
  profile: AdminUserProfile;
  initialSubTab?: string;
  onScheduleUndoDelete: (
    label: string,
    performDelete: () => void,
    undoRestore: () => void
  ) => void;
}

export const ComunidadeView: React.FC<ComunidadeViewProps> = ({
  profile,
  initialSubTab,
  onScheduleUndoDelete,
}) => {
  const {
    contactMessages,
    scoutInquiries,
    siteSettings,
    addDonationPledge,
    saveAdminChanges,
    recordAuditEvent,
  } = useClubData();

  const role = profile.role;

  const allowedTabs = useMemo(() => {
    if (role === 'financeiro') return ['doacoes'];
    if (role === 'parceiro') return ['olheiros'];
    return ['mensagens', 'olheiros', 'voluntarios', 'doacoes', 'jogos', 'trofeus'];
  }, [role]);

  const [activeTab, setActiveTab] = useState<string>(
    initialSubTab && allowedTabs.includes(initialSubTab)
      ? initialSubTab
      : allowedTabs[0]
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Donation modal for visitante / apoiador
  const [pledgeDrawerOpen, setPledgeDrawerOpen] = useState(false);
  const [pledgeSaveState, setPledgeSaveState] =
    useState<SaveIndicatorState>('idle');
  const [pledgeAmount, setPledgeAmount] = useState('65');
  const [pledgePurpose, setPledgePurpose] = useState(
    'Kit Uniforme & Material Esportivo'
  );
  const [pledgeMessage, setPledgeMessage] = useState('');

  // Match & Trophy drawers
  const [draftMatch, setDraftMatch] = useState<MatchResultRecord | null>(null);
  const [draftTrophy, setDraftTrophy] = useState<ClubTrophyRecord | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'msg' | 'scout' | 'vol' | 'pledge' | 'match' | 'trophy';
    id: string;
    name: string;
  } | null>(null);

  const pledges = siteSettings.donationPledges || [];
  const volunteers = siteSettings.volunteers || [];
  const matchResults = siteSettings.matchResults || [];
  const clubTrophies = siteSettings.clubTrophies || [];
  const visiblePledges = pledges;

  const handleConfirmDonation = async (pledge: DonationPledgeRecord) => {
    const updatedPledges = pledges.map((p) =>
      p.id === pledge.id ? { ...p, status: 'confirmado' as const } : p
    );
    saveAdminChanges({
      siteSettings: {
        ...siteSettings,
        donationPledges: updatedPledges,
      },
      toastMessage: `Doação PIX de "${pledge.donorName}" confirmada!`,
      logDetails: `Doação ${pledge.protocol} confirmada por ${profile.email}.`,
    });

    recordAuditEvent({
      action: 'CONFIRMAR_DOACAO_PIX',
      collection: 'donation_pledges',
      itemId: pledge.id,
      role: profile.role,
      beforeSummary: 'registrado',
      afterSummary: `confirmado (${pledge.donorName})`,
    });
  };

  const handleMarkMessageRead = (msg: ContactMessageRecord) => {
    const updated = contactMessages.map((m) =>
      m.id === msg.id ? { ...m, read: !m.read } : m
    );
    saveAdminChanges({
      contactMessages: updated,
      toastMessage: `Mensagem de ${msg.name} marcada como ${
        !msg.read ? 'lida' : 'não lida'
      }.`,
    });
  };

  const handleUpdateScoutStatus = (
    scout: ScoutInquiryRecord,
    status: ScoutInquiryRecord['status']
  ) => {
    const updated = scoutInquiries.map((s) =>
      s.id === scout.id ? { ...s, status } : s
    );
    saveAdminChanges({
      scoutInquiries: updated,
      toastMessage: `Solicitação ${scout.protocol} atualizada para ${status}.`,
    });
  };

  const handleUpdateVolunteerStatus = (
    vol: VolunteerApplicationRecord,
    status: VolunteerApplicationRecord['status']
  ) => {
    const updated = volunteers.map((v) =>
      v.id === vol.id ? { ...v, status } : v
    );
    saveAdminChanges({
      siteSettings: { ...siteSettings, volunteers: updated },
      toastMessage: `Voluntário ${vol.name} atualizado para ${status}.`,
    });
  };

  const handleCreateDonationPledge = (e: React.FormEvent) => {
    e.preventDefault();
    setPledgeSaveState('saving');
    const protocol = `PIX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    addDonationPledge({
      id: `pledge-${Date.now()}`,
      protocol,
      donorName: profile.nome,
      donorEmail: profile.email,
      userId: profile.uid,
      amount: Number(pledgeAmount) || 50,
      purpose: pledgePurpose,
      date: new Date().toLocaleDateString('pt-BR'),
      message: pledgeMessage.trim() || undefined,
      status: 'registrado',
    });
    setTimeout(() => {
      setPledgeSaveState('saved');
      setPledgeDrawerOpen(false);
      setPledgeSaveState('idle');
    }, 300);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.type === 'msg') {
      const snap = [...contactMessages];
      const next = contactMessages.filter((m) => m.id !== target.id);
      onScheduleUndoDelete(
        `Mensagem de "${target.name}"`,
        () => saveAdminChanges({ contactMessages: next }),
        () => saveAdminChanges({ contactMessages: snap })
      );
    } else if (target.type === 'scout') {
      const snap = [...scoutInquiries];
      const next = scoutInquiries.filter((s) => s.id !== target.id);
      onScheduleUndoDelete(
        `Olheiro "${target.name}"`,
        () => saveAdminChanges({ scoutInquiries: next }),
        () => saveAdminChanges({ scoutInquiries: snap })
      );
    } else if (target.type === 'vol') {
      const snap = [...volunteers];
      const next = volunteers.filter((v) => v.id !== target.id);
      onScheduleUndoDelete(
        `Voluntário "${target.name}"`,
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, volunteers: next },
          }),
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, volunteers: snap },
          })
      );
    } else if (target.type === 'pledge') {
      const snap = [...pledges];
      const next = pledges.filter((p) => p.id !== target.id);
      onScheduleUndoDelete(
        `Doação de "${target.name}"`,
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, donationPledges: next },
          }),
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, donationPledges: snap },
          })
      );
    } else if (target.type === 'match') {
      const snap = [...matchResults];
      const next = matchResults.filter((m) => m.id !== target.id);
      onScheduleUndoDelete(
        `Jogo "${target.name}"`,
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, matchResults: next },
          }),
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, matchResults: snap },
          })
      );
    } else if (target.type === 'trophy') {
      const snap = [...clubTrophies];
      const next = clubTrophies.filter((t) => t.id !== target.id);
      onScheduleUndoDelete(
        `Troféu "${target.name}"`,
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, clubTrophies: next },
          }),
        () =>
          saveAdminChanges({
            siteSettings: { ...siteSettings, clubTrophies: snap },
          })
      );
    }
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMatch) return;
    const exists = matchResults.some((m) => m.id === draftMatch.id);
    const next = exists
      ? matchResults.map((m) => (m.id === draftMatch.id ? draftMatch : m))
      : [draftMatch, ...matchResults];
    saveAdminChanges({
      siteSettings: { ...siteSettings, matchResults: next },
      toastMessage: `Jogo "${draftMatch.homeTeam} x ${draftMatch.awayTeam}" salvo!`,
    });
    setDraftMatch(null);
  };

  const handleSaveTrophy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTrophy) return;
    const exists = clubTrophies.some((t) => t.id === draftTrophy.id);
    const next = exists
      ? clubTrophies.map((t) => (t.id === draftTrophy.id ? draftTrophy : t))
      : [draftTrophy, ...clubTrophies];
    saveAdminChanges({
      siteSettings: { ...siteSettings, clubTrophies: next },
      toastMessage: `Troféu "${draftTrophy.title}" salvo!`,
    });
    setDraftTrophy(null);
  };

  const msgColumns: ColunaTabela<ContactMessageRecord>[] = [
    {
      id: 'remetente',
      header: 'Remetente / Data',
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {m.name}
          </span>
          <span className="text-[11px] text-slate-500">{m.date}</span>
        </div>
      ),
    },
    {
      id: 'contato',
      header: 'Contato (Sensível)',
      render: (m) => (
        <div className="space-y-0.5">
          <div>
            <CampoSensivelMascara
              value={m.phone}
              type="phone"
              itemLabel={m.name}
              collection="contact_messages"
              itemId={m.id}
              onRevealAudit={(p) => recordAuditEvent({ ...p, role })}
            />
          </div>
          <div>
            <CampoSensivelMascara
              value={m.email}
              type="email"
              itemLabel={m.name}
              collection="contact_messages"
              itemId={m.id}
              onRevealAudit={(p) => recordAuditEvent({ ...p, role })}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'mensagem',
      header: 'Assunto & Mensagem',
      render: (m) => (
        <div className="max-w-md">
          <span className="font-semibold text-[#0284c7] dark:text-sky-400 block">
            {m.subject}
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {m.message}
          </p>
        </div>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (m) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleMarkMessageRead(m)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              m.read
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {m.read ? 'Lida' : 'Marcar Lida'}
          </button>
          {canDeleteRecords(role) && (
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({ type: 'msg', id: m.id, name: m.name })
              }
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const scoutColumns: ColunaTabela<ScoutInquiryRecord>[] = [
    {
      id: 'olheiro',
      header: 'Observador / Clube',
      render: (s) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {s.scoutName} ({s.organization})
          </span>
          <span className="font-mono text-[11px] text-[#0284c7]">
            {s.protocol} · {s.createdAt}
          </span>
        </div>
      ),
    },
    {
      id: 'atleta',
      header: 'Atleta / Categoria',
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            {s.targetPlayerName || s.targetCategory}
          </span>
          <span className="text-[11px] text-slate-500">{s.projectName}</span>
        </div>
      ),
    },
    {
      id: 'contato',
      header: 'Contato (Sensível)',
      render: (s) => (
        <div className="space-y-0.5">
          <CampoSensivelMascara
            value={s.phone}
            type="phone"
            itemLabel={s.scoutName}
            collection="scout_inquiries"
            itemId={s.id}
            onRevealAudit={(p) => recordAuditEvent({ ...p, role })}
          />
        </div>
      ),
    },
    {
      id: 'acoes',
      header: 'Status',
      align: 'right',
      render: (s) =>
        role === 'parceiro' ? (
          <span className="font-mono text-xs font-bold text-sky-600">
            {s.status}
          </span>
        ) : (
          <div className="inline-flex items-center gap-1.5">
            <select
              value={s.status}
              onChange={(e) =>
                handleUpdateScoutStatus(
                  s,
                  e.target.value as ScoutInquiryRecord['status']
                )
              }
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="nova">Nova</option>
              <option value="em_analise">Em Análise</option>
              <option value="agendada">Agendada</option>
              <option value="concluida">Concluída</option>
            </select>
            {canDeleteRecords(role) && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    type: 'scout',
                    id: s.id,
                    name: s.scoutName,
                  })
                }
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ),
    },
  ];

  const volColumns: ColunaTabela<VolunteerApplicationRecord>[] = [
    {
      id: 'nome',
      header: 'Voluntário / Área',
      render: (v) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {v.name}
          </span>
          <span className="text-[11px] text-[#0284c7]">{v.area}</span>
        </div>
      ),
    },
    {
      id: 'contato',
      header: 'Contato (Sensível)',
      render: (v) => (
        <CampoSensivelMascara
          value={v.contactInfo}
          type={v.contactInfo.includes('@') ? 'email' : 'phone'}
          itemLabel={v.name}
          collection="volunteer_applications"
          itemId={v.id}
          onRevealAudit={(p) => recordAuditEvent({ ...p, role })}
        />
      ),
    },
    {
      id: 'disp',
      header: 'Disponibilidade',
      render: (v) => <span className="text-xs">{v.availability}</span>,
    },
    {
      id: 'acoes',
      header: 'Status',
      align: 'right',
      render: (v) => (
        <div className="inline-flex items-center gap-1.5">
          <select
            value={v.status}
            onChange={(e) =>
              handleUpdateVolunteerStatus(
                v,
                e.target.value as VolunteerApplicationRecord['status']
              )
            }
            className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="novo">Novo</option>
            <option value="em_analise">Em Análise</option>
            <option value="ativo">Ativo</option>
          </select>
          {canDeleteRecords(role) && (
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({ type: 'vol', id: v.id, name: v.name })
              }
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const pledgeColumns: ColunaTabela<DonationPledgeRecord>[] = [
    {
      id: 'doador',
      header: 'Apoiador / Protocolo',
      render: (d) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {d.donorName}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {d.protocol} · {d.date}
          </span>
        </div>
      ),
    },
    {
      id: 'valor',
      header: 'Valor PIX',
      render: (d) => (
        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
          R$ {Number(d.amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: 'finalidade',
      header: 'Destinação',
      render: (d) => <span className="text-xs">{d.purpose}</span>,
    },
    {
      id: 'status',
      header: 'Status PIX',
      align: 'right',
      render: (d) => (
        <div className="inline-flex items-center gap-2">
          {d.status === 'confirmado' ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Confirmado</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleConfirmDonation(d)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmar PIX</span>
            </button>
          )}
          {canDeleteRecords(role) && (
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'pledge',
                  id: d.id,
                  name: d.donorName,
                })
              }
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Segmented Control Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
          {allowedTabs.includes('mensagens') && (
            <button
              type="button"
              onClick={() => setActiveTab('mensagens')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'mensagens'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Mensagens ({contactMessages.length})
            </button>
          )}
          {allowedTabs.includes('olheiros') && (
            <button
              type="button"
              onClick={() => setActiveTab('olheiros')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'olheiros'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Olheiros & Captação ({scoutInquiries.length})
            </button>
          )}
          {allowedTabs.includes('voluntarios') && (
            <button
              type="button"
              onClick={() => setActiveTab('voluntarios')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'voluntarios'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Voluntários ({volunteers.length})
            </button>
          )}
          {allowedTabs.includes('doacoes') && (
            <button
              type="button"
              onClick={() => setActiveTab('doacoes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'doacoes'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Doações PIX ({visiblePledges.length})
            </button>
          )}
          {allowedTabs.includes('jogos') && (
            <button
              type="button"
              onClick={() => setActiveTab('jogos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'jogos'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Jogos & Placares ({matchResults.length})
            </button>
          )}
          {allowedTabs.includes('trofeus') && (
            <button
              type="button"
              onClick={() => setActiveTab('trofeus')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'trofeus'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Troféus ({clubTrophies.length})
            </button>
          )}
        </div>

        <SeloSensivel level="sensível" />
      </div>

      {activeTab === 'mensagens' && (
        <Tabela
          items={contactMessages.filter(
            (m) =>
              !searchQuery ||
              m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.subject.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          columns={msgColumns}
          keyExtractor={(m) => m.id}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {activeTab === 'olheiros' && (
        <Tabela
          items={scoutInquiries.filter(
            (s) =>
              !searchQuery ||
              s.scoutName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.organization.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          columns={scoutColumns}
          keyExtractor={(s) => s.id}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {activeTab === 'voluntarios' && (
        <Tabela
          items={volunteers.filter(
            (v) =>
              !searchQuery ||
              v.name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          columns={volColumns}
          keyExtractor={(v) => v.id}
          searchQuery={searchQuery}
        />
      )}

      {activeTab === 'doacoes' && (
        <Tabela
          items={visiblePledges.filter(
            (d) =>
              !searchQuery ||
              d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              d.protocol.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          columns={pledgeColumns}
          keyExtractor={(d) => d.id}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          headerActions={
            <button
              type="button"
              onClick={() => setPledgeDrawerOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Apoio PIX</span>
            </button>
          }
        />
      )}

      {activeTab === 'jogos' && (
        <Tabela
          items={matchResults.filter(
            (m) =>
              !searchQuery ||
              m.competition.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          columns={[
            {
              id: 'confronto',
              header: 'Confronto / Competição',
              render: (m) => (
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {m.homeTeam} {m.status === 'encerrado' ? `${m.homeScore} x ${m.awayScore}` : 'vs'} {m.awayTeam}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {m.competition} · {m.category}
                  </span>
                </div>
              ),
            },
            {
              id: 'data',
              header: 'Data / Local',
              render: (m) => (
                <span className="text-xs font-mono">
                  {m.date} · {m.location}
                </span>
              ),
            },
            {
              id: 'acoes',
              header: 'Ações',
              align: 'right',
              render: (m) => (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDraftMatch({ ...m })}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {canDeleteRecords(role) && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'match',
                          id: m.id,
                          name: `${m.homeTeam} x ${m.awayTeam}`,
                        })
                      }
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          keyExtractor={(m) => m.id}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          headerActions={
            <button
              type="button"
              onClick={() =>
                setDraftMatch({
                  id: `match-${Date.now()}`,
                  competition: 'Festival Esportivo Vitalizar',
                  category: 'Sub-13',
                  date: new Date().toLocaleDateString('pt-BR'),
                  location: 'Polo EMEF São Jorge · Cariacica',
                  homeTeam: 'Vitalizar',
                  awayTeam: 'Convidado',
                  homeScore: 0,
                  awayScore: 0,
                  status: 'encerrado',
                })
              }
              className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Jogo / Placar</span>
            </button>
          }
        />
      )}

      {activeTab === 'trofeus' && (
        <Tabela
          items={clubTrophies.filter(
            (t) =>
              !searchQuery ||
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.competition.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          columns={[
            {
              id: 'titulo',
              header: 'Conquista / Competição',
              render: (t) => (
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {t.title} ({t.year})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t.competition} · {t.category} · {t.placement}
                  </span>
                </div>
              ),
            },
            {
              id: 'acoes',
              header: 'Ações',
              align: 'right',
              render: (t) => (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDraftTrophy({ ...t })}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {canDeleteRecords(role) && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'trophy',
                          id: t.id,
                          name: t.title,
                        })
                      }
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          keyExtractor={(t) => t.id}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          headerActions={
            <button
              type="button"
              onClick={() =>
                setDraftTrophy({
                  id: `trophy-${Date.now()}`,
                  title: '',
                  competition: '',
                  year: String(new Date().getFullYear()),
                  category: 'Sub-13',
                  placement: '1º Lugar - Campeão',
                  description: '',
                })
              }
              className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Novo Troféu</span>
            </button>
          }
        />
      )}

      <PainelLateral
        isOpen={Boolean(draftMatch)}
        onClose={() => setDraftMatch(null)}
        title="Jogo / Placar da Comunidade"
        subtitle={draftMatch ? `${draftMatch.homeTeam} x ${draftMatch.awayTeam}` : ''}
        onSave={handleSaveMatch}
        saveLabel="Salvar Jogo"
      >
        {draftMatch && (
          <div className="space-y-3">
            <CampoTexto
              label="Competição / Festival"
              value={draftMatch.competition}
              onChange={(v) => setDraftMatch({ ...draftMatch, competition: v })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto
                label="Categoria / Modalidade"
                value={draftMatch.category}
                onChange={(v) => setDraftMatch({ ...draftMatch, category: v })}
              />
              <CampoTexto
                label="Data"
                value={draftMatch.date}
                onChange={(v) => setDraftMatch({ ...draftMatch, date: v })}
              />
            </div>
            <CampoTexto
              label="Local"
              value={draftMatch.location}
              onChange={(v) => setDraftMatch({ ...draftMatch, location: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto
                label="Time Mandante"
                value={draftMatch.homeTeam}
                onChange={(v) => setDraftMatch({ ...draftMatch, homeTeam: v })}
              />
              <CampoTexto
                label="Time Visitante"
                value={draftMatch.awayTeam}
                onChange={(v) => setDraftMatch({ ...draftMatch, awayTeam: v })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CampoTexto
                label="Placar Mandante"
                type="number"
                value={String(draftMatch.homeScore)}
                onChange={(v) =>
                  setDraftMatch({ ...draftMatch, homeScore: Number(v) || 0 })
                }
              />
              <CampoTexto
                label="Placar Visitante"
                type="number"
                value={String(draftMatch.awayScore)}
                onChange={(v) =>
                  setDraftMatch({ ...draftMatch, awayScore: Number(v) || 0 })
                }
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Situação
                </label>
                <select
                  value={draftMatch.status}
                  onChange={(e) =>
                    setDraftMatch({
                      ...draftMatch,
                      status: e.target.value as 'encerrado' | 'agendado',
                    })
                  }
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="encerrado">Encerrado</option>
                  <option value="agendado">Agendado</option>
                </select>
              </div>
            </div>
            <CampoTexto
              label="Destaque da Partida (opcional)"
              value={draftMatch.mvpPlayerName || ''}
              onChange={(v) => setDraftMatch({ ...draftMatch, mvpPlayerName: v })}
            />
          </div>
        )}
      </PainelLateral>

      <PainelLateral
        isOpen={Boolean(draftTrophy)}
        onClose={() => setDraftTrophy(null)}
        title="Troféu / Conquista da Galeria"
        subtitle={draftTrophy?.title}
        onSave={handleSaveTrophy}
        saveLabel="Salvar Troféu"
      >
        {draftTrophy && (
          <div className="space-y-3">
            <CampoTexto
              label="Título da Conquista"
              value={draftTrophy.title}
              onChange={(v) => setDraftTrophy({ ...draftTrophy, title: v })}
              required
            />
            <CampoTexto
              label="Competição / Evento"
              value={draftTrophy.competition}
              onChange={(v) => setDraftTrophy({ ...draftTrophy, competition: v })}
            />
            <div className="grid grid-cols-3 gap-3">
              <CampoTexto
                label="Ano"
                value={draftTrophy.year}
                onChange={(v) => setDraftTrophy({ ...draftTrophy, year: v })}
              />
              <CampoTexto
                label="Categoria"
                value={draftTrophy.category}
                onChange={(v) => setDraftTrophy({ ...draftTrophy, category: v })}
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Colocação
                </label>
                <select
                  value={draftTrophy.placement}
                  onChange={(e) =>
                    setDraftTrophy({
                      ...draftTrophy,
                      placement: e.target.value as ClubTrophyRecord['placement'],
                    })
                  }
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="1º Lugar - Campeão">1º Lugar - Campeão</option>
                  <option value="2º Lugar - Vice-Campeão">2º Lugar - Vice-Campeão</option>
                  <option value="3º Lugar - Destaque">3º Lugar - Destaque</option>
                  <option value="Troféu Fair Play / Impacto Social">Troféu Fair Play / Impacto Social</option>
                </select>
              </div>
            </div>
            <CampoTexto
              label="Descrição"
              type="textarea"
              value={draftTrophy.description}
              onChange={(v) => setDraftTrophy({ ...draftTrophy, description: v })}
            />
          </div>
        )}
      </PainelLateral>

      <PainelLateral
        isOpen={pledgeDrawerOpen}
        onClose={() => setPledgeDrawerOpen(false)}
        title="Registrar Doação PIX — Apoiador Vitalizar"
        subtitle="Visitantes que registram doação recebem o perfil de Apoiador"
        saveState={pledgeSaveState}
        onSave={handleCreateDonationPledge}
        saveLabel="Confirmar Doação PIX"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              Chave PIX CNPJ Oficial:
            </span>
            <span className="font-mono font-bold text-[#0284c7] dark:text-sky-400">
              {siteSettings.pixConfig?.pixKeyFormatted || '63.083.068/0001-00'}
            </span>
          </div>

          <CampoTexto
            label="Valor da Doação (R$)"
            type="number"
            value={pledgeAmount}
            onChange={setPledgeAmount}
            required
            classification="sensível"
          />

          <CampoTexto
            label="Destinação do Apoio"
            value={pledgePurpose}
            onChange={setPledgePurpose}
            classification="público"
          />

          <CampoTexto
            label="Mensagem de Incentivo (opcional)"
            type="textarea"
            value={pledgeMessage}
            onChange={setPledgeMessage}
            classification="público"
          />
        </div>
      </PainelLateral>

      <ConfirmarExclusao
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.name || ''}
        itemTypeLabel="registro"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
