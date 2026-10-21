import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  Award,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  ChevronRight,
  Crosshair,
  Search,
  Filter,
  Mail,
  UserCheck,
  Activity,
  Upload,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  LayoutGrid,
  List,
  Eye,
  Plus,
  ArrowRightLeft,
} from 'lucide-react';
import {
  VitalizarProject,
  ProjectParticipant,
  NextFitCsvAthleteRow,
} from '../types/index.ts';
import { PlayerCard } from './PlayerCard.tsx';
import { useClubData } from '../context/ClubDataContext.tsx';
import {
  NEXTFIT_SAMPLE_CSV_CONTENT,
  parseNextFitCsv,
  mergeNextFitRowsIntoProjects,
} from '../utils/nextfitCsv.ts';

export type ProjectDetailTab = 'funcionamento' | 'participantes' | 'equipe' | 'atletas';

interface ProjectDetailPageProps {
  project: VitalizarProject;
  initialTab?: ProjectDetailTab;
  onBack: () => void;
  onEnrollDirect: (project: VitalizarProject) => void;
  onInspectPlayer: (participant: ProjectParticipant) => void;
  onOpenScoutContact: (participant: ProjectParticipant) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  initialTab = 'funcionamento',
  onBack,
  onEnrollDirect,
  onInspectPlayer,
  onOpenScoutContact,
}) => {
  const { projects, saveAdminChanges, showToast } = useClubData();

  // Always resolve the freshest version of this project from ClubDataContext
  const liveProject = useMemo(
    () => projects.find((p) => p.id === project.id) || project,
    [projects, project]
  );

  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(initialTab);
  const [filterPosition, setFilterPosition] = useState<string>('todas');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Participants Tab specific state
  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [partStatusFilter, setPartStatusFilter] = useState<string>('all');
  const [partCategoryFilter, setPartCategoryFilter] = useState<string>('all');
  const [partViewMode, setPartViewMode] = useState<'table' | 'cards'>('table');
  const [showCsvPanel, setShowCsvPanel] = useState<boolean>(false);
  const [showTransferPanel, setShowTransferPanel] = useState<boolean>(false);
  const [stagedRows, setStagedRows] = useState<NextFitCsvAthleteRow[]>([]);
  const [ignoredContactCols, setIgnoredContactCols] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvBindMode, setCsvBindMode] = useState<'this_project' | 'per_row'>('this_project');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, project.id]);

  const participants = liveProject.participants || [];
  const staff = liveProject.staff || [];
  const functioning = liveProject.functioning;

  // Filter participants for Scouts Tab
  const filteredParticipants = participants.filter((p) => {
    const matchesPosition =
      filterPosition === 'todas' || p.positionGroup === filterPosition;
    const matchesCategory =
      filterCategory === 'todas' ||
      p.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchesQuery =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPosition && matchesCategory && matchesQuery;
  });

  // Filter participants for 'Participantes' Tab
  const filteredProjectParticipants = useMemo(() => {
    const q = partSearchQuery.trim().toLowerCase();
    return participants.filter((p) => {
      const st = p.enrollmentStatus || 'ativo';
      if (partStatusFilter !== 'all' && st !== partStatusFilter) return false;
      if (
        partCategoryFilter !== 'all' &&
        !(p.category || '').toLowerCase().includes(partCategoryFilter.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.nextfitCode || '').toLowerCase().includes(q) ||
        (p.modalityOrClass || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q) ||
        (p.schoolInfo?.schoolName || '').toLowerCase().includes(q)
      );
    });
  }, [participants, partSearchQuery, partStatusFilter, partCategoryFilter]);

  // Participants from other projects that can be associated with this project
  const otherProjectsParticipants = useMemo(() => {
    const list: Array<{
      sourceProjectId: string;
      sourceProjectName: string;
      participant: ProjectParticipant;
    }> = [];
    projects.forEach((pr) => {
      if (pr.id === liveProject.id) return;
      (pr.participants || []).forEach((pt) => {
        list.push({
          sourceProjectId: pr.id,
          sourceProjectName: pr.name,
          participant: pt,
        });
      });
    });
    return list;
  }, [projects, liveProject.id]);

  const handleProcessCsvForProject = (rawText: string, fileName: string) => {
    const parsed = parseNextFitCsv(rawText, projects, liveProject.id);
    if (parsed.error) {
      setCsvError(parsed.error);
      setStagedRows([]);
      showToast(parsed.error, 'error');
      return;
    }
    setCsvError(null);
    setStagedRows(parsed.rows);
    setIgnoredContactCols(parsed.ignoredContactColumns);
    setCsvFileName(fileName);
    setCsvBindMode('this_project');
    setShowCsvPanel(true);
    showToast(
      `${parsed.rows.length} participante(s) lidos de "${fileName}" prontos para associação ao projeto ${liveProject.name}!`,
      'info'
    );
  };

  const handleConfirmProjectCsvImport = () => {
    if (stagedRows.length === 0) return;
    const { updatedProjects, addedCount, updatedCount } = mergeNextFitRowsIntoProjects(
      projects,
      stagedRows,
      csvBindMode === 'this_project' ? liveProject.id : 'auto'
    );
    saveAdminChanges({
      projects: updatedProjects,
      toastMessage: `Lista CSV associada ao projeto "${liveProject.name}": ${addedCount} novo(s) e ${updatedCount} atualizado(s)!`,
      logDetails: `Importação CSV associada ao projeto ${liveProject.name} (${addedCount} adicionados, ${updatedCount} atualizados).`,
    });
    setStagedRows([]);
    setCsvFileName('');
    setShowCsvPanel(false);
  };

  const handleAssociateParticipantToProject = (
    sourceProjectId: string,
    participant: ProjectParticipant
  ) => {
    const updatedProjects = projects.map((pr) => {
      if (pr.id === sourceProjectId) {
        const nextList = (pr.participants || []).filter((p) => p.id !== participant.id);
        return { ...pr, participants: nextList, filledSpots: nextList.length };
      }
      if (pr.id === liveProject.id) {
        const exists = (pr.participants || []).some((p) => p.id === participant.id);
        const nextList = exists
          ? pr.participants || []
          : [...(pr.participants || []), participant];
        return { ...pr, participants: nextList, filledSpots: nextList.length };
      }
      return pr;
    });

    saveAdminChanges({
      projects: updatedProjects,
      toastMessage: `Participante "${participant.name}" associado ao projeto ${liveProject.name}!`,
      logDetails: `Participante ${participant.name} vinculado ao projeto ${liveProject.name}.`,
    });
  };

  const handleReassignParticipantProject = (
    participant: ProjectParticipant,
    targetProjectId: string
  ) => {
    if (targetProjectId === liveProject.id) return;
    const targetProj = projects.find((p) => p.id === targetProjectId);
    if (!targetProj) return;

    const updatedProjects = projects.map((pr) => {
      if (pr.id === liveProject.id) {
        const nextList = (pr.participants || []).filter((p) => p.id !== participant.id);
        return { ...pr, participants: nextList, filledSpots: nextList.length };
      }
      if (pr.id === targetProjectId) {
        const exists = (pr.participants || []).some((p) => p.id === participant.id);
        const nextList = exists
          ? pr.participants || []
          : [...(pr.participants || []), participant];
        return { ...pr, participants: nextList, filledSpots: nextList.length };
      }
      return pr;
    });

    saveAdminChanges({
      projects: updatedProjects,
      toastMessage: `Participante "${participant.name}" transferido para ${targetProj.name}!`,
      logDetails: `Participante ${participant.name} reassociado para ${targetProj.name}.`,
    });
  };

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
    showToast('Planilha modelo .CSV baixada com sucesso!', 'info');
  };

  const handleExportProjectParticipantsCsv = () => {
    const headers = [
      'Codigo NextFit',
      'Nome do Participante',
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

    const rows = filteredProjectParticipants.map((p) => [
      `"${(p.nextfitCode || 'MANUAL').replace(/"/g, '""')}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(liveProject.name || '').replace(/"/g, '""')}"`,
      `"${(p.modalityOrClass || p.category || '').replace(/"/g, '""')}"`,
      `"${p.enrollmentStatus || 'ativo'}"`,
      p.age || 14,
      `"${(p.birthDate || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.position || '').replace(/"/g, '""')}"`,
      `"${(p.height || '').replace(/"/g, '""')}"`,
      `"${(p.weight || '').replace(/"/g, '""')}"`,
      `"${(p.bmi || '').replace(/"/g, '""')}"`,
      `"${(p.schoolInfo?.schoolName || '').replace(/"/g, '""')}"`,
      `"${(p.scoutReport?.summary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-${liveProject.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Lista de participantes de "${liveProject.name}" exportada em .CSV!`, 'success');
  };

  const available = liveProject.availableSpots ?? 20;
  const total = liveProject.totalSpots ?? 100;
  const filled = liveProject.filledSpots ?? participants.length ?? (total - available);
  const percentFilled = Math.min(100, Math.round((filled / Math.max(1, total)) * 100));

  const activeEnrollmentsCount = participants.filter(
    (p) => (p.enrollmentStatus || 'ativo') === 'ativo'
  ).length;
  const nextfitLinkedCount = participants.filter((p) => Boolean(p.nextfitCode)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#0284c7]" />
          <span>Voltar a Todos os Projetos</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-xs font-bold uppercase tracking-wider">
            {liveProject.category.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Project Hero Header with Official Shield */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-10 border border-slate-700 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Project Shield */}
            {liveProject.shieldUrl ? (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 backdrop-blur-md p-3 border-2 border-white/30 shadow-2xl shrink-0 flex items-center justify-center transition-transform hover:scale-105">
                <img
                  src={liveProject.shieldUrl}
                  alt={`Escudo oficial ${liveProject.name}`}
                  className="w-full h-full object-contain filter drop-shadow-lg"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-sky-600/30 border-2 border-sky-400 p-3 flex items-center justify-center shrink-0">
                <Shield className="w-12 h-12 text-sky-300" />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-sky-400">
                Associação Esportiva Vitalizar · Polo Cariacica/ES
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {liveProject.name}
              </h1>
              {liveProject.motto && (
                <p className="text-sm sm:text-base font-medium text-amber-300/90 italic">
                  "{liveProject.motto}"
                </p>
              )}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{liveProject.location}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{liveProject.schedule}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Coordenação: {liveProject.coordinator}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Spots & Fast Action Box */}
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Quadro de Vagas</span>
                <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  {available} vagas abertas
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full"
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{participants.length} participantes vinculados</span>
                <span>Total: {total} vagas</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEnrollDirect(liveProject)}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0284c7] to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Fazer Cadastro Imediato</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('funcionamento')}
          className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'funcionamento'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Como Funciona o Projeto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participantes')}
          className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'participantes'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participantes ({participants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'equipe'
              ? 'bg-[#0284c7] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Equipe de Professores ({staff.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('atletas')}
          className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'atletas'
              ? 'bg-slate-900 text-amber-400 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span>Vitrine Olheiros & Cartinhas ({participants.length})</span>
        </button>
      </div>

      {/* TAB: PARTICIPANTES VINCULADOS AO PROJETO (CSV / NEXT FIT) */}
      {activeTab === 'participantes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & CSV Association Banner for this specific project */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Relação Vinculada ao Projeto
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                    Privacidade LGPD: Sem exposição de telefone ou contato
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Participantes — {liveProject.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Consulte abaixo a relação nominal de participantes e atletas vinculados especificamente ao projeto{' '}
                  <strong className="text-slate-900">{liveProject.name}</strong> ou importe uma planilha{' '}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">.csv</code> (Next Fit / Excel) para associar novos participantes diretamente a este projeto.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Associar Lista .CSV a Este Projeto</span>
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
                          handleProcessCsvForProject(text, file.name);
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
                    handleProcessCsvForProject(
                      NEXTFIT_SAMPLE_CSV_CONTENT,
                      `nextfit-${liveProject.id}-exemplo.csv`
                    )
                  }
                  className="px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Carregar planilha de exemplo do Next Fit vinculada a este projeto"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Carregar Exemplo .CSV</span>
                </button>

                {otherProjectsParticipants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTransferPanel((prev) => !prev)}
                    className={`px-3.5 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border ${
                      showTransferPanel
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Vincular de Outros Projetos ({otherProjectsParticipants.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Baixar modelo de planilha .CSV"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Modelo .CSV</span>
                </button>
              </div>
            </div>

            {/* Project Participants KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Participantes neste Projeto
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5 block">
                  {participants.length}
                </span>
                <span className="text-[11px] text-slate-400">
                  Vinculados a {liveProject.name}
                </span>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  Matrículas Ativas
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-0.5 block">
                  {activeEnrollmentsCount}
                </span>
                <span className="text-[11px] text-emerald-700/80">
                  Frequência regular nas turmas
                </span>
              </div>

              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200">
                <span className="text-[11px] font-bold text-[#0284c7] block">
                  Sincronizados via CSV / Next Fit
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5 block">
                  {nextfitLinkedCount}
                </span>
                <span className="text-[11px] text-slate-500">
                  Com código de matrícula vinculado
                </span>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Capacidade & Vagas
                </span>
                <span className="text-2xl font-black text-amber-700 font-mono tabular-nums mt-0.5 block">
                  {available} abertas
                </span>
                <span className="text-[11px] text-amber-800/80">
                  De {total} vagas totais do projeto
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

            {/* Staged CSV Association Preview for This Project */}
            {showCsvPanel && stagedRows.length > 0 && (
              <div className="p-5 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <h4 className="font-black text-xs sm:text-sm uppercase text-slate-900">
                        Associar Lista Importada ({stagedRows.length} participantes) ao Projeto: {liveProject.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Arquivo: <strong>{csvFileName}</strong>. Confirme abaixo para vincular e exibir esta lista diretamente em{' '}
                      <strong>{liveProject.name}</strong>.
                      {ignoredContactCols.length > 0 && (
                        <span className="text-emerald-800 font-semibold ml-1">
                          (Colunas de contato removidas automaticamente: {ignoredContactCols.join(', ')})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      value={csvBindMode}
                      onChange={(e) =>
                        setCsvBindMode(e.target.value as 'this_project' | 'per_row')
                      }
                      className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="this_project">
                        Vincular todos a: {liveProject.name}
                      </option>
                      <option value="per_row">
                        Escolher projeto individualmente por linha
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={handleConfirmProjectCsvImport}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Associação ({stagedRows.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStagedRows([]);
                        setCsvFileName('');
                        setShowCsvPanel(false);
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Código NF</th>
                        <th className="p-2.5">Participante</th>
                        <th className="p-2.5">Idade / Nasc.</th>
                        <th className="p-2.5">Turma / Modalidade CSV</th>
                        <th className="p-2.5">Avaliação Física</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Projeto Associado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stagedRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-[#0284c7]">
                            {row.nextfitCode}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {row.name}
                            <span className="block text-[10px] font-normal text-slate-500">
                              {row.position} · {row.schoolName}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-700">
                            {row.age} anos ({row.birthDate})
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {row.modalityOrClass}
                            <span className="block text-[10px] text-slate-400">
                              {row.category}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-700">
                            {row.height} · {row.weight} · IMC {row.bmi}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                              {row.enrollmentStatus}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {csvBindMode === 'this_project' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] inline-block">
                                {liveProject.name}
                              </span>
                            ) : (
                              <select
                                value={row.targetProjectId || liveProject.id}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStagedRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, targetProjectId: val } : r
                                    )
                                  );
                                }}
                                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-800"
                              >
                                {projects.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Associate Participants from Other Projects Panel */}
            {showTransferPanel && otherProjectsParticipants.length > 0 && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase">
                      Associar Participantes já Importados em Outros Projetos para {liveProject.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Clique em "Vincular a Este Projeto" para associar imediatamente qualquer participante da lista abaixo ao projeto {liveProject.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTransferPanel(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Fechar ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {otherProjectsParticipants.map(
                    ({ sourceProjectId, sourceProjectName, participant }) => (
                      <div
                        key={`${sourceProjectId}-${participant.id}`}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={participant.photoUrl}
                            alt={participant.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">
                              {participant.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              Origem: {sourceProjectName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAssociateParticipantToProject(sourceProjectId, participant)
                          }
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          + Vincular
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Filters & View Switcher Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                  placeholder={`Buscar participante em ${liveProject.name} por nome, código NF, turma ou escola...`}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={partStatusFilter}
                  onChange={(e) => setPartStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  <option value="all">Status: Todos ({participants.length})</option>
                  <option value="ativo">Matrícula Ativa</option>
                  <option value="trancado">Trancado</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativo">Inativo</option>
                </select>

                <select
                  value={partCategoryFilter}
                  onChange={(e) => setPartCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="Sub-11">Sub-11</option>
                  <option value="Sub-13">Sub-13</option>
                  <option value="Sub-15">Sub-15</option>
                  <option value="Sub-17">Sub-17</option>
                  <option value="Sub-20">Sub-20</option>
                  <option value="Vida Ativa">Vida Ativa 60+</option>
                </select>

                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setPartViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      partViewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Lista Nominal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      partViewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportProjectParticipantsCsv}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar .CSV</span>
                </button>
              </div>
            </div>

            {/* Participants List (Table or Cards) */}
            {filteredProjectParticipants.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    Nenhum participante encontrado neste projeto com os filtros atuais
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Suba uma planilha .CSV acima para associar participantes diretamente ao projeto{' '}
                    <strong>{liveProject.name}</strong> ou clique em "Carregar Exemplo .CSV".
                  </p>
                </div>
              </div>
            ) : partViewMode === 'table' ? (
              <div className="rounded-2xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[820px]">
                  <thead className="bg-slate-900 text-white uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Participante / Código NF</th>
                      <th className="p-3.5">Turma / Modalidade</th>
                      <th className="p-3.5">Idade & Categoria</th>
                      <th className="p-3.5">Avaliação Física</th>
                      <th className="p-3.5">Escola & Frequência</th>
                      <th className="p-3.5">Status Matrícula</th>
                      <th className="p-3.5">Projeto Associado</th>
                      <th className="p-3.5 text-right">Ficha Técnica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredProjectParticipants.map((p) => {
                      const status = p.enrollmentStatus || 'ativo';
                      return (
                        <tr key={p.id} className="hover:bg-sky-50/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.photoUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {p.name}
                                </span>
                                <span className="text-[11px] font-mono text-[#0284c7] font-semibold">
                                  {p.nextfitCode ? `CSV/NF: ${p.nextfitCode}` : `Matrícula #${p.jerseyNumber || 10}`}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 block">
                              {p.modalityOrClass || liveProject.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {p.position} {p.planName ? `· ${p.planName}` : ''}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-slate-800 block">
                              {p.age} anos ({p.birthDate})
                            </span>
                            <span className="text-[11px] font-sans font-bold text-[#0284c7]">
                              {p.category}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-slate-700">
                            <span className="font-semibold block">
                              {p.height || '1,68m'} · {p.weight || '58kg'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {p.bmi ? `IMC ${p.bmi}` : 'Antropometria OK'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-medium text-slate-800 block truncate max-w-[180px]">
                              {p.schoolInfo?.schoolName || 'Rede Pública Municipal'}
                            </span>
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              Assiduidade: {p.schoolInfo?.attendanceRate || '96%'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-block border ${
                                status === 'ativo'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : status === 'trancado'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : status === 'pendente'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <select
                              value={liveProject.id}
                              onChange={(e) =>
                                handleReassignParticipantProject(p, e.target.value)
                              }
                              className="px-2.5 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 max-w-[175px] cursor-pointer"
                              title="Associar participante a outro projeto específico"
                            >
                              {projects.map((projItem) => (
                                <option key={projItem.id} value={projItem.id}>
                                  {projItem.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onInspectPlayer(p)}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-[#0284c7] text-[#0284c7] hover:text-white border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Ficha</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjectParticipants.map((p) => {
                  const status = p.enrollmentStatus || 'ativo';
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-sky-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-[#0284c7] block">
                              {p.nextfitCode ? `Next Fit: ${p.nextfitCode}` : `Camisa #${p.jerseyNumber}`}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {p.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {p.modalityOrClass || liveProject.name}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${
                            status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'trancado'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-center text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Idade/Cat.</span>
                          <span className="font-bold text-slate-800">
                            {p.age}a · {p.category}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Medidas</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {p.height} · {p.weight}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">IMC</span>
                          <span className="font-bold text-emerald-700 font-mono">
                            {p.bmi || '20.2'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500 truncate">
                          {p.schoolInfo?.schoolName || 'Rede Municipal'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onInspectPlayer(p)}
                          className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ficha Completa</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: FUNCIONAMENTO DO PROJETO */}
      {activeTab === 'funcionamento' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {functioning ? (
            <>
              {/* Overview & Methodology */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5 text-[#0284c7]">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Visão Geral & Objetivos
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {functioning.overview}
                  </p>
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Público-Alvo:
                    </span>
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {project.targetAudience}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5 text-sky-700">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Metodologia Pedagógica & Desportiva
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {functioning.methodology}
                  </p>
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      Fonte de Custeio / Parcerias:
                    </span>
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {project.fundingSource}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule and Polos Table */}
              {functioning.scheduleDetails && functioning.scheduleDetails.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        Grade de Dias, Horários & Polos
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Turmas distribuídas por faixa etária e nível técnico nos polos de Cariacica.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                      Atividades 100% Gratuitas
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                          <th className="py-3 px-4 font-bold">Dia da Semana</th>
                          <th className="py-3 px-4 font-bold">Horário</th>
                          <th className="py-3 px-4 font-bold">Polo / Espaço</th>
                          <th className="py-3 px-4 font-bold">Modalidade / Categoria</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {functioning.scheduleDetails.map((item, idx) => (
                          <tr key={idx} className="hover:bg-sky-50/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.day}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono">
                              {item.hours}
                            </td>
                            <td className="py-3 px-4 text-slate-700 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#0284c7] shrink-0" />
                              <span>{item.polo}</span>
                            </td>
                            <td className="py-3 px-4 font-bold text-[#0284c7]">
                              {item.modality}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Requirements & Benefits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Requirements */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5 text-amber-600">
                    <GraduationCap className="w-5 h-5" />
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Pré-Requisitos para Participação
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {functioning.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5 text-emerald-600">
                    <Award className="w-5 h-5" />
                    <h3 className="font-extrabold text-lg text-slate-900">
                      Benefícios Fornecidos aos Alunos
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {functioning.benefits.map((ben, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Direct Enrollment Callout Box */}
              <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50 border border-sky-200 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-slate-900">
                    Pronto para ingressar no {project.name}?
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl">
                    As inscrições são gratuitas e realizadas por ordem de preenchimento. Garanta a sua vaga nas turmas regulares de Cariacica.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEnrollDirect(project)}
                  className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  Fazer Cadastro Imediato
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              <p>Detalhes operacionais deste projeto em atualização.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EQUIPE TÉCNICA (PROFESSORES & AUXILIARES) */}
      {activeTab === 'equipe' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#0284c7] uppercase tracking-wider">
                Corpo Docente & Suporte Técnico
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Professores, Treinadores e Auxiliares Responsáveis
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Profissionais registrados no CREF/CREFITO com sólida vivência na formação desportiva e psicopedagógica.
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-[#0284c7] text-xs font-bold self-start sm:self-auto">
              {staff.length} Membros na Comissão
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {staff.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-sky-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7] block">
                      {member.role}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5 truncate">
                      {member.name}
                    </h4>
                    {member.cref && (
                      <span className="inline-block mt-1 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {member.cref}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {member.bio}
                </p>

                {member.specialties && member.specialties.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Especialidades & Foco
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.specialties.map((spec, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.contact && (
                  <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">{member.contact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ELENCO & CARTINHAS DE JOGADOR (VITRINE DE OLHEIROS) */}
      {activeTab === 'atletas' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Scout Introduction Banner */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                  Vitrine Oficial de Olheiros & Scouts
                </span>
                <span className="text-xs text-slate-400">· {project.name}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Cartinhas Técnicas dos Atletas em Destaque
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Avaliados por índices biométricos, velocidade aferida em radar, minutagem em campo e conformidade de frequência escolar. Clique em qualquer cartinha para abrir o dossiê detalhado, assistir vídeos e solicitar avaliação técnica para o seu clube.
              </p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 flex items-center gap-4 shrink-0">
              <div className="text-center">
                <span className="block text-2xl font-black text-amber-400">
                  {participants.length}
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Atletas com Cartinha
                </span>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <span className="block text-2xl font-black text-sky-400">
                  100%
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Com Vídeos & Fotos
                </span>
              </div>
            </div>
          </div>

          {/* Scout Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, apelido, número ou posição do atleta..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Position and Category Dropdowns */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="todas">Todas as Posições</option>
                <option value="goleiro">Goleiros</option>
                <option value="defesa">Defensores / Zagueiros</option>
                <option value="meio">Meio-Campistas / Volantes</option>
                <option value="ataque">Atacantes / Extremos</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="todas">Todas as Categorias</option>
                <option value="sub-13">Sub-13</option>
                <option value="sub-15">Sub-15</option>
                <option value="sub-17">Sub-17</option>
              </select>
            </div>
          </div>

          {/* Player Trading Cards Grid */}
          {filteredParticipants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParticipants.map((participant) => (
                <PlayerCard
                  key={participant.id}
                  participant={participant}
                  shieldUrl={project.shieldUrl}
                  projectName={project.name}
                  onInspect={onInspectPlayer}
                  onOpenScout={onOpenScoutContact}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Crosshair className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">
                Nenhum atleta encontrado com estes filtros
              </h4>
              <p className="text-xs text-slate-500">
                Tente redefinir a busca ou selecione outra categoria ou setor de campo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterPosition('todas');
                  setFilterCategory('todas');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
