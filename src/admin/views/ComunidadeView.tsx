import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Trash2,
  Award,
  Plus,
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
} from '../../types/index.ts';
import { promoteVisitorToSupporter } from '../../services/firebaseService.ts';

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
  const isCommunityRole = role === 'visitante' || role === 'apoiador';

  const allowedTabs = useMemo(() => {
    if (role === 'financeiro') return ['doacoes'];
    if (role === 'parceiro') return ['olheiros'];
    if (isCommunityRole) return ['doacoes'];
    return ['mensagens', 'olheiros', 'voluntarios', 'doacoes'];
  }, [role, isCommunityRole]);

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

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'msg' | 'scout' | 'vol' | 'pledge';
    id: string;
    name: string;
  } | null>(null);

  const pledges = siteSettings.donationPledges || [];
  const volunteers = siteSettings.volunteers || [];

  const visiblePledges = useMemo(() => {
    if (isCommunityRole) {
      return pledges.filter(
        (d) =>
          (d.userId && d.userId === profile.uid) ||
          (d.donorEmail &&
            d.donorEmail.toLowerCase() === profile.email.toLowerCase())
      );
    }
    return pledges;
  }, [pledges, isCommunityRole, profile]);

  const handleConfirmDonationAndPromote = async (pledge: DonationPledgeRecord) => {
    const updatedPledges = pledges.map((p) =>
      p.id === pledge.id ? { ...p, status: 'confirmado' as const } : p
    );
    saveAdminChanges({
      siteSettings: {
        ...siteSettings,
        donationPledges: updatedPledges,
      },
      toastMessage: `Doação de "${pledge.donorName}" confirmada! Perfil atualizado para Apoiador.`,
      logDetails: `Doação ${pledge.protocol} confirmada por ${profile.email}.`,
    });

    if (pledge.userId) {
      await promoteVisitorToSupporter(pledge.userId).catch(() => {});
    }

    recordAuditEvent({
      action: 'CONFIRMAR_DOACAO_PROMOVER_APOIADOR',
      collection: 'donation_pledges',
      itemId: pledge.id,
      role: profile.role,
      beforeSummary: 'registrado',
      afterSummary: `confirmado (Apoiador: ${pledge.donorName})`,
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
    }
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
      header: 'Status / Perfil Apoiador',
      align: 'right',
      render: (d) => (
        <div className="inline-flex items-center gap-2">
          {d.status === 'confirmado' ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Confirmado (Apoiador)</span>
            </span>
          ) : !isCommunityRole ? (
            <button
              type="button"
              onClick={() => handleConfirmDonationAndPromote(d)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmar & Dar Perfil Apoiador</span>
            </button>
          ) : (
            <span className="text-xs text-amber-600 font-semibold">
              Em conferência
            </span>
          )}
          {canDeleteRecords(role) && !isCommunityRole && (
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
              {isCommunityRole
                ? `Minhas Doações PIX (${visiblePledges.length})`
                : `Doações PIX & Apoiadores (${visiblePledges.length})`}
            </button>
          )}
        </div>

        {!isCommunityRole && <SeloSensivel level="sensível" />}
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
