import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  Search,
  ExternalLink,
  Save,
  Eye,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import type { AdminSectionId, AdminUserProfile } from '../types.ts';
import { canDeleteRecords } from '../permissions.ts';
import { useClubData } from '../../context/ClubDataContext.tsx';
import type {
  VitalizarProject,
  ProjectTeamClass,
  NewsArticle,
  VitalizarEvent,
  PastEventPhoto,
  Sponsor,
  FacilityPolo,
  TransparencyDocument,
} from '../../types/index.ts';
import { syncProjectSpotsAndTeams } from '../../types/index.ts';
import {
  CampoTexto,
  CampoUploadImagem,
  CampoUploadDocumento,
  CampoUploadMultiplasFotos,
  CampoUploadAnexos,
} from '../components/CampoTexto.tsx';
import { Tabela, type ColunaTabela } from '../components/Tabela.tsx';
import { PainelLateral } from '../components/PainelLateral.tsx';
import { ConfirmarExclusao } from '../components/ConfirmarExclusao.tsx';
import {
  processImageUpload,
  processAttachmentUpload,
  TRANSPARENCY_FINANCE_SAMPLE_CSV,
  parseTransparencyFinancialCsv,
  downloadCsvTemplate,
} from '../../utils/fileUpload.ts';

export type ConteudoSection = Extract<
  AdminSectionId,
  | 'projetos'
  | 'noticias'
  | 'eventos'
  | 'galeria'
  | 'patrocinadores'
  | 'polos'
  | 'transparencia'
  | 'configuracoes'
>;

interface ConteudoViewProps {
  section: ConteudoSection;
  profile: AdminUserProfile;
  initialQuery?: Record<string, string>;
  onRegisterUndo: (label: string, restoreFn: () => Promise<void>) => void;
}

export const ConteudoView: React.FC<ConteudoViewProps> = ({
  section,
  profile,
  initialQuery,
  onRegisterUndo,
}) => {
  const {
    clubInfo,
    siteSettings,
    projects,
    newsArticles,
    events,
    galleryAlbums,
    sponsors,
    facilityPolos,
    transparencyDocs,
    saveAdminChanges,
    recordAuditEvent,
  } = useClubData();

  const role = profile.role;
  const canDelete = canDeleteRecords(role);

  // Read-only rules per section
  const isReadOnly = useMemo(() => {
    if (role === 'super_admin' || role === 'admin') return false;
    if (role === 'editor') {
      return section === 'transparencia';
    }
    if (role === 'financeiro') {
      return section !== 'transparencia' && section !== 'configuracoes';
    }
    if (role === 'parceiro') {
      return section !== 'patrocinadores';
    }
    return true;
  }, [role, section]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    initialQuery?.status || 'todos'
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Draft states for drawer editing
  const [draftProject, setDraftProject] = useState<VitalizarProject | null>(null);
  const [draftNews, setDraftNews] = useState<NewsArticle | null>(null);
  const [draftEvent, setDraftEvent] = useState<VitalizarEvent | null>(null);
  const [draftAlbum, setDraftAlbum] = useState<PastEventPhoto | null>(null);
  const [draftSponsor, setDraftSponsor] = useState<Sponsor | null>(null);
  const [draftPolo, setDraftPolo] = useState<FacilityPolo | null>(null);
  const [draftDoc, setDraftDoc] = useState<TransparencyDocument | null>(null);

  // Settings local form
  const [draftClub, setDraftClub] = useState(clubInfo);
  const [draftPix, setDraftPix] = useState(
    siteSettings.pixConfig || {
      pixKey: '63083068000100',
      pixKeyFormatted: '63.083.068/0001-00',
      keyType: 'CNPJ' as const,
      beneficiaryName: 'ASSOC ESPORTIVA VITALIZAR',
      city: 'CARIACICA',
      bankName: 'Banco Oficial · Conta Institucional',
      suggestedAmounts: [],
    }
  );
  const [draftBanner, setDraftBanner] = useState(
    siteSettings.announcementBanner || {
      enabled: false,
      text: '',
      linkLabel: 'Saiba mais',
      linkTarget: 'projetos',
    }
  );

  const triggerSavedIndicator = () => {
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2200);
  };

  // ==================== 1. PROJETOS ====================
  if (section === 'projetos') {
    const visibleProjects = projects.filter(
      (p) =>
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
    );

    const openEditProject = (proj?: VitalizarProject) => {
      if (proj) {
        setDraftProject(syncProjectSpotsAndTeams({ ...proj }));
      } else {
        setDraftProject(
          syncProjectSpotsAndTeams({
            id: `proj-${Date.now()}`,
            name: '',
            projectNumber: '',
            incentiveLaw: 'Lei de Incentivo ao Esporte',
            modalities: ['Voleibol', 'Futsal'],
            teams: [
              {
                id: `time-${Date.now()}`,
                name: 'Time 01',
                modality: 'Voleibol',
                category: '9 a 11 anos',
                gender: 'Misto',
                schedule: '2ª, 4ª e 6ª · 08h00 às 09h00',
                polo: 'EMEF São Jorge (Rio Marinho)',
                totalSpots: 20,
              },
            ],
            category: 'esporte_educacional',
            targetAudience: 'Crianças e adolescentes de 09 a 15 anos',
            description: '',
            schedule: 'Segundas a Sextas · Manhã e Tarde',
            location: 'EMEF São Jorge e EEEFM Alzira Ramos · Cariacica/ES',
            coordinator: 'Coordenação Técnica Vitalizar',
            fundingSource: 'Lei de Incentivo ao Esporte',
            imageUrl:
              'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80',
            totalSpots: 20,
            filledSpots: 0,
            availableSpots: 20,
            participants: [],
          })
        );
      }
      setDrawerOpen(true);
    };

    const handleSaveProject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftProject || isReadOnly) return;
      setSaveState('saving');
      const syncedDraft = syncProjectSpotsAndTeams(draftProject);
      const exists = projects.some((p) => p.id === syncedDraft.id);
      const next = exists
        ? projects.map((p) => (p.id === syncedDraft.id ? syncedDraft : p))
        : [syncedDraft, ...projects];

      saveAdminChanges({ projects: next }, `Projeto salvo: ${syncedDraft.name}`);
      recordAuditEvent({
        action: exists ? 'update_project' : 'create_project',
        collection: 'projects',
        itemId: syncedDraft.id,
        afterSummary: `${syncedDraft.name} (${syncedDraft.teams?.length || 0} times, ${syncedDraft.totalSpots} vagas)`,
        role,
      });
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const updateDraftTeams = (nextTeams: ProjectTeamClass[]) => {
      if (!draftProject) return;
      const derivedModalities = Array.from(
        new Set(nextTeams.map((t) => t.modality.trim()).filter(Boolean))
      );
      setDraftProject(
        syncProjectSpotsAndTeams({
          ...draftProject,
          teams: nextTeams,
          modalities:
            derivedModalities.length > 0
              ? derivedModalities
              : draftProject.modalities,
        })
      );
    };

    const columns: ColunaTabela<VitalizarProject>[] = [
      {
        id: 'name',
        header: 'Projeto (Lei de Incentivo)',
        render: (p) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {p.name}
            </span>
            <span className="text-[11px] text-slate-500">
              {p.incentiveLaw || p.category}
              {p.projectNumber ? ` · Nº ${p.projectNumber}` : ''} ·{' '}
              {(p.modalities || []).join(', ') || p.targetAudience}
            </span>
          </div>
        ),
      },
      {
        id: 'teams',
        header: 'Modalidades & Times',
        render: (p) => (
          <div className="text-xs">
            <span className="font-bold text-[#0284c7] dark:text-sky-400 block">
              {(p.teams || []).length} Times / Turmas
            </span>
            <span className="text-[11px] text-slate-500">{p.location}</span>
          </div>
        ),
      },
      {
        id: 'participants',
        header: 'Preenchidas / Total (Disp.)',
        align: 'right',
        render: (p) => {
          const synced = syncProjectSpotsAndTeams(p);
          const total = synced.totalSpots ?? 300;
          const filled = synced.filledSpots ?? 0;
          const avail = synced.availableSpots ?? Math.max(0, total - filled);
          return (
            <span className="font-mono text-xs font-bold">
              {filled} / {total}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-normal">
                ({avail} disp.)
              </span>
            </span>
          );
        },
      },
      {
        id: 'coordinator',
        header: 'Coordenação',
        render: (p) => (
          <span className="text-xs text-slate-700 dark:text-slate-300">
            {p.coordinator}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (p) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditProject(p)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={isReadOnly ? 'Visualizar' : 'Editar projeto e times'}
            >
              {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: p.id,
                    label: p.name,
                    onConfirm: async () => {
                      const prev = [...projects];
                      const next = projects.filter((item) => item.id !== p.id);
                      saveAdminChanges({ projects: next }, `Projeto removido: ${p.name}`);
                      onRegisterUndo(`Projeto "${p.name}" excluído`, async () => {
                        saveAdminChanges({ projects: prev }, `Desfeita exclusão: ${p.name}`);
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                title="Excluir projeto"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Projetos (Leis de Incentivo), Modalidades e Times / Turmas
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie os projetos, suas modalidades esportivas e a capacidade de vagas de cada Time/Turma.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar projeto..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => openEditProject()}
                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Projeto</span>
              </button>
            )}
          </div>
        </div>

        <Tabela
          items={visibleProjects}
          columns={columns}
          keyExtractor={(p) => p.id}
          emptyMessage="Nenhum projeto encontrado."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftProject}
          onClose={() => setDrawerOpen(false)}
          title={isReadOnly ? 'Detalhes do Projeto' : 'Editar Projeto, Modalidades & Times'}
          subtitle={draftProject?.name}
          saveState={saveState}
          onSave={!isReadOnly ? handleSaveProject : undefined}
          saveLabel="Salvar Projeto e Times"
        >
          {draftProject && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <CampoTexto
                    label="Nome do Projeto"
                    required
                    disabled={isReadOnly}
                    value={draftProject.name}
                    onChange={(v) => setDraftProject({ ...draftProject, name: v })}
                  />
                </div>
                <CampoTexto
                  label="Nº Processo / SLI"
                  disabled={isReadOnly}
                  value={draftProject.projectNumber || ''}
                  onChange={(v) =>
                    setDraftProject({ ...draftProject, projectNumber: v })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTexto
                  label="Lei de Incentivo / Enquadramento"
                  disabled={isReadOnly}
                  value={draftProject.incentiveLaw || 'Lei de Incentivo ao Esporte'}
                  onChange={(v) =>
                    setDraftProject({ ...draftProject, incentiveLaw: v })
                  }
                />
                <CampoTexto
                  label="Público-Alvo / Faixa Etária"
                  disabled={isReadOnly}
                  value={draftProject.targetAudience}
                  onChange={(v) =>
                    setDraftProject({ ...draftProject, targetAudience: v })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTexto
                  label="Locais de Treino (Polos)"
                  disabled={isReadOnly}
                  value={draftProject.location}
                  onChange={(v) => setDraftProject({ ...draftProject, location: v })}
                />
                <CampoTexto
                  label="Dias e Horários Gerais"
                  disabled={isReadOnly}
                  value={draftProject.schedule}
                  onChange={(v) => setDraftProject({ ...draftProject, schedule: v })}
                />
              </div>

              {/* RESUMO AUTOMÁTICO DE VAGAS */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-sky-50/70 dark:bg-slate-800/70 border border-sky-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Total de Vagas (Soma dos Times)
                  </span>
                  <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {draftProject.totalSpots ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Preenchidas (Atletas)
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[#0284c7]">
                    {(draftProject.participants || []).length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Vagas Disponíveis
                  </span>
                  <span className="text-lg font-extrabold font-mono text-emerald-600">
                    {Math.max(
                      0,
                      (draftProject.totalSpots ?? 0) -
                        (draftProject.participants || []).length
                    )}
                  </span>
                </div>
              </div>

              {/* GESTÃO DE TIMES / TURMAS DO PROJETO */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Times / Turmas e Vagas por Modalidade ({(draftProject.teams || []).length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Cada Time possui seu nome, modalidade, faixa etária, polo e número de vagas.
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const current = draftProject.teams || [];
                        const nextNum = current.length + 1;
                        updateDraftTeams([
                          ...current,
                          {
                            id: `time-${Date.now()}`,
                            name: `Time ${String(nextNum).padStart(2, '0')}`,
                            modality: 'Voleibol',
                            category: '9 a 11 anos',
                            gender: 'Misto',
                            schedule: '2ª, 4ª e 6ª · 08h00 às 09h00',
                            polo: 'EMEF São Jorge (Rio Marinho)',
                            totalSpots: 20,
                          },
                        ]);
                      }}
                      className="px-2.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Time</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {(draftProject.teams || []).map((team, idx) => (
                    <div
                      key={team.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#0284c7]">
                          #{idx + 1} · {team.name} ({team.modality}) — {team.filledSpots ?? 0}/{team.totalSpots} vagas
                        </span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = (draftProject.teams || []).filter(
                                (t) => t.id !== team.id
                              );
                              updateDraftTeams(next);
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Remover Time"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={team.name}
                          onChange={(e) => {
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id ? { ...t, name: e.target.value } : t
                            );
                            updateDraftTeams(next);
                          }}
                          placeholder="Nome (ex: Time 01)"
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={team.modality}
                          onChange={(e) => {
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id ? { ...t, modality: e.target.value } : t
                            );
                            updateDraftTeams(next);
                          }}
                          placeholder="Modalidade (ex: Voleibol)"
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={team.category}
                          onChange={(e) => {
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id ? { ...t, category: e.target.value } : t
                            );
                            updateDraftTeams(next);
                          }}
                          placeholder="Faixa etária (ex: 9 a 11 anos)"
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={team.totalSpots}
                          onChange={(e) => {
                            const spots = Math.max(1, Number(e.target.value) || 20);
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id ? { ...t, totalSpots: spots } : t
                            );
                            updateDraftTeams(next);
                          }}
                          placeholder="Vagas"
                          className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          disabled={isReadOnly}
                          value={team.gender}
                          onChange={(e) => {
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id
                                ? {
                                    ...t,
                                    gender: e.target.value as ProjectTeamClass['gender'],
                                  }
                                : t
                            );
                            updateDraftTeams(next);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="Misto">Misto</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                        </select>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={team.schedule}
                          onChange={(e) => {
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id ? { ...t, schedule: e.target.value } : t
                            );
                            updateDraftTeams(next);
                          }}
                          placeholder="Dias e Horário"
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={team.polo}
                          onChange={(e) => {
                            const next = (draftProject.teams || []).map((t) =>
                              t.id === team.id ? { ...t, polo: e.target.value } : t
                            );
                            updateDraftTeams(next);
                          }}
                          placeholder="Polo / Local de Treino"
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CampoTexto
                label="Coordenador / Responsável"
                disabled={isReadOnly}
                value={draftProject.coordinator}
                onChange={(v) =>
                  setDraftProject({ ...draftProject, coordinator: v })
                }
              />
              <CampoUploadImagem
                label="Imagem de Capa do Projeto"
                disabled={isReadOnly}
                value={draftProject.imageUrl}
                onChange={(v) => setDraftProject({ ...draftProject, imageUrl: v })}
              />
              <CampoTexto
                label="Descrição Completa"
                multiline
                rows={4}
                disabled={isReadOnly}
                value={draftProject.description}
                onChange={(v) =>
                  setDraftProject({ ...draftProject, description: v })
                }
              />
              <CampoUploadAnexos
                label="Regulamentos, Planilhas ou Documentos do Projeto"
                disabled={isReadOnly}
                attachments={draftProject.attachments || []}
                onChange={(att) =>
                  setDraftProject({ ...draftProject, attachments: att })
                }
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Projeto"
          description={`Tem certeza que deseja remover o projeto "${deleteTarget?.label}"? Você poderá desfazer em até 10 segundos.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 2. NOTÍCIAS ====================
  if (section === 'noticias') {
    const filteredNews = newsArticles
      .filter((n) => {
        if (statusFilter === 'rascunho') return n.status === 'rascunho';
        if (statusFilter === 'publicado')
          return (n.status || 'publicado') === 'publicado';
        return true;
      })
      .filter(
        (n) =>
          !search.trim() ||
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.category.toLowerCase().includes(search.toLowerCase())
      );

    const openEditNews = (article?: NewsArticle) => {
      if (article) {
        setDraftNews({ ...article, status: article.status || 'publicado' });
      } else {
        setDraftNews({
          id: `news-${Date.now()}`,
          title: '',
          summary: '',
          content: [''],
          category: 'Esporte & Comunidade',
          date: new Date().toLocaleDateString('pt-BR'),
          imageUrl:
            'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
          author: profile.nome || 'Comunicação Vitalizar',
          status: 'publicado',
        });
      }
      setDrawerOpen(true);
    };

    const handleSaveNews = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftNews || isReadOnly) return;
      setSaveState('saving');
      const exists = newsArticles.some((n) => n.id === draftNews.id);
      const next = exists
        ? newsArticles.map((n) => (n.id === draftNews.id ? draftNews : n))
        : [draftNews, ...newsArticles];
      saveAdminChanges({ newsArticles: next }, `Notícia salva: ${draftNews.title}`);
      recordAuditEvent({
        action: exists ? 'update_news' : 'create_news',
        collection: 'news_articles',
        itemId: draftNews.id,
        afterSummary: `${draftNews.title} (${draftNews.status || 'publicado'})`,
        role,
      });
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const columns: ColunaTabela<NewsArticle>[] = [
      {
        id: 'title',
        header: 'Título da Matéria',
        render: (n) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {n.title}
            </span>
            <span className="text-[11px] text-slate-500">
              {n.category} · Por {n.author || 'Redação'}
            </span>
          </div>
        ),
      },
      {
        id: 'date',
        header: 'Data',
        render: (n) => <span className="font-mono text-xs">{n.date}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        render: (n) => (
          <span
            className={`text-xs font-bold ${
              n.status === 'rascunho'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {n.status === 'rascunho' ? 'Rascunho' : 'Publicado'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (n) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditNews(n)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Editar matéria"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: n.id,
                    label: n.title,
                    onConfirm: async () => {
                      const prev = [...newsArticles];
                      const next = newsArticles.filter((item) => item.id !== n.id);
                      saveAdminChanges(
                        { newsArticles: next },
                        `Notícia excluída: ${n.title}`
                      );
                      onRegisterUndo(`Notícia "${n.title}" excluída`, async () => {
                        saveAdminChanges(
                          { newsArticles: prev },
                          `Desfeita exclusão de notícia: ${n.title}`
                        );
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                title="Excluir matéria"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Notícias e Comunicados
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie matérias publicadas e rascunhos editoriais da Associação.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              <option value="todos">Todos os status</option>
              <option value="publicado">Publicados</option>
              <option value="rascunho">Rascunhos</option>
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar notícia..."
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => openEditNews()}
                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Matéria</span>
              </button>
            )}
          </div>
        </div>

        <Tabela
          items={filteredNews}
          columns={columns}
          keyExtractor={(n) => n.id}
          emptyMessage="Nenhuma notícia encontrada para este filtro."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftNews}
          onClose={() => setDrawerOpen(false)}
          title="Editar Notícia"
          subtitle={draftNews?.title}
          saveState={saveState}
          onSave={!isReadOnly ? handleSaveNews : undefined}
          saveLabel="Salvar Matéria"
        >
          {draftNews && (
            <div className="space-y-4">
              <CampoTexto
                label="Título"
                required
                value={draftNews.title}
                onChange={(v) => setDraftNews({ ...draftNews, title: v })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CampoTexto
                  label="Categoria"
                  value={draftNews.category}
                  onChange={(v) => setDraftNews({ ...draftNews, category: v })}
                />
                <CampoTexto
                  label="Data"
                  value={draftNews.date}
                  onChange={(v) => setDraftNews({ ...draftNews, date: v })}
                />
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status Editorial
                  </label>
                  <select
                    value={draftNews.status || 'publicado'}
                    onChange={(e) =>
                      setDraftNews({
                        ...draftNews,
                        status: e.target.value as 'publicado' | 'rascunho',
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="publicado">Publicado</option>
                    <option value="rascunho">Rascunho</option>
                  </select>
                </div>
              </div>
              <CampoUploadImagem
                label="Imagem de Capa da Matéria"
                disabled={isReadOnly}
                value={draftNews.imageUrl}
                onChange={(v) => setDraftNews({ ...draftNews, imageUrl: v })}
              />
              <CampoTexto
                label="Resumo (Linha Fina)"
                multiline
                rows={2}
                required
                value={draftNews.summary}
                onChange={(v) => setDraftNews({ ...draftNews, summary: v })}
              />
              <CampoTexto
                label="Conteúdo Completo (1 parágrafo por linha)"
                multiline
                rows={6}
                value={
                  Array.isArray(draftNews.content)
                    ? draftNews.content.join('\n\n')
                    : ''
                }
                onChange={(v) =>
                  setDraftNews({
                    ...draftNews,
                    content: v
                      .split(/\n+/)
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
              />
              <CampoUploadAnexos
                label="Anexos e Editais da Matéria (PDF, Imagens, Planilhas)"
                disabled={isReadOnly}
                attachments={draftNews.attachments || []}
                onChange={(att) =>
                  setDraftNews({ ...draftNews, attachments: att })
                }
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Notícia"
          description={`Deseja excluir "${deleteTarget?.label}"? Você poderá desfazer em até 10 segundos.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 3. EVENTOS ====================
  if (section === 'eventos') {
    const filteredEvents = events.filter(
      (ev) =>
        !search.trim() ||
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        ev.location.toLowerCase().includes(search.toLowerCase())
    );

    const openEditEvent = (ev?: VitalizarEvent) => {
      if (ev) {
        setDraftEvent({ ...ev });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setDraftEvent({
          id: `evt-${Date.now()}`,
          title: '',
          category: 'clinica_esportiva',
          categoryLabel: 'Clínica Esportiva',
          date: today,
          formattedDate: new Date().toLocaleDateString('pt-BR'),
          dayNumber: String(new Date().getDate()).padStart(2, '0'),
          monthShort: 'OUT',
          time: '08:30',
          location: 'Polo Rio Marinho · Cariacica',
          address: 'Cariacica - ES',
          targetAudience: 'Comunidade e alunos',
          coordinator: 'Coordenação Técnica Vitalizar',
          capacity: 60,
          availableSpots: 60,
          isFree: true,
          description: '',
          status: 'inscricoes_abertas',
        });
      }
      setDrawerOpen(true);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftEvent || isReadOnly) return;
      setSaveState('saving');
      const exists = events.some((ev) => ev.id === draftEvent.id);
      const next = exists
        ? events.map((ev) => (ev.id === draftEvent.id ? draftEvent : ev))
        : [draftEvent, ...events];
      saveAdminChanges({ events: next }, `Evento salvo: ${draftEvent.title}`);
      recordAuditEvent({
        action: exists ? 'update_event' : 'create_event',
        collection: 'events',
        itemId: draftEvent.id,
        afterSummary: draftEvent.title,
        role,
      });
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const columns: ColunaTabela<VitalizarEvent>[] = [
      {
        id: 'title',
        header: 'Evento',
        render: (ev) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {ev.title}
            </span>
            <span className="text-[11px] text-slate-500">{ev.location}</span>
          </div>
        ),
      },
      {
        id: 'date',
        header: 'Data / Hora',
        render: (ev) => (
          <span className="font-mono text-xs">
            {ev.date} · {ev.time}
          </span>
        ),
      },
      {
        id: 'capacity',
        header: 'Vagas Livres / Total',
        align: 'right',
        render: (ev) => (
          <span className="font-mono text-xs">
            {ev.availableSpots ?? ev.capacity} / {ev.capacity || 50}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (ev) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditEvent(ev)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: ev.id,
                    label: ev.title,
                    onConfirm: async () => {
                      const prev = [...events];
                      const next = events.filter((item) => item.id !== ev.id);
                      saveAdminChanges({ events: next }, `Evento excluído: ${ev.title}`);
                      onRegisterUndo(`Evento "${ev.title}" excluído`, async () => {
                        saveAdminChanges(
                          { events: prev },
                          `Desfeita exclusão de evento: ${ev.title}`
                        );
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Agenda de Eventos e Clínicas
            </h2>
            <p className="text-xs text-slate-500">
              Calendário oficial de festivais esportivos, reuniões e oficinas comunitárias.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar evento..."
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => openEditEvent()}
                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Evento</span>
              </button>
            )}
          </div>
        </div>

        <Tabela
          items={filteredEvents}
          columns={columns}
          keyExtractor={(ev) => ev.id}
          emptyMessage="Nenhum evento cadastrado."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftEvent}
          onClose={() => setDrawerOpen(false)}
          title="Editar Evento"
          subtitle={draftEvent?.title}
          saveState={saveState}
          onSave={!isReadOnly ? handleSaveEvent : undefined}
          saveLabel="Salvar Evento"
        >
          {draftEvent && (
            <div className="space-y-4">
              <CampoTexto
                label="Título do Evento"
                required
                value={draftEvent.title}
                onChange={(v) => setDraftEvent({ ...draftEvent, title: v })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTexto
                  label="Data (AAAA-MM-DD)"
                  value={draftEvent.date}
                  onChange={(v) =>
                    setDraftEvent({ ...draftEvent, date: v, formattedDate: v })
                  }
                />
                <CampoTexto
                  label="Horário"
                  value={draftEvent.time}
                  onChange={(v) => setDraftEvent({ ...draftEvent, time: v })}
                />
              </div>
              <CampoTexto
                label="Local"
                value={draftEvent.location}
                onChange={(v) => setDraftEvent({ ...draftEvent, location: v })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTexto
                  label="Capacidade Total de Vagas"
                  type="number"
                  value={String(draftEvent.capacity ?? 60)}
                  onChange={(v) => {
                    const cap = Math.max(0, Number(v) || 0);
                    setDraftEvent({
                      ...draftEvent,
                      capacity: cap,
                      availableSpots: Math.min(draftEvent.availableSpots ?? cap, cap),
                    });
                  }}
                />
                <CampoTexto
                  label="Vagas Disponíveis"
                  type="number"
                  value={String(draftEvent.availableSpots ?? draftEvent.capacity ?? 60)}
                  onChange={(v) =>
                    setDraftEvent({
                      ...draftEvent,
                      availableSpots: Math.max(0, Number(v) || 0),
                    })
                  }
                />
              </div>
              <CampoTexto
                label="Descrição"
                multiline
                rows={3}
                value={draftEvent.description}
                onChange={(v) =>
                  setDraftEvent({ ...draftEvent, description: v })
                }
              />
              <CampoUploadAnexos
                label="Regulamento, Cronograma ou Autorização do Evento (PDF/Doc)"
                disabled={isReadOnly}
                attachments={draftEvent.attachments || []}
                onChange={(att) =>
                  setDraftEvent({ ...draftEvent, attachments: att })
                }
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Evento"
          description={`Deseja excluir o evento "${deleteTarget?.label}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 4. GALERIA ====================
  if (section === 'galeria') {
    const openEditAlbum = (album?: PastEventPhoto) => {
      if (album) {
        setDraftAlbum({ ...album });
      } else {
        setDraftAlbum({
          id: `alb-${Date.now()}`,
          title: '',
          category: 'Festivais Esportivos',
          date: new Date().toLocaleDateString('pt-BR'),
          location: 'Polo Rio Marinho · Cariacica/ES',
          coverUrl:
            'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80',
          caption: '',
          albumPhotos: [],
        });
      }
      setDrawerOpen(true);
    };

    const handleSaveAlbum = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftAlbum || isReadOnly) return;
      setSaveState('saving');
      const exists = galleryAlbums.some((a) => a.id === draftAlbum.id);
      const next = exists
        ? galleryAlbums.map((a) => (a.id === draftAlbum.id ? draftAlbum : a))
        : [draftAlbum, ...galleryAlbums];
      saveAdminChanges({ galleryAlbums: next }, `Álbum salvo: ${draftAlbum.title}`);
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const columns: ColunaTabela<PastEventPhoto>[] = [
      {
        id: 'title',
        header: 'Álbum Fotográfico',
        render: (a) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {a.title}
            </span>
            <span className="text-[11px] text-slate-500">
              {a.category} · {a.date}
            </span>
          </div>
        ),
      },
      {
        id: 'photos',
        header: 'Fotos',
        align: 'right',
        render: (a) => (
          <span className="font-mono text-xs">{a.albumPhotos?.length || 0}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (a) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditAlbum(a)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: a.id,
                    label: a.title,
                    onConfirm: async () => {
                      const prev = [...galleryAlbums];
                      const next = galleryAlbums.filter((item) => item.id !== a.id);
                      saveAdminChanges(
                        { galleryAlbums: next },
                        `Álbum removido: ${a.title}`
                      );
                      onRegisterUndo(`Álbum "${a.title}" excluído`, async () => {
                        saveAdminChanges(
                          { galleryAlbums: prev },
                          `Desfeita exclusão de álbum: ${a.title}`
                        );
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ),
      },
    ];

    const handleQuickBatchAlbumUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0 || isReadOnly) return;
      const files: File[] = Array.from(fileList);
      e.target.value = '';
      const uploadedPhotos: { url: string; caption: string }[] = [];
      for (const f of files) {
        const dataUrl = await processImageUpload(f, 1100, 0.8);
        const caption = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        uploadedPhotos.push({ url: dataUrl, caption });
      }
      setDraftAlbum({
        id: `alb-${Date.now()}`,
        title: `Registro Fotográfico (${new Date().toLocaleDateString('pt-BR')})`,
        category: 'Festivais Esportivos',
        date: new Date().toLocaleDateString('pt-BR'),
        location: 'Polo Rio Marinho · Cariacica/ES',
        coverUrl: uploadedPhotos[0]?.url || '',
        caption: `${uploadedPhotos.length} fotos enviadas em lote.`,
        albumPhotos: uploadedPhotos,
      });
      setDrawerOpen(true);
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Galeria de Fotos
            </h2>
            <p className="text-xs text-slate-500">
              Álbuns institucionais de treinos, torneios e ações sociais.
            </p>
          </div>
          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Criar Álbum via Upload de Fotos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleQuickBatchAlbumUpload}
                />
              </label>
              <button
                type="button"
                onClick={() => openEditAlbum()}
                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Álbum</span>
              </button>
            </div>
          )}
        </div>

        <Tabela
          items={galleryAlbums}
          columns={columns}
          keyExtractor={(a) => a.id}
          emptyMessage="Nenhum álbum cadastrado."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftAlbum}
          onClose={() => setDrawerOpen(false)}
          title="Editar Álbum"
          subtitle={draftAlbum?.title}
          saveState={saveState}
          onSave={!isReadOnly ? handleSaveAlbum : undefined}
          saveLabel="Salvar Álbum"
        >
          {draftAlbum && (
            <div className="space-y-4">
              <CampoTexto
                label="Título do Álbum"
                required
                value={draftAlbum.title}
                onChange={(v) => setDraftAlbum({ ...draftAlbum, title: v })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTexto
                  label="Categoria"
                  value={draftAlbum.category}
                  onChange={(v) => setDraftAlbum({ ...draftAlbum, category: v })}
                />
                <CampoTexto
                  label="Data"
                  value={draftAlbum.date}
                  onChange={(v) => setDraftAlbum({ ...draftAlbum, date: v })}
                />
              </div>
              <CampoTexto
                label="Local"
                value={draftAlbum.location}
                onChange={(v) => setDraftAlbum({ ...draftAlbum, location: v })}
              />
              <CampoUploadImagem
                label="Foto de Capa do Álbum"
                disabled={isReadOnly}
                value={draftAlbum.coverUrl}
                onChange={(v) => setDraftAlbum({ ...draftAlbum, coverUrl: v })}
              />
              <CampoTexto
                label="Legenda / Descrição"
                multiline
                rows={2}
                value={draftAlbum.caption}
                onChange={(v) => setDraftAlbum({ ...draftAlbum, caption: v })}
              />
              <CampoUploadMultiplasFotos
                photos={draftAlbum.albumPhotos || []}
                coverUrl={draftAlbum.coverUrl}
                disabled={isReadOnly}
                onChangePhotos={(nextPhotos) =>
                  setDraftAlbum({ ...draftAlbum, albumPhotos: nextPhotos })
                }
                onSelectCover={(url) =>
                  setDraftAlbum({ ...draftAlbum, coverUrl: url })
                }
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Álbum"
          description={`Deseja excluir o álbum "${deleteTarget?.label}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 5. PATROCINADORES & PARCEIROS ====================
  if (section === 'patrocinadores') {
    const DEFAULT_TIER_LABELS: Record<Sponsor['tier'], string> = {
      master: 'Patrocinador Master',
      ouro: 'Patrocinador Ouro',
      prata: 'Patrocinador Prata',
      bronze: 'Apoio Comunitário',
      apoio: 'Parceiro Institucional',
    };

    const openEditSponsor = (sp?: Sponsor) => {
      if (sp) {
        setDraftSponsor({ ...sp });
      } else {
        setDraftSponsor({
          id: `sp-${Date.now()}`,
          name: '',
          tier: 'apoio',
          tierLabel: 'Parceiro Institucional',
          logoUrl:
            'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80',
          websiteUrl: 'https://',
          description: '',
          category: 'Esporte Educacional',
          active: true,
          order: sponsors.length + 1,
        });
      }
      setDrawerOpen(true);
    };

    const handleSaveSponsor = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftSponsor || isReadOnly) return;
      setSaveState('saving');
      const normalizedDraft: Sponsor = {
        ...draftSponsor,
        tierLabel:
          draftSponsor.tierLabel?.trim() ||
          DEFAULT_TIER_LABELS[draftSponsor.tier] ||
          'Parceiro Institucional',
        order: Number(draftSponsor.order) || 1,
        active: draftSponsor.active !== false,
      };
      const exists = sponsors.some((s) => s.id === normalizedDraft.id);
      const next = (
        exists
          ? sponsors.map((s) => (s.id === normalizedDraft.id ? normalizedDraft : s))
          : [normalizedDraft, ...sponsors]
      ).sort((a, b) => (a.order || 0) - (b.order || 0));
      saveAdminChanges({ sponsors: next }, `Parceiro salvo: ${normalizedDraft.name}`);
      recordAuditEvent({
        action: exists ? 'update_sponsor' : 'create_sponsor',
        collection: 'sponsors',
        itemId: normalizedDraft.id,
        afterSummary: normalizedDraft.name,
        role,
      });
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const columns: ColunaTabela<Sponsor>[] = [
      {
        id: 'name',
        header: 'Instituição / Parceiro',
        render: (s) => (
          <div className="flex items-center gap-2.5">
            <img
              src={s.logoUrl}
              alt={s.name}
              className="w-8 h-8 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                {s.name}
              </span>
              <span className="text-[11px] text-slate-500">
                {s.tierLabel || s.tier} · Ordem #{s.order || 1}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Frente de Impacto',
        render: (s) => (
          <span className="text-xs">{s.category || 'Institucional'}</span>
        ),
      },
      {
        id: 'status',
        header: 'Visibilidade',
        render: (s) => (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              s.active !== false
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {s.active !== false ? 'Ativo no Site' : 'Oculto'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (s) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditSponsor(s)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label={`Editar ${s.name}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: s.id,
                    label: s.name,
                    onConfirm: async () => {
                      const prev = [...sponsors];
                      const next = sponsors.filter((item) => item.id !== s.id);
                      saveAdminChanges(
                        { sponsors: next },
                        `Parceiro removido: ${s.name}`
                      );
                      onRegisterUndo(`Parceiro "${s.name}" excluído`, async () => {
                        saveAdminChanges(
                          { sponsors: prev },
                          `Desfeita exclusão de parceiro: ${s.name}`
                        );
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                aria-label={`Excluir ${s.name}`}
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Patrocinadores e Parceiros Institucionais
            </h2>
            <p className="text-xs text-slate-500">
              Empresas apoiadoras, convênios públicos e instituições parceiras exibidas na página pública de Parceiros.
            </p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => openEditSponsor()}
              className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Parceiro</span>
            </button>
          )}
        </div>

        <Tabela
          items={sponsors}
          columns={columns}
          keyExtractor={(s) => s.id}
          emptyMessage="Nenhum parceiro cadastrado."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftSponsor}
          onClose={() => setDrawerOpen(false)}
          title="Dados do Parceiro"
          subtitle={draftSponsor?.name}
          saveState={saveState}
          onSave={!isReadOnly ? handleSaveSponsor : undefined}
          saveLabel="Salvar Parceiro"
        >
          {draftSponsor && (
            <div className="space-y-4">
              <CampoTexto
                label="Nome da Empresa / Instituição"
                required
                value={draftSponsor.name}
                onChange={(v) => setDraftSponsor({ ...draftSponsor, name: v })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cota / Categoria
                  </label>
                  <select
                    value={draftSponsor.tier}
                    onChange={(e) => {
                      const nextTier = e.target.value as Sponsor['tier'];
                      const prevDefault = DEFAULT_TIER_LABELS[draftSponsor.tier];
                      const nextLabel =
                        !draftSponsor.tierLabel || draftSponsor.tierLabel === prevDefault
                          ? DEFAULT_TIER_LABELS[nextTier]
                          : draftSponsor.tierLabel;
                      setDraftSponsor({
                        ...draftSponsor,
                        tier: nextTier,
                        tierLabel: nextLabel,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="master">Cota Master</option>
                    <option value="ouro">Cota Ouro</option>
                    <option value="prata">Cota Prata</option>
                    <option value="bronze">Cota Bronze</option>
                    <option value="apoio">Apoio Institucional</option>
                  </select>
                </div>
                <CampoTexto
                  label="Selo / Título da Cota"
                  value={draftSponsor.tierLabel || ''}
                  onChange={(v) =>
                    setDraftSponsor({ ...draftSponsor, tierLabel: v })
                  }
                  placeholder="Ex.: Parceiro Institucional"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTexto
                  label="Área de Impacto / Categoria"
                  value={draftSponsor.category}
                  onChange={(v) =>
                    setDraftSponsor({ ...draftSponsor, category: v })
                  }
                />
                <CampoTexto
                  label="Ordem de Exibição"
                  type="number"
                  value={String(draftSponsor.order ?? 1)}
                  onChange={(v) =>
                    setDraftSponsor({
                      ...draftSponsor,
                      order: Number(v) || 1,
                    })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSponsor.active !== false}
                  onChange={(e) =>
                    setDraftSponsor({
                      ...draftSponsor,
                      active: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7]"
                />
                <span>Exibir este parceiro na página pública de Parceiros</span>
              </label>
              <CampoUploadImagem
                label="Logomarca do Parceiro / Patrocinador"
                disabled={isReadOnly}
                value={draftSponsor.logoUrl}
                onChange={(v) =>
                  setDraftSponsor({ ...draftSponsor, logoUrl: v })
                }
              />
              <CampoTexto
                label="Site Oficial (URL)"
                value={draftSponsor.websiteUrl || ''}
                onChange={(v) =>
                  setDraftSponsor({ ...draftSponsor, websiteUrl: v })
                }
              />
              <CampoTexto
                label="Descrição da Parceria"
                multiline
                rows={3}
                value={draftSponsor.description}
                onChange={(v) =>
                  setDraftSponsor({ ...draftSponsor, description: v })
                }
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Parceiro"
          description={`Deseja remover "${deleteTarget?.label}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 6. POLOS ESPORTIVOS ====================
  if (section === 'polos') {
    const openEditPolo = (polo?: FacilityPolo) => {
      if (polo) {
        setDraftPolo({ ...polo });
      } else {
        setDraftPolo({
          id: `polo-${Date.now()}`,
          name: '',
          type: 'quadra_poliesportiva',
          capacity: '150 alunos/semana',
          maxGuests: 150,
          address: 'Cariacica - ES',
          description: '',
          includedItems: ['Quadra poliesportiva', 'Iluminação LED'],
          imageUrl:
            'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80',
          rules: [],
        });
      }
      setDrawerOpen(true);
    };

    const handleSavePolo = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftPolo || isReadOnly) return;
      setSaveState('saving');
      const exists = facilityPolos.some((p) => p.id === draftPolo.id);
      const next = exists
        ? facilityPolos.map((p) => (p.id === draftPolo.id ? draftPolo : p))
        : [draftPolo, ...facilityPolos];
      saveAdminChanges({ facilityPolos: next }, `Polo salvo: ${draftPolo.name}`);
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const columns: ColunaTabela<FacilityPolo>[] = [
      {
        id: 'name',
        header: 'Polo / Núcleo Esportivo',
        render: (p) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {p.name}
            </span>
            <span className="text-[11px] text-slate-500">{p.address}</span>
          </div>
        ),
      },
      {
        id: 'capacity',
        header: 'Capacidade',
        render: (p) => <span className="text-xs">{p.capacity}</span>,
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (p) => (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditPolo(p)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: p.id,
                    label: p.name,
                    onConfirm: async () => {
                      const prev = [...facilityPolos];
                      const next = facilityPolos.filter((item) => item.id !== p.id);
                      saveAdminChanges(
                        { facilityPolos: next },
                        `Polo removido: ${p.name}`
                      );
                      onRegisterUndo(`Polo "${p.name}" excluído`, async () => {
                        saveAdminChanges(
                          { facilityPolos: prev },
                          `Desfeita exclusão de polo: ${p.name}`
                        );
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Polos e Instalações Esportivas
            </h2>
            <p className="text-xs text-slate-500">
              Unidades comunitárias e quadras atendidas pela Associação Esportiva Vitalizar.
            </p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => openEditPolo()}
              className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Polo</span>
            </button>
          )}
        </div>

        <Tabela
          items={facilityPolos}
          columns={columns}
          keyExtractor={(p) => p.id}
          emptyMessage="Nenhum polo cadastrado."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftPolo}
          onClose={() => setDrawerOpen(false)}
          title="Editar Polo Esportivo"
          subtitle={draftPolo?.name}
          saveState={saveState}
          onSave={!isReadOnly ? handleSavePolo : undefined}
          saveLabel="Salvar Polo"
        >
          {draftPolo && (
            <div className="space-y-4">
              <CampoTexto
                label="Nome do Polo"
                required
                value={draftPolo.name}
                onChange={(v) => setDraftPolo({ ...draftPolo, name: v })}
              />
              <CampoTexto
                label="Capacidade"
                value={draftPolo.capacity}
                onChange={(v) => setDraftPolo({ ...draftPolo, capacity: v })}
              />
              <CampoTexto
                label="Endereço"
                value={draftPolo.address}
                onChange={(v) => setDraftPolo({ ...draftPolo, address: v })}
              />
              <CampoUploadImagem
                label="Foto da Instalação / Polo"
                disabled={isReadOnly}
                value={draftPolo.imageUrl}
                onChange={(v) => setDraftPolo({ ...draftPolo, imageUrl: v })}
              />
              <CampoTexto
                label="Descrição"
                multiline
                rows={3}
                value={draftPolo.description}
                onChange={(v) => setDraftPolo({ ...draftPolo, description: v })}
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Polo"
          description={`Deseja remover "${deleteTarget?.label}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 7. TRANSPARÊNCIA ====================
  if (section === 'transparencia') {
    const openEditDoc = (docItem?: TransparencyDocument) => {
      if (docItem) {
        setDraftDoc({ ...docItem });
      } else {
        setDraftDoc({
          id: `doc-${Date.now()}`,
          title: '',
          category: 'prestacao_contas',
          date: new Date().toLocaleDateString('pt-BR'),
          description: '',
          fileType: 'PDF',
          badge: 'Vigente / Regular',
          downloadUrl: '',
        });
      }
      setDrawerOpen(true);
    };

    const handleSaveDoc = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draftDoc || isReadOnly) return;
      setSaveState('saving');
      const exists = transparencyDocs.some((d) => d.id === draftDoc.id);
      const next = exists
        ? transparencyDocs.map((d) => (d.id === draftDoc.id ? draftDoc : d))
        : [draftDoc, ...transparencyDocs];
      saveAdminChanges(
        { transparencyDocs: next },
        `Documento de transparência salvo: ${draftDoc.title}`
      );
      recordAuditEvent({
        action: exists ? 'update_transparency_doc' : 'create_transparency_doc',
        collection: 'transparency_docs',
        itemId: draftDoc.id,
        afterSummary: draftDoc.title,
        role,
      });
      triggerSavedIndicator();
      setDrawerOpen(false);
    };

    const columns: ColunaTabela<TransparencyDocument>[] = [
      {
        id: 'title',
        header: 'Documento / Certidão',
        render: (d) => (
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {d.title}
            </span>
            <span className="text-[11px] text-slate-500">
              {d.category} · {d.fileType}
            </span>
          </div>
        ),
      },
      {
        id: 'badge',
        header: 'Situação',
        render: (d) => (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {d.badge}
          </span>
        ),
      },
      {
        id: 'date',
        header: 'Publicado em',
        render: (d) => <span className="font-mono text-xs">{d.date}</span>,
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (d) => (
          <div className="inline-flex items-center gap-1">
            {d.downloadUrl && (
              <a
                href={d.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/40"
                title="Abrir documento"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => openEditDoc(d)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={isReadOnly ? 'Conferir documento' : 'Editar documento'}
            >
              {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
            {!isReadOnly && canDelete && (
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    id: d.id,
                    label: d.title,
                    onConfirm: async () => {
                      const prev = [...transparencyDocs];
                      const next = transparencyDocs.filter((item) => item.id !== d.id);
                      saveAdminChanges(
                        { transparencyDocs: next },
                        `Documento removido: ${d.title}`
                      );
                      onRegisterUndo(`Documento "${d.title}" excluído`, async () => {
                        saveAdminChanges(
                          { transparencyDocs: prev },
                          `Desfeita exclusão de documento: ${d.title}`
                        );
                      });
                      setDeleteTarget(null);
                    },
                  })
                }
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ),
      },
    ];

    const handleBatchTransparencyDocsUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0 || isReadOnly) return;
      const files: File[] = Array.from(fileList);
      e.target.value = '';
      const createdDocs: TransparencyDocument[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          const attached = await processAttachmentUpload(f);
          const cleanTitle = f.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]+/g, ' ');
          createdDocs.push({
            id: `doc-${Date.now()}-${i}`,
            title: cleanTitle,
            category: 'prestacao_contas',
            date: new Date().toLocaleDateString('pt-BR'),
            description: `Documento institucional (${attached.name} · ${attached.size}) enviado para transparência pública.`,
            fileType: attached.type,
            badge: 'Vigente / Regular',
            fileName: attached.name,
            fileSize: attached.size,
            fileDataUrl: attached.dataUrl,
            downloadUrl: attached.dataUrl,
          });
        } catch {
          // Ignore oversized individual files
        }
      }
      if (createdDocs.length === 0) return;
      const next = [...createdDocs, ...transparencyDocs];
      saveAdminChanges(
        { transparencyDocs: next },
        `${createdDocs.length} documento(s) publicados no Portal da Transparência!`
      );
      recordAuditEvent({
        action: 'batch_upload_transparency_docs',
        collection: 'transparency_docs',
        itemId: `batch-${createdDocs.length}`,
        afterSummary: `${createdDocs.length} arquivos enviados em lote`,
        role,
      });
    };

    const handleImportFinancialCsv = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || isReadOnly) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawText = ev.target?.result as string;
        if (!rawText) return;
        const parsed = parseTransparencyFinancialCsv(rawText);
        if (parsed.error) return;
        const currentDash = siteSettings.transparencyDashboard || {
          socioTorcedoresTotal: 140,
          socioTorcedoresGoal: 200,
          socioTorcedoresNewMonth: 12,
          socioTorcedoresRetentionRate: '94%',
          socioTorcedoresTiers: [],
          socioTorcedoresMonthlyGrowth: [],
          fiscalYear: String(new Date().getFullYear()),
          totalRevenue: parsed.totalRevenue,
          totalInvested: parsed.totalInvested,
          directBeneficiaries: 320,
          auditStatus: 'Regular / Aprovado pelo Conselho Fiscal',
          lastAuditDate: new Date().toLocaleDateString('pt-BR'),
          allocationBreakdown: [],
          revenueSources: [],
        };
        const nextDashboard = {
          ...currentDash,
          totalRevenue: parsed.totalRevenue || currentDash.totalRevenue,
          totalInvested: parsed.totalInvested || currentDash.totalInvested,
          lastAuditDate: new Date().toLocaleDateString('pt-BR'),
          allocationBreakdown:
            parsed.allocationBreakdown.length > 0
              ? parsed.allocationBreakdown
              : currentDash.allocationBreakdown,
          revenueSources:
            parsed.revenueSources.length > 0
              ? parsed.revenueSources
              : currentDash.revenueSources,
        };
        saveAdminChanges(
          {
            siteSettings: {
              ...siteSettings,
              transparencyDashboard: nextDashboard,
            },
          },
          `Gráficos financeiros do Portal da Transparência atualizados via planilha (${file.name})!`
        );
        recordAuditEvent({
          action: 'import_financial_csv',
          collection: 'site_settings',
          itemId: file.name,
          afterSummary: `Receita R$ ${parsed.totalRevenue} | Investido R$ ${parsed.totalInvested}`,
          role,
        });
      };
      reader.readAsText(file, 'UTF-8');
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Portal da Transparência e Prestação de Contas
            </h2>
            <p className="text-xs text-slate-500">
              {isReadOnly
                ? 'Modo de leitura e conferência fiscal habilitado para seu perfil.'
                : 'Envie certidões (PDF), balancetes ou importe a planilha financeira para alimentar os gráficos.'}
            </p>
          </div>
          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadCsvTemplate(
                    'modelo-financeiro-transparencia.csv',
                    TRANSPARENCY_FINANCE_SAMPLE_CSV
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                title="Baixar planilha modelo para os gráficos de Transparência"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                <span>Modelo Financeiro CSV</span>
              </button>
              <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar Planilha Financeira (CSV)</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleImportFinancialCsv}
                />
              </label>
              <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Upload em Lote (PDFs/Docs)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                  className="hidden"
                  onChange={handleBatchTransparencyDocsUpload}
                />
              </label>
              <button
                type="button"
                onClick={() => openEditDoc()}
                className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Documento</span>
              </button>
            </div>
          )}
        </div>

        <Tabela
          items={transparencyDocs}
          columns={columns}
          keyExtractor={(d) => d.id}
          emptyMessage="Nenhum documento publicado."
        />

        <PainelLateral
          isOpen={drawerOpen && !!draftDoc}
          onClose={() => setDrawerOpen(false)}
          title={isReadOnly ? 'Conferência de Documento' : 'Editar Documento'}
          subtitle={draftDoc?.title}
          saveState={saveState}
          onSave={!isReadOnly ? handleSaveDoc : undefined}
          saveLabel="Salvar Documento"
        >
          {draftDoc && (
            <div className="space-y-4">
              <CampoUploadDocumento
                label="Upload de Arquivo Oficial (PDF, Planilha, Certidão ou Imagem)"
                disabled={isReadOnly}
                fileName={draftDoc.fileName}
                fileSize={draftDoc.fileSize}
                fileType={draftDoc.fileType}
                downloadUrl={draftDoc.downloadUrl}
                onFileProcessed={(meta) =>
                  setDraftDoc({
                    ...draftDoc,
                    title: draftDoc.title.trim() || meta.suggestedTitle,
                    fileName: meta.fileName,
                    fileSize: meta.fileSize,
                    fileType: meta.fileType,
                    fileDataUrl: meta.dataUrl,
                    downloadUrl: meta.dataUrl,
                  })
                }
                onUrlChange={(url) =>
                  setDraftDoc({ ...draftDoc, downloadUrl: url })
                }
              />

              <CampoTexto
                label="Título do Documento"
                required
                disabled={isReadOnly}
                value={draftDoc.title}
                onChange={(v) => setDraftDoc({ ...draftDoc, title: v })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categoria Oficial
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={draftDoc.category}
                    onChange={(e) =>
                      setDraftDoc({
                        ...draftDoc,
                        category:
                          e.target.value as TransparencyDocument['category'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="prestacao_contas">Prestação de Contas</option>
                    <option value="certidoes">Certidões Negativas</option>
                    <option value="fomento">Termos de Fomento</option>
                    <option value="emendas">Emendas Parlamentares</option>
                    <option value="estatuto">Estatuto & Atas</option>
                    <option value="governanca">Governança & Diretoria</option>
                    <option value="cnpj">Cartão CNPJ</option>
                  </select>
                </div>
                <CampoTexto
                  label="Data de Publicação"
                  disabled={isReadOnly}
                  value={draftDoc.date}
                  onChange={(v) => setDraftDoc({ ...draftDoc, date: v })}
                />
                <CampoTexto
                  label="Situação / Selo"
                  disabled={isReadOnly}
                  value={draftDoc.badge}
                  onChange={(v) => setDraftDoc({ ...draftDoc, badge: v })}
                />
              </div>

              <CampoTexto
                label="Resumo Executivo"
                multiline
                rows={3}
                disabled={isReadOnly}
                value={draftDoc.description}
                onChange={(v) => setDraftDoc({ ...draftDoc, description: v })}
              />
            </div>
          )}
        </PainelLateral>

        <ConfirmarExclusao
          isOpen={!!deleteTarget}
          title="Excluir Documento"
          description={`Deseja remover "${deleteTarget?.label}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget?.onConfirm()}
        />
      </div>
    );
  }

  // ==================== 8. CONFIGURAÇÕES & PIX ====================
  const canEditPix =
    role === 'super_admin' || role === 'admin' || role === 'financeiro';
  const canEditInstitutional =
    role === 'super_admin' || role === 'admin' || role === 'editor';

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSaveState('saving');
    saveAdminChanges(
      {
        ...(canEditInstitutional ? { clubInfo: draftClub } : {}),
        siteSettings: {
          ...siteSettings,
          ...(canEditPix ? { pixConfig: draftPix } : {}),
          ...(canEditInstitutional ? { announcementBanner: draftBanner } : {}),
        },
      },
      canEditPix && !canEditInstitutional
        ? 'Configuração PIX oficial atualizada'
        : 'Configurações institucionais atualizadas'
    );
    recordAuditEvent({
      action: 'update_settings',
      collection: 'site_settings',
      itemId: 'main',
      afterSummary:
        canEditPix && !canEditInstitutional
          ? `PIX: ${draftPix.pixKeyFormatted}`
          : `Aviso: ${draftBanner.enabled ? 'Ativo' : 'Inativo'}`,
      role,
    });
    triggerSavedIndicator();
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {role === 'financeiro'
              ? 'Configuração PIX Oficial (Doações)'
              : role === 'editor'
              ? 'Dados Institucionais e Aviso do Site'
              : 'Configurações Institucionais, PIX e Banner do Site'}
          </h2>
          <p className="text-xs text-slate-500">
            {isReadOnly
              ? 'Visualização de conferência financeira e institucional (somente leitura).'
              : role === 'financeiro'
              ? 'Gerencie os dados bancários e a chave PIX oficial exibida para doadores.'
              : 'Atualize dados oficiais da Associação e comunicados exibidos no portal.'}
          </p>
        </div>
        {!isReadOnly && (
          <button
            type="submit"
            disabled={saveState === 'saving'}
            className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            {saveState === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{saveState === 'saving' ? 'Salvando…' : 'Salvar Configurações'}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados PIX - Visível apenas para Financeiro, Admin e Super Admin */}
        {canEditPix && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Configuração PIX Oficial (Doações)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="Chave PIX (Somente números/CNPJ)"
                disabled={isReadOnly}
                value={draftPix.pixKey}
                onChange={(v) => setDraftPix({ ...draftPix, pixKey: v })}
              />
              <CampoTexto
                label="Chave Formatada (Exibição)"
                disabled={isReadOnly}
                value={draftPix.pixKeyFormatted}
                onChange={(v) => setDraftPix({ ...draftPix, pixKeyFormatted: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="Nome do Recebedor (Padrão EMV)"
                disabled={isReadOnly}
                value={draftPix.beneficiaryName}
                onChange={(v) => setDraftPix({ ...draftPix, beneficiaryName: v })}
              />
              <CampoTexto
                label="Cidade (Padrão EMV)"
                disabled={isReadOnly}
                value={draftPix.city}
                onChange={(v) => setDraftPix({ ...draftPix, city: v })}
              />
            </div>
            <CampoTexto
              label="Informações Bancárias Complementares"
              disabled={isReadOnly}
              value={draftPix.bankName}
              onChange={(v) => setDraftPix({ ...draftPix, bankName: v })}
            />
          </div>
        )}

        {/* Dados da Associação - Visível apenas para Editor, Admin e Super Admin */}
        {canEditInstitutional && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Dados Institucionais (Rodapé e Cabeçalho)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="Razão Social / Nome Oficial"
                disabled={isReadOnly}
                value={draftClub.fullName}
                onChange={(v) => setDraftClub({ ...draftClub, fullName: v })}
              />
              <CampoTexto
                label="Sigla / Nome no Cabeçalho"
                disabled={isReadOnly}
                value={draftClub.shortName}
                onChange={(v) => setDraftClub({ ...draftClub, shortName: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="CNPJ"
                disabled={isReadOnly}
                value={draftClub.cnpj}
                onChange={(v) => setDraftClub({ ...draftClub, cnpj: v })}
              />
              <CampoTexto
                label="Presidente"
                disabled={isReadOnly}
                value={draftClub.president}
                onChange={(v) => setDraftClub({ ...draftClub, president: v })}
              />
            </div>
            <CampoTexto
              label="E-mail Institucional"
              disabled={isReadOnly}
              value={draftClub.email}
              onChange={(v) => setDraftClub({ ...draftClub, email: v })}
            />
            <CampoTexto
              label="Endereço da Sede"
              disabled={isReadOnly}
              value={draftClub.address}
              onChange={(v) => setDraftClub({ ...draftClub, address: v })}
            />
          </div>
        )}
      </div>

      {/* Banner de Aviso - Visível apenas para Editor, Admin e Super Admin */}
      {canEditInstitutional && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Faixa de Aviso Rápido no Topo do Site
            </h3>
            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={draftBanner.enabled}
                onChange={(e) =>
                  setDraftBanner({ ...draftBanner, enabled: e.target.checked })
                }
                className="rounded border-slate-300"
              />
              <span>Exibir aviso no topo do site</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CampoTexto
              label="Texto do Comunicado"
              disabled={isReadOnly}
              value={draftBanner.text}
              onChange={(v) => setDraftBanner({ ...draftBanner, text: v })}
            />
            <CampoTexto
              label="Rótulo do Botão de Ação"
              disabled={isReadOnly}
              value={draftBanner.linkLabel}
              onChange={(v) => setDraftBanner({ ...draftBanner, linkLabel: v })}
            />
          </div>
        </div>
      )}
    </form>
  );
};
