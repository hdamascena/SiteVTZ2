import React, { useState, useMemo } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type {
  VitalizarProject,
  ProjectParticipant,
  NextFitCsvAthleteRow,
} from '../types/index.ts';
import {
  NEXTFIT_SAMPLE_CSV_CONTENT,
  parseNextFitCsv,
  mergeNextFitRowsIntoProjects,
} from '../utils/nextfitCsv.ts';

interface NextFitParticipantsManagerProps {
  mode: 'projects_subtab' | 'import_hub';
  projects: VitalizarProject[];
  selectedProjectFilter?: string;
  onSelectProjectFilterChange?: (projectId: string) => void;
  onUpdateProjects: (
    updatedProjects: VitalizarProject[],
    toastMessage?: string,
    persistImmediately?: boolean
  ) => void;
  onNavigateToProjectsParticipants?: () => void;
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const NextFitParticipantsManager: React.FC<NextFitParticipantsManagerProps> = ({
  mode,
  projects,
  selectedProjectFilter = 'all',
  onSelectProjectFilterChange,
  onUpdateProjects,
  onNavigateToProjectsParticipants,
  onNotify,
}) => {
  const [internalProjectFilter, setInternalProjectFilter] = useState<string>(
    selectedProjectFilter || 'all'
  );
  const activeProjectFilter = onSelectProjectFilterChange
    ? selectedProjectFilter
    : internalProjectFilter;

  const setProjectFilter = (val: string) => {
    if (onSelectProjectFilterChange) {
      onSelectProjectFilterChange(val);
    } else {
      setInternalProjectFilter(val);
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CSV staging state
  const [stagedRows, setStagedRows] = useState<NextFitCsvAthleteRow[]>([]);
  const [ignoredContactCols, setIgnoredContactCols] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvTargetProjectId, setCsvTargetProjectId] = useState<string>('auto');
  const [csvFileName, setCsvFileName] = useState<string>('');

  // Create / Edit Participant Modal State (Strictly NO contact info)
  const [editingEntry, setEditingEntry] = useState<{
    projectId: string;
    isNew: boolean;
    participant: ProjectParticipant;
  } | null>(null);

  // Flatten all participants across projects
  const allFlattenedParticipants = useMemo(() => {
    const list: Array<{
      projectId: string;
      projectName: string;
      participant: ProjectParticipant;
    }> = [];

    projects.forEach((proj) => {
      (proj.participants || []).forEach((part) => {
        list.push({
          projectId: proj.id,
          projectName: proj.name,
          participant: part,
        });
      });
    });
    return list;
  }, [projects]);

  const filteredParticipants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFlattenedParticipants.filter(({ projectId, projectName, participant }) => {
      if (activeProjectFilter !== 'all' && projectId !== activeProjectFilter) {
        return false;
      }
      const effStatus = participant.enrollmentStatus || 'ativo';
      if (statusFilter !== 'all' && effStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && participant.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (participant.name || '').toLowerCase().includes(q) ||
        (participant.nextfitCode || '').toLowerCase().includes(q) ||
        (participant.modalityOrClass || '').toLowerCase().includes(q) ||
        (participant.position || '').toLowerCase().includes(q) ||
        (participant.category || '').toLowerCase().includes(q) ||
        (participant.schoolInfo?.schoolName || '').toLowerCase().includes(q) ||
        (projectName || '').toLowerCase().includes(q)
      );
    });
  }, [
    allFlattenedParticipants,
    activeProjectFilter,
    statusFilter,
    categoryFilter,
    searchQuery,
  ]);

  // Metrics
  const totalCount = allFlattenedParticipants.length;
  const activeCount = allFlattenedParticipants.filter(
    (x) => (x.participant.enrollmentStatus || 'ativo') === 'ativo'
  ).length;
  const pausedOrInactiveCount = allFlattenedParticipants.filter((x) => {
    const st = x.participant.enrollmentStatus || 'ativo';
    return st === 'trancado' || st === 'inativo' || st === 'pendente';
  }).length;
  const nextfitSyncedCount = allFlattenedParticipants.filter((x) =>
    Boolean(x.participant.nextfitCode)
  ).length;

  const handleDownloadSampleCsv = () => {
    const blob = new Blob(['\uFEFF' + NEXTFIT_SAMPLE_CSV_CONTENT], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-nextfit-atletas-vitalizar.csv';
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Planilha modelo .CSV do Next Fit baixada (sem campos de contato)!', 'info');
  };

  const handleExportParticipantsCsv = () => {
    const headers = [
      'Codigo NextFit',
      'Nome do Atleta',
      'Projeto Vinculado',
      'Modalidade / Turma',
      'Situacao Matricula',
      'Idade',
      'Data de Nascimento',
      'Categoria',
      'Posicao',
      'Altura',
      'Peso',
      'IMC',
      'Escola',
      'Observacoes Avaliacao',
    ];

    const rows = filteredParticipants.map(({ projectName, participant }) => [
      `"${(participant.nextfitCode || 'MANUAL').replace(/"/g, '""')}"`,
      `"${(participant.name || '').replace(/"/g, '""')}"`,
      `"${(projectName || '').replace(/"/g, '""')}"`,
      `"${(participant.modalityOrClass || participant.category || '').replace(/"/g, '""')}"`,
      `"${participant.enrollmentStatus || 'ativo'}"`,
      participant.age || 14,
      `"${(participant.birthDate || '').replace(/"/g, '""')}"`,
      `"${(participant.category || '').replace(/"/g, '""')}"`,
      `"${(participant.position || '').replace(/"/g, '""')}"`,
      `"${(participant.height || '').replace(/"/g, '""')}"`,
      `"${(participant.weight || '').replace(/"/g, '""')}"`,
      `"${(participant.bmi || '').replace(/"/g, '""')}"`,
      `"${(participant.schoolInfo?.schoolName || '').replace(/"/g, '""')}"`,
      `"${(participant.scoutReport?.summary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relacao-participantes-vitalizar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Relação de participantes exportada em .CSV com sucesso!', 'success');
  };

  const handleProcessCsvText = (rawText: string, sourceLabel: string) => {
    const preferredProj =
      activeProjectFilter !== 'all'
        ? activeProjectFilter
        : csvTargetProjectId !== 'auto'
        ? csvTargetProjectId
        : undefined;
    const parsed = parseNextFitCsv(rawText, projects, preferredProj);
    if (parsed.error) {
      setCsvError(parsed.error);
      setStagedRows([]);
      onNotify(parsed.error, 'error');
      return;
    }
    setCsvError(null);
    setStagedRows(parsed.rows);
    setIgnoredContactCols(parsed.ignoredContactColumns);
    setCsvFileName(sourceLabel);
    if (activeProjectFilter !== 'all') {
      setCsvTargetProjectId(activeProjectFilter);
    }
    onNotify(
      `${parsed.rows.length} atleta(s) lidos da planilha "${sourceLabel}". Revise e confirme o projeto associado abaixo!`,
      'info'
    );
  };

  const handleConfirmStagedImport = () => {
    if (stagedRows.length === 0) return;
    if (projects.length === 0) {
      onNotify('Cadastre pelo menos um projeto antes de vincular participantes.', 'error');
      return;
    }

    const { updatedProjects, addedCount, updatedCount } = mergeNextFitRowsIntoProjects(
      projects,
      stagedRows,
      csvTargetProjectId
    );

    onUpdateProjects(
      updatedProjects,
      `Sincronização Next Fit (.CSV) concluída: ${addedCount} novo(s) participante(s) adicionado(s) e ${updatedCount} atualizado(s)!`,
      true
    );
    setStagedRows([]);
    setCsvFileName('');
  };

  const handleOpenNewParticipantModal = () => {
    const defaultProjId =
      activeProjectFilter !== 'all'
        ? activeProjectFilter
        : projects[0]?.id || '';

    if (!defaultProjId) {
      onNotify('Cadastre um projeto primeiro para adicionar participantes.', 'error');
      return;
    }

    setEditingEntry({
      projectId: defaultProjId,
      isNew: true,
      participant: {
        id: `ath-${Date.now()}`,
        name: '',
        nickname: '',
        nextfitCode: `NF-${Math.floor(1000 + Math.random() * 9000)}`,
        enrollmentStatus: 'ativo',
        modalityOrClass: 'Futebol de Campo Sub-15',
        planName: 'Bolsa Atleta Vitalizar',
        bmi: '20.2',
        lastSyncDate: new Date().toLocaleDateString('pt-BR'),
        photoUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        jerseyNumber: 10,
        position: 'Meio-Campista',
        positionGroup: 'meio',
        preferredFoot: 'Destro',
        age: 14,
        birthDate: '2012',
        category: 'Sub-15',
        height: '1,68m',
        weight: '57kg',
        cardTier: 'destaque',
        stats: {
          pace: 82,
          shooting: 79,
          passing: 84,
          dribbling: 83,
          defending: 74,
          physical: 80,
          overall: 82,
        },
        schoolInfo: {
          schoolName: 'Rede Pública Municipal de Cariacica',
          grade: 'Ensino Fundamental',
          turn: 'Matutino',
          attendanceRate: '98%',
        },
        highlights: ['Destaque Assiduidade & Fair Play'],
        scoutReport: {
          summary:
            'Atleta em formação com excelente leitura tática, disciplina escolar e comprometimento nos treinos.',
          strengths: ['Visão de jogo', 'Disciplina tática'],
          developmentAreas: ['Finalização de média distância'],
          scoutRating: '4.8 / 5.0',
        },
        photos: [],
        videos: [],
      },
    });
  };

  const handleSaveParticipantModal = () => {
    if (!editingEntry) return;
    const { projectId, isNew, participant } = editingEntry;
    if (!participant.name.trim()) {
      onNotify('Informe o nome do atleta/participante.', 'error');
      return;
    }

    // Recompute BMI if height/weight changed
    const numH = parseFloat((participant.height || '').replace(',', '.').replace(/[^0-9.]/g, ''));
    const numW = parseFloat((participant.weight || '').replace(',', '.').replace(/[^0-9.]/g, ''));
    const hMeters = !Number.isNaN(numH) && numH > 0 ? (numH > 3 ? numH / 100 : numH) : 1.68;
    const wKg = !Number.isNaN(numW) && numW > 0 ? numW : 58;
    const computedBmi = (wKg / (hMeters * hMeters)).toFixed(1);

    const finalParticipant: ProjectParticipant = {
      ...participant,
      name: participant.name.trim(),
      nickname: (participant.nickname || participant.name.split(' ')[0]).trim(),
      bmi: computedBmi,
    };

    const nextProjects = projects.map((proj) => {
      const filteredOut = (proj.participants || []).filter(
        (p) => p.id !== finalParticipant.id
      );
      if (proj.id !== projectId) {
        return {
          ...proj,
          participants: filteredOut,
          filledSpots: filteredOut.length,
        };
      }
      const nextList = isNew
        ? [...filteredOut, finalParticipant]
        : (proj.participants || []).some((p) => p.id === finalParticipant.id)
        ? (proj.participants || []).map((p) =>
            p.id === finalParticipant.id ? finalParticipant : p
          )
        : [...filteredOut, finalParticipant];

      return {
        ...proj,
        participants: nextList,
        filledSpots: nextList.length,
      };
    });

    onUpdateProjects(
      nextProjects,
      isNew
        ? `Participante "${finalParticipant.name}" adicionado ao projeto!`
        : `Ficha de "${finalParticipant.name}" atualizada!`,
      true
    );
    setEditingEntry(null);
  };

  const handleChangeParticipantStatus = (
    projectId: string,
    participantId: string,
    newStatus: 'ativo' | 'trancado' | 'inativo' | 'pendente'
  ) => {
    const nextProjects = projects.map((proj) => {
      if (proj.id !== projectId) return proj;
      return {
        ...proj,
        participants: (proj.participants || []).map((p) =>
          p.id === participantId ? { ...p, enrollmentStatus: newStatus } : p
        ),
      };
    });
    onUpdateProjects(nextProjects, 'Status de matrícula atualizado!', false);
  };

  const handleReassignParticipantProject = (
    fromProjectId: string,
    participant: ProjectParticipant,
    toProjectId: string
  ) => {
    if (fromProjectId === toProjectId) return;
    const targetProj = projects.find((p) => p.id === toProjectId);
    if (!targetProj) return;

    const nextProjects = projects.map((proj) => {
      if (proj.id === fromProjectId) {
        const nextList = (proj.participants || []).filter((p) => p.id !== participant.id);
        return {
          ...proj,
          participants: nextList,
          filledSpots: nextList.length,
        };
      }
      if (proj.id === toProjectId) {
        const exists = (proj.participants || []).some((p) => p.id === participant.id);
        const nextList = exists
          ? proj.participants || []
          : [...(proj.participants || []), participant];
        return {
          ...proj,
          participants: nextList,
          filledSpots: nextList.length,
        };
      }
      return proj;
    });

    onUpdateProjects(
      nextProjects,
      `Participante "${participant.name}" associado ao projeto "${targetProj.name}"!`,
      true
    );
  };

  const handleRemoveParticipant = (
    projectId: string,
    participantId: string,
    participantName: string
  ) => {
    const nextProjects = projects.map((proj) => {
      if (proj.id !== projectId) return proj;
      const nextList = (proj.participants || []).filter((p) => p.id !== participantId);
      return {
        ...proj,
        participants: nextList,
        filledSpots: nextList.length,
      };
    });
    onUpdateProjects(
      nextProjects,
      `Participante "${participantName}" removido do projeto.`,
      false
    );
  };

  const selectedProjectObj = projects.find((p) => p.id === activeProjectFilter);

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* TOP NEXT FIT .CSV UPLOAD & SYNC CARD */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Integração Next Fit via Planilha .CSV
              </span>
              {selectedProjectObj && (
                <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#0284c7] px-2.5 py-0.5 rounded-md">
                  Projeto Selecionado: {selectedProjectObj.name}
                </span>
              )}
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                Privacidade Ativa: Sem dados de contato/telefone
              </span>
            </div>
            <h3 className="text-base font-black text-[#0a1e36] uppercase">
              {selectedProjectObj
                ? `Associar e Exibir Participantes — ${selectedProjectObj.name}`
                : mode === 'import_hub'
                ? 'Central de Importação de Atletas Next Fit (.CSV)'
                : 'Sincronizar e Associar Participantes aos Projetos (.CSV Next Fit)'}
            </h3>
            <p className="text-xs text-slate-600 max-w-3xl">
              Exporte o relatório de alunos/matrículas no painel do <strong>Next Fit</strong> em formato{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">.csv</code>, escolha o projeto de destino e envie abaixo para associar a lista vinculada a cada projeto específico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={
                activeProjectFilter !== 'all' ? activeProjectFilter : csvTargetProjectId
              }
              onChange={(e) => {
                const val = e.target.value;
                setCsvTargetProjectId(val);
                if (val !== 'auto') {
                  setProjectFilter(val);
                } else {
                  setProjectFilter('all');
                }
              }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 max-w-[230px]"
              title="Selecione a qual projeto específico a lista .CSV será associada"
            >
              <option value="auto">Vínculo Automático (pela Turma CSV)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Associar a: {p.name}
                </option>
              ))}
            </select>

            <label className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs whitespace-nowrap shrink-0">
              <Upload className="w-4 h-4" />
              <span>Subir Planilha .CSV Next Fit</span>
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    if (text) {
                      handleProcessCsvText(text, file.name);
                    }
                  };
                  reader.readAsText(file, 'UTF-8');
                  e.target.value = '';
                }}
              />
            </label>

            <button
              type="button"
              onClick={() =>
                handleProcessCsvText(
                  NEXTFIT_SAMPLE_CSV_CONTENT,
                  'relatorio-nextfit-exemplo-2026.csv'
                )
              }
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Testar imediatamente com uma relação de atletas modelo do Next Fit"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Carregar Exemplo Next Fit</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Baixar planilha modelo .CSV compatível com Excel e Next Fit"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Baixar Modelo .CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block">
              Total de Participantes
            </span>
            <span className="text-xl font-black text-[#0a1e36] font-mono tabular-nums mt-0.5 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-400">
              Distribuídos em {projects.length} projeto(s)
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 block">
              Matrículas Ativas
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono tabular-nums mt-0.5 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-700/80">
              Aptos para treinos e jogos
            </span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-900 block">
              Trancadas / Pendentes
            </span>
            <span className="text-xl font-black text-amber-700 font-mono tabular-nums mt-0.5 block">
              {pausedOrInactiveCount}
            </span>
            <span className="text-[11px] text-amber-800/80">
              Acompanhamento de secretaria
            </span>
          </div>

          <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200">
            <span className="text-[11px] font-bold text-[#0284c7] block">
              Sincronizados Next Fit
            </span>
            <span className="text-xl font-black text-[#0a1e36] font-mono tabular-nums mt-0.5 block">
              {nextfitSyncedCount}
            </span>
            <span className="text-[11px] text-slate-500">
              Com código de vínculo NF
            </span>
          </div>
        </div>

        {/* CSV Error Alert */}
        {csvError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{csvError}</span>
            </div>
            <button
              type="button"
              onClick={() => setCsvError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Staged CSV Preview & Target Project Assignment */}
        {stagedRows.length > 0 && (
          <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="font-black text-xs uppercase text-[#0a1e36]">
                    Pré-visualização da Planilha Next Fit: {csvFileName} ({stagedRows.length} atletas)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Escolha abaixo se deseja enviar todos para um projeto específico ou manter o vínculo automático pela coluna <strong>Modalidade / Turma</strong>.
                  {ignoredContactCols.length > 0 && (
                    <span className="text-emerald-700 font-semibold ml-1">
                      (Colunas de contato ignoradas automaticamente: {ignoredContactCols.join(', ')})
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={csvTargetProjectId}
                  onChange={(e) => setCsvTargetProjectId(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="auto">
                    Vincular automaticamente pela Turma/Modalidade
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      Enviar todos para: {p.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleConfirmStagedImport}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Importação ({stagedRows.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStagedRows([]);
                    setCsvFileName('');
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs min-w-[740px]">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2.5">Código NF</th>
                    <th className="p-2.5">Atleta / Participante</th>
                    <th className="p-2.5">Idade / Nasc.</th>
                    <th className="p-2.5">Modalidade Next Fit</th>
                    <th className="p-2.5">Medidas Físicas</th>
                    <th className="p-2.5">Matrícula</th>
                    <th className="p-2.5">Projeto Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagedRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono tabular-nums font-bold text-[#0284c7]">
                        {row.nextfitCode}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {row.name}
                        <span className="block text-[10px] font-normal text-slate-500">
                          {row.position} · {row.schoolName}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono tabular-nums text-slate-700">
                        {row.age} anos ({row.birthDate})
                      </td>
                      <td className="p-2.5 text-slate-700">
                        {row.modalityOrClass}
                        <span className="block text-[10px] text-slate-400">
                          {row.category} · {row.planName}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono tabular-nums text-slate-700">
                        {row.height} · {row.weight} · IMC {row.bmi}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            row.enrollmentStatus === 'ativo'
                              ? 'text-emerald-700'
                              : row.enrollmentStatus === 'trancado'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {row.enrollmentStatus}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <select
                          value={
                            csvTargetProjectId !== 'auto'
                              ? csvTargetProjectId
                              : row.targetProjectId || projects[0]?.id || ''
                          }
                          disabled={csvTargetProjectId !== 'auto'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStagedRows((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, targetProjectId: val } : r
                              )
                            );
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-800 max-w-[200px]"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* If rendered inside Import Hub, provide a quick shortcut to open the dedicated Participants sub-tab in Projects */}
        {mode === 'import_hub' && onNavigateToProjectsParticipants && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-600">
              Você também pode gerenciar, filtrar e importar participantes diretamente na aba{' '}
              <strong>Projetos & Elenco → Participantes</strong>.
            </span>
            <button
              type="button"
              onClick={onNavigateToProjectsParticipants}
              className="px-3.5 py-2 bg-[#0a1e36] hover:bg-[#0284c7] text-white font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <span>Abrir Aba de Participantes em Projetos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PARTICIPANTS DIRECTORY & FILTER BAR (SHOWN IN PROJECTS SUB-TAB & IMPORT HUB) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-sm text-[#0a1e36] uppercase">
              Relação de Atletas & Participantes dos Projetos ({filteredParticipants.length})
            </h4>
            <p className="text-xs text-slate-500">
              Visualize fichas técnicas, medidas antropométricas e status de matrícula do Next Fit (sem exposição de dados de contato).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewParticipantModal}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Participante</span>
            </button>

            <button
              type="button"
              onClick={handleExportParticipantsCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Relação (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, código NF, turma ou posição..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={activeProjectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Todos os Projetos ({allFlattenedParticipants.length})</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({(proj.participants || []).length})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Status: Todos</option>
              <option value="ativo">Matrícula Ativa</option>
              <option value="trancado">Trancado</option>
              <option value="pendente">Pendente</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Categorias: Todas</option>
              <option value="Sub-11">Sub-11</option>
              <option value="Sub-13">Sub-13</option>
              <option value="Sub-15">Sub-15</option>
              <option value="Sub-17">Sub-17</option>
              <option value="Sub-20">Sub-20</option>
              <option value="Vida Ativa 60+">Vida Ativa 60+</option>
              <option value="Adulto / Livre">Adulto / Livre</option>
            </select>
          </div>
        </div>

        {/* Participants Table */}
        {filteredParticipants.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              Nenhum participante encontrado com os filtros selecionados.
            </p>
            <p className="text-[11px] text-slate-500">
              Suba uma planilha .CSV do Next Fit acima ou clique em "+ Adicionar Participante".
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[820px]">
              <thead className="bg-[#0a1e36] text-white uppercase text-[10px]">
                <tr>
                  <th className="p-3">Atleta / Código NF</th>
                  <th className="p-3">Projeto & Modalidade/Turma</th>
                  <th className="p-3">Idade & Categoria</th>
                  <th className="p-3">Posição & Escola</th>
                  <th className="p-3">Dados Físicos</th>
                  <th className="p-3">Status Matrícula</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map(({ projectId, projectName, participant }) => {
                  const status = participant.enrollmentStatus || 'ativo';
                  return (
                    <tr key={`${projectId}-${participant.id}`} className="hover:bg-slate-50/90">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              participant.photoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80'
                            }
                            alt={participant.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {participant.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                              {participant.nextfitCode
                                ? `Next Fit: ${participant.nextfitCode}`
                                : `Camisa #${participant.jerseyNumber || 10}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <select
                          value={projectId}
                          onChange={(e) =>
                            handleReassignParticipantProject(
                              projectId,
                              participant,
                              e.target.value
                            )
                          }
                          className="px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg font-bold text-[#0a1e36] text-xs cursor-pointer max-w-[210px] block mb-0.5"
                          title="Associar participante a outro projeto específico"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-[11px] text-slate-500 block">
                          {participant.modalityOrClass || 'Turma Regular'}
                          {participant.planName ? ` · ${participant.planName}` : ''}
                        </span>
                      </td>

                      <td className="p-3 font-mono tabular-nums">
                        <span className="font-bold text-slate-800 block">
                          {participant.age} anos ({participant.birthDate})
                        </span>
                        <span className="text-[11px] text-[#0284c7] font-sans font-bold">
                          {participant.category}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">
                          {participant.position} ({participant.preferredFoot || 'Destro'})
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                          {participant.schoolInfo?.schoolName || 'Rede Pública Municipal'}
                        </span>
                      </td>

                      <td className="p-3 font-mono tabular-nums text-slate-700">
                        <span className="font-semibold block">
                          {participant.height || '1,68m'} · {participant.weight || '58kg'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {participant.bmi ? `IMC ${participant.bmi}` : 'Avaliação em dia'}
                        </span>
                      </td>

                      <td className="p-3">
                        <select
                          value={status}
                          onChange={(e) =>
                            handleChangeParticipantStatus(
                              projectId,
                              participant.id,
                              e.target.value as 'ativo' | 'trancado' | 'inativo' | 'pendente'
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border cursor-pointer ${
                            status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : status === 'trancado'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : status === 'pendente'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <option value="ativo">Ativo</option>
                          <option value="trancado">Trancado</option>
                          <option value="pendente">Pendente</option>
                          <option value="inativo">Inativo</option>
                        </select>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingEntry({
                              projectId,
                              isNew: false,
                              participant: { ...participant },
                            })
                          }
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-100 text-[#0284c7] rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Editar ficha técnica e dados físicos"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveParticipant(
                              projectId,
                              participant.id,
                              participant.name
                            )
                          }
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          title="Remover participante"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PARTICIPANT CREATE / EDIT MODAL (ZERO CONTACT INFORMATION) */}
      {/* ========================================================================= */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                  Ficha de Participante / Atleta (Sem Dados de Contato)
                </span>
                <h3 className="font-black text-base text-[#0a1e36] uppercase">
                  {editingEntry.isNew
                    ? 'Adicionar Participante ao Projeto'
                    : `Editar Ficha: ${editingEntry.participant.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Projeto Vinculado *
                  </label>
                  <select
                    value={editingEntry.projectId}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        projectId: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Código Next Fit
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.nextfitCode || ''}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          nextfitCode: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: NF-1042"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Status Matrícula
                  </label>
                  <select
                    value={editingEntry.participant.enrollmentStatus || 'ativo'}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          enrollmentStatus: e.target.value as
                            | 'ativo'
                            | 'trancado'
                            | 'inativo'
                            | 'pendente',
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="trancado">Trancado</option>
                    <option value="pendente">Pendente</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Nome Completo do Atleta / Participante *
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.name}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Idade
                  </label>
                  <input
                    type="number"
                    value={editingEntry.participant.age}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          age: Number(e.target.value) || 14,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Nascimento / Ano
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.birthDate}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          birthDate: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: 14/03/2011"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Modalidade / Turma Next Fit
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.modalityOrClass || ''}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          modalityOrClass: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: Futsal Sub-15 Manhã"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Categoria Esportiva
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.category}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          category: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: Sub-15"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Posição / Função
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.position}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          position: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: Meio-Campista / Ala"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Altura (ex: 1,72m)
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.height}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          height: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Peso (ex: 62kg)
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.weight}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          weight: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Escola / Instituição de Ensino
                  </label>
                  <input
                    type="text"
                    value={editingEntry.participant.schoolInfo?.schoolName || ''}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        participant: {
                          ...editingEntry.participant,
                          schoolInfo: {
                            ...(editingEntry.participant.schoolInfo || {
                              grade: 'Ensino Fundamental',
                              turn: 'Matutino',
                              attendanceRate: '98%',
                            }),
                            schoolName: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Avaliação Física / Parecer Técnico
                </label>
                <textarea
                  rows={2}
                  value={editingEntry.participant.scoutReport?.summary || ''}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      participant: {
                        ...editingEntry.participant,
                        scoutReport: {
                          ...(editingEntry.participant.scoutReport || {
                            strengths: ['Disciplina tática'],
                            developmentAreas: ['Fundamentos'],
                            scoutRating: '4.8 / 5.0',
                          }),
                          summary: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveParticipantModal}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
              >
                Salvar Participante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
