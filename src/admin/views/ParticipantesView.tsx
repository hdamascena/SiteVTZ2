import React, { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Upload,
  Edit3,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import type { AdminUserProfile } from '../types.ts';
import {
  canDeleteRecords,
  canExportSensitiveCsv,
  canImportCsv,
  sanitizeShowcaseParticipant,
} from '../permissions.ts';
import {
  CampoTexto,
  CampoUploadImagem,
} from '../components/CampoTexto.tsx';
import { Tabela, type ColunaTabela } from '../components/Tabela.tsx';
import {
  PainelLateral,
  type SaveIndicatorState,
} from '../components/PainelLateral.tsx';
import { ConfirmarExclusao } from '../components/ConfirmarExclusao.tsx';
import { useClubData } from '../../context/ClubDataContext.tsx';
import type { ProjectParticipant } from '../../types/index.ts';
import {
  NEXTFIT_SAMPLE_CSV_CONTENT,
  parseNextFitCsv,
  mergeNextFitRowsIntoProjects,
} from '../../utils/nextfitCsv.ts';
import { downloadCsvTemplate } from '../../utils/fileUpload.ts';

interface ParticipantesViewProps {
  profile: AdminUserProfile;
  onScheduleUndoDelete: (
    label: string,
    performDelete: () => void,
    undoRestore: () => void
  ) => void;
}

interface ShowcaseParticipantRow {
  projectId: string;
  projectName: string;
  participant: ProjectParticipant;
}

export const ParticipantesView: React.FC<ParticipantesViewProps> = ({
  profile,
  onScheduleUndoDelete,
}) => {
  const {
    projects,
    saveAdminChanges,
    recordAuditEvent,
    showToast,
  } = useClubData();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer editing state
  const [editingRow, setEditingRow] = useState<ShowcaseParticipantRow | null>(
    null
  );
  const [isNew, setIsNew] = useState(false);
  const [saveState, setSaveState] = useState<SaveIndicatorState>('idle');

  // Public Showcase Form fields
  const [formProjectId, setFormProjectId] = useState('');
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formCategory, setFormCategory] = useState('Sub-15');
  const [formPosition, setFormPosition] = useState('Meia');
  const [formJersey, setFormJersey] = useState('10');
  const [formAge, setFormAge] = useState('14');
  const [formCardTier, setFormCardTier] = useState<ProjectParticipant['cardTier']>('prata');
  const [formOverall, setFormOverall] = useState('78');
  const [formScoutSummary, setFormScoutSummary] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] =
    useState<ShowcaseParticipantRow | null>(null);

  const allRows = useMemo(() => {
    const list: ShowcaseParticipantRow[] = [];
    projects.forEach((proj) => {
      if (projectFilter !== 'all' && proj.id !== projectFilter) return;
      (proj.participants || []).forEach((pt) => {
        list.push({
          projectId: proj.id,
          projectName: proj.name,
          participant: sanitizeShowcaseParticipant(pt),
        });
      });
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.participant.name.toLowerCase().includes(q) ||
        (r.participant.nickname || '').toLowerCase().includes(q) ||
        (r.participant.category || '').toLowerCase().includes(q) ||
        (r.participant.position || '').toLowerCase().includes(q)
    );
  }, [projects, projectFilter, searchQuery]);

  const openEditDrawer = (row: ShowcaseParticipantRow) => {
    setIsNew(false);
    setEditingRow(row);
    const p = row.participant;
    setFormProjectId(row.projectId);
    setFormName(p.name);
    setFormNickname(p.nickname || '');
    setFormCategory(p.category || 'Sub-15');
    setFormPosition(p.position || 'Meia');
    setFormJersey(String(p.jerseyNumber || 10));
    setFormAge(String(p.age || 14));
    setFormCardTier(p.cardTier || 'prata');
    setFormOverall(String(p.stats?.overall || 78));
    setFormScoutSummary(p.scoutReport?.summary || '');
    setFormPhotoUrl(p.photoUrl || '');
    setSaveState('idle');
  };

  const openNewDrawer = () => {
    const defaultProjId =
      projectFilter !== 'all'
        ? projectFilter
        : projects[0]?.id || '';
    setIsNew(true);
    setEditingRow({
      projectId: defaultProjId,
      projectName: projects.find((p) => p.id === defaultProjId)?.name || '',
      participant: {} as ProjectParticipant,
    });
    setFormProjectId(defaultProjId);
    setFormName('');
    setFormNickname('');
    setFormCategory('Sub-15');
    setFormPosition('Meia');
    setFormJersey('10');
    setFormAge('14');
    setFormCardTier('prata');
    setFormOverall('78');
    setFormScoutSummary('Atleta integrante da vitrine esportiva Vitalizar.');
    setFormPhotoUrl(
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80'
    );
    setSaveState('idle');
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !formName.trim()) return;
    setSaveState('saving');

    const partId = isNew ? `part-${Date.now()}` : editingRow.participant.id;
    const ovr = Math.min(99, Math.max(50, Number(formOverall) || 78));
    const basePart: ProjectParticipant = sanitizeShowcaseParticipant(
      isNew
        ? {
            id: partId,
            name: formName.trim(),
            nickname: formNickname.trim() || formName.trim().split(' ')[0],
            enrollmentStatus: 'ativo',
            photoUrl:
              formPhotoUrl.trim() ||
              'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80',
            jerseyNumber: Number(formJersey) || 10,
            position: formPosition.trim() || 'Atleta',
            positionGroup: 'meio',
            preferredFoot: 'Destro',
            age: Number(formAge) || 14,
            birthDate: '',
            category: formCategory.trim() || 'Sub-15',
            height: '',
            weight: '',
            cardTier: formCardTier,
            stats: {
              pace: ovr,
              shooting: ovr - 2,
              passing: ovr - 1,
              dribbling: ovr,
              defending: ovr - 4,
              physical: ovr - 2,
              overall: ovr,
            },
            schoolInfo: {
              schoolName: '',
              grade: '',
              turn: 'Matutino',
              attendanceRate: '98%',
            },
            highlights: ['Atleta em destaque na Vitrine Vitalizar'],
            scoutReport: {
              summary:
                formScoutSummary.trim() ||
                'Atleta em desenvolvimento técnico e esportivo.',
              strengths: ['Comprometimento', 'Técnica'],
              developmentAreas: ['Evolução contínua'],
              scoutRating: 'Vitrine Oficial',
            },
            photos: [],
            videos: [],
          }
        : {
            ...editingRow.participant,
            name: formName.trim(),
            nickname: formNickname.trim() || formName.trim().split(' ')[0],
            photoUrl: formPhotoUrl.trim() || editingRow.participant.photoUrl,
            jerseyNumber: Number(formJersey) || 10,
            position: formPosition.trim(),
            age: Number(formAge) || editingRow.participant.age,
            category: formCategory.trim(),
            cardTier: formCardTier,
            stats: {
              ...(editingRow.participant.stats || {
                pace: ovr,
                shooting: ovr - 2,
                passing: ovr - 1,
                dribbling: ovr,
                defending: ovr - 4,
                physical: ovr - 2,
              }),
              overall: ovr,
            },
            scoutReport: {
              ...(editingRow.participant.scoutReport || {
                strengths: ['Comprometimento'],
                developmentAreas: ['Evolução contínua'],
                scoutRating: 'Vitrine Oficial',
              }),
              summary:
                formScoutSummary.trim() ||
                editingRow.participant.scoutReport?.summary ||
                'Atleta em desenvolvimento técnico.',
            },
          }
    );

    const updatedProjects = projects.map((proj) => {
      const filteredOut = (proj.participants || []).filter(
        (p) => p.id !== partId
      );
      if (proj.id === formProjectId) {
        const nextList = [...filteredOut, basePart];
        return {
          ...proj,
          participants: nextList,
          filledSpots: nextList.length,
        };
      }
      if (proj.id === editingRow.projectId && proj.id !== formProjectId) {
        return {
          ...proj,
          participants: filteredOut,
          filledSpots: filteredOut.length,
        };
      }
      return proj;
    });

    saveAdminChanges({
      projects: updatedProjects,
      toastMessage: `Atleta "${formName.trim()}" salvo na vitrine!`,
      logDetails: `Atleta ${formName.trim()} salvo no projeto ${formProjectId}.`,
    });

    recordAuditEvent({
      action: isNew ? 'CRIAR_ATLETA_VITRINE' : 'EDITAR_ATLETA_VITRINE',
      collection: 'projects',
      itemId: partId,
      role: profile.role,
      beforeSummary: isNew ? 'novo' : editingRow.participant.name,
      afterSummary: `${formName.trim()} (${formCategory})`,
    });

    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => {
        setEditingRow(null);
        setSaveState('idle');
      }, 400);
    }, 250);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const snapshotProjects = [...projects];

    const updatedProjects = projects.map((proj) => {
      if (proj.id !== target.projectId) return proj;
      const nextList = (proj.participants || []).filter(
        (p) => p.id !== target.participant.id
      );
      return {
        ...proj,
        participants: nextList,
        filledSpots: nextList.length,
      };
    });

    onScheduleUndoDelete(
      `Atleta "${target.participant.name}"`,
      () => {
        saveAdminChanges({
          projects: updatedProjects,
          toastMessage: `Atleta "${target.participant.name}" removido da vitrine.`,
          logDetails: `Exclusão de atleta ${target.participant.name}.`,
        });
        recordAuditEvent({
          action: 'EXCLUIR_ATLETA_VITRINE',
          collection: 'projects',
          itemId: target.participant.id,
          role: profile.role,
          beforeSummary: target.participant.name,
          afterSummary: 'excluído',
        });
      },
      () => {
        saveAdminChanges({
          projects: snapshotProjects,
          toastMessage: `Exclusão de "${target.participant.name}" desfeita!`,
        });
      }
    );
  };

  const handleExportShowcaseCsv = () => {
    if (!canExportSensitiveCsv(profile.role)) {
      showToast('Apenas Admin e Super Admin podem exportar CSV.', 'error');
      return;
    }

    const headers = [
      'ID',
      'Nome',
      'Apelido',
      'Projeto',
      'Categoria',
      'Posicao',
      'Camisa',
      'Idade',
      'Overall',
      'Resumo Tecnico',
    ];

    const rows = allRows.map((r) => {
      const p = r.participant;
      return [
        p.id,
        p.name,
        p.nickname || '',
        r.projectName,
        p.category,
        p.position,
        String(p.jerseyNumber || ''),
        String(p.age || ''),
        String(p.stats?.overall || ''),
        p.scoutReport?.summary || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    });

    const csv = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitrine-atletas-vitalizar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    recordAuditEvent({
      action: 'EXPORTAR_CSV_VITRINE',
      collection: 'projects',
      itemId: projectFilter,
      role: profile.role,
      afterSummary: `Exportou ${allRows.length} atletas da vitrine em CSV`,
    });
    showToast('CSV da vitrine exportado com sucesso!');
  };

  const handleImportCsvFile = (file: File) => {
    if (!canImportCsv(profile.role)) {
      showToast('Sem permissão para importar planilhas CSV.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawText = ev.target?.result as string;
      if (!rawText) return;
      const targetProj =
        projectFilter !== 'all' ? projectFilter : projects[0]?.id;
      const parsed = parseNextFitCsv(rawText, projects, targetProj);
      if (parsed.error) {
        showToast(parsed.error, 'error');
        return;
      }
      const { updatedProjects, addedCount, updatedCount } =
        mergeNextFitRowsIntoProjects(
          projects,
          parsed.rows,
          targetProj || 'auto'
        );

      const sanitizedProjects = updatedProjects.map((p) => ({
        ...p,
        participants: (p.participants || []).map(sanitizeShowcaseParticipant),
      }));

      saveAdminChanges({
        projects: sanitizedProjects,
        toastMessage: `Vitrine atualizada: ${addedCount} novos e ${updatedCount} atualizados!`,
        logDetails: `Importação CSV Vitrine (${file.name}): +${addedCount} / ~${updatedCount}.`,
      });
      recordAuditEvent({
        action: 'IMPORTAR_CSV_VITRINE',
        collection: 'projects',
        itemId: file.name,
        role: profile.role,
        afterSummary: `${addedCount} adicionados, ${updatedCount} atualizados`,
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const columns: ColunaTabela<ShowcaseParticipantRow>[] = [
    {
      id: 'nome',
      header: 'Atleta da Vitrine',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <img
            src={r.participant.photoUrl}
            alt={r.participant.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {r.participant.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {r.participant.category} · #{r.participant.jerseyNumber} · {r.participant.age} anos
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'projeto',
      header: 'Projeto Social',
      render: (r) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {r.projectName}
        </span>
      ),
    },
    {
      id: 'posicao_ovr',
      header: 'Posição & Card',
      render: (r) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            {r.participant.position}
          </span>
          <span className="text-[11px] font-mono text-[#0284c7] dark:text-sky-400">
            OVR {r.participant.stats?.overall || 75} · {(r.participant.cardTier || 'prata').toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      id: 'resumo',
      header: 'Destaque Esportivo (Público)',
      render: (r) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs">
          {r.participant.scoutReport?.summary || 'Atleta integrante do projeto.'}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditDrawer(r)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            <span>Editar</span>
          </button>
          {canDeleteRecords(profile.role) && (
            <button
              type="button"
              onClick={() => setDeleteTarget(r)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
              title="Excluir atleta da vitrine"
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
      <Tabela
        items={allRows}
        columns={columns}
        keyExtractor={(r) => `${r.projectId}-${r.participant.id}`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar atleta por nome, apelido, categoria ou posição..."
        filterControls={
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">
              Todos os Projetos ({allRows.length} atletas)
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        }
        headerActions={
          <>
            {canImportCsv(profile.role) && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsvTemplate(
                      'modelo-atletas-vitrine-vitalizar.csv',
                      NEXTFIT_SAMPLE_CSV_CONTENT
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                  title="Baixar planilha modelo para preenchimento no Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modelo CSV</span>
                </button>
                <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Importar Planilha CSV</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportCsvFile(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </>
            )}

            {canExportSensitiveCsv(profile.role) && (
              <button
                type="button"
                onClick={handleExportShowcaseCsv}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                title="Exportar CSV da Vitrine"
              >
                <Download className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Exportar CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={openNewDrawer}
              className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Atleta</span>
            </button>
          </>
        }
      />

      <PainelLateral
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        title={isNew ? 'Cadastrar Atleta na Vitrine' : `Editar Atleta: ${formName}`}
        subtitle="Vitrine esportiva pública (sem armazenamento de dados privados de responsáveis)"
        saveState={saveState}
        onSave={handleSaveParticipant}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Projeto Vinculado *
            </label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CampoTexto
              label="Nome do Atleta"
              value={formName}
              onChange={setFormName}
              required
              classification="público"
            />
            <CampoTexto
              label="Apelido Esportivo"
              value={formNickname}
              onChange={setFormNickname}
              classification="público"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CampoTexto
              label="Categoria"
              value={formCategory}
              onChange={setFormCategory}
              classification="público"
            />
            <CampoTexto
              label="Posição"
              value={formPosition}
              onChange={setFormPosition}
              classification="público"
            />
            <CampoTexto
              label="Nº Camisa"
              type="number"
              value={formJersey}
              onChange={setFormJersey}
              classification="público"
            />
            <CampoTexto
              label="Idade"
              type="number"
              value={formAge}
              onChange={setFormAge}
              classification="público"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Nível do Card (Vitrine)
              </label>
              <select
                value={formCardTier}
                onChange={(e) =>
                  setFormCardTier(e.target.value as 'ouro' | 'prata' | 'destaque')
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="prata">Prata (Formação)</option>
                <option value="ouro">Ouro (Titular)</option>
                <option value="destaque">Destaque da Base</option>
              </select>
            </div>
            <CampoTexto
              label="Nota Geral (Overall 50–99)"
              type="number"
              value={formOverall}
              onChange={setFormOverall}
              classification="público"
            />
          </div>

          <CampoUploadImagem
            label="Foto do Atleta"
            value={formPhotoUrl}
            onChange={setFormPhotoUrl}
            classification="público"
          />

          <CampoTexto
            label="Resumo Técnico / Destaque Esportivo"
            multiline
            rows={3}
            value={formScoutSummary}
            onChange={setFormScoutSummary}
            classification="público"
          />
        </div>
      </PainelLateral>

      <ConfirmarExclusao
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.participant.name || ''}
        itemTypeLabel="atleta da vitrine"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
