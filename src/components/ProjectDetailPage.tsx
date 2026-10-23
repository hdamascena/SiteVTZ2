import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Shield,
  Award,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Crosshair,
  Search,
  Mail,
  UserCheck,
  Activity,
  ShieldCheck,
  Eye,
  Trophy,
  Pencil,
} from 'lucide-react';
import {
  VitalizarProject,
  ProjectParticipant,
  syncProjectSpotsAndTeams,
  getParticipantModalityProfile,
} from '../types/index.ts';
import { PlayerCard } from './PlayerCard.tsx';
import { useClubData } from '../context/ClubDataContext.tsx';

export type ProjectDetailTab = 'funcionamento' | 'participantes' | 'equipe' | 'atletas';

interface ProjectDetailPageProps {
  project: VitalizarProject;
  initialTab?: ProjectDetailTab;
  onBack: () => void;
  onEnrollDirect: (project: VitalizarProject, teamId?: string) => void;
  onInspectPlayer: (participant: ProjectParticipant) => void;
  onEditPlayer?: (participant: ProjectParticipant) => void;
  onOpenScoutContact: (participant: ProjectParticipant) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  initialTab = 'funcionamento',
  onBack,
  onEnrollDirect,
  onInspectPlayer,
  onEditPlayer,
  onOpenScoutContact,
}) => {
  const { projects } = useClubData();

  const liveProject = useMemo(() => {
    const found = projects.find((p) => p.id === project.id) || project;
    return syncProjectSpotsAndTeams(found);
  }, [projects, project]);

  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(initialTab);
  const [selectedModality, setSelectedModality] = useState<string>('todas');
  const [filterPosition, setFilterPosition] = useState<string>('todas');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [partTeamFilter, setPartTeamFilter] = useState<string>('all');

  useEffect(() => {
    setActiveTab(initialTab);
    setSelectedModality('todas');
    setPartTeamFilter('all');
  }, [initialTab, project.id]);

  const participants = liveProject.participants || [];
  const teams = liveProject.teams || [];
  const modalities = useMemo(() => {
    if (liveProject.modalities && liveProject.modalities.length > 0) {
      return liveProject.modalities;
    }
    return Array.from(new Set(teams.map((t) => t.modality).filter(Boolean)));
  }, [liveProject.modalities, teams]);

  const filteredTeams = useMemo(() => {
    if (selectedModality === 'todas') return teams;
    return teams.filter((t) => t.modality === selectedModality);
  }, [teams, selectedModality]);

  const staff = liveProject.staff || [];
  const functioning = liveProject.functioning;

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

  const filteredProjectParticipants = useMemo(() => {
    const q = partSearchQuery.trim().toLowerCase();
    return participants.filter((p) => {
      if ((p.enrollmentStatus || 'ativo') === 'inativo') return false;
      if (partTeamFilter !== 'all') {
        const teamObj = teams.find((t) => t.id === partTeamFilter);
        const matchesTeam =
          p.teamId === partTeamFilter ||
          (teamObj &&
            (p.modalityOrClass || '')
              .toLowerCase()
              .includes(teamObj.name.toLowerCase()));
        if (!matchesTeam) return false;
      }
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.nickname || '').toLowerCase().includes(q) ||
        (p.modalityOrClass || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q)
      );
    });
  }, [participants, partSearchQuery, partTeamFilter, teams]);

  const total = liveProject.totalSpots ?? 300;
  const filled = liveProject.filledSpots ?? participants.length;
  const available = liveProject.availableSpots ?? Math.max(0, total - filled);
  const percentFilled = Math.min(100, Math.round((filled / Math.max(1, total)) * 100));

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

        <div className="flex items-center gap-2 text-xs font-semibold text-[#0284c7] uppercase tracking-wider">
          <span>{liveProject.incentiveLaw || liveProject.category.replace('_', ' ')}</span>
          {liveProject.projectNumber && (
            <span className="px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800 font-mono">
              Nº {liveProject.projectNumber}
            </span>
          )}
        </div>
      </div>

      {/* Project Hero Header with Official Shield */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-10 border border-slate-700 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {liveProject.shieldUrl ? (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 backdrop-blur-md p-3 border-2 border-white/30 shadow-2xl shrink-0 flex items-center justify-center">
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
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-sky-400">
                  Associação Esportiva Vitalizar · Cariacica/ES
                </span>
                {modalities.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 rounded bg-white/15 text-white text-[11px] font-bold"
                  >
                    {mod}
                  </span>
                ))}
              </div>
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
                <span className="text-slate-300">
                  Quadro Geral ({teams.length || 1} Times)
                </span>
                <span className="text-emerald-300 font-mono tabular-nums">
                  {available} vagas abertas
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full"
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>{filled} atletas vinculados</span>
                <span>Total: {total} vagas</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEnrollDirect(liveProject)}
              className="w-full py-3 px-4 bg-[#0284c7] hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Escolher Time e Fazer Inscrição</span>
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
          <Trophy className="w-4 h-4" />
          <span>Modalidades, Times & Vagas ({teams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participantes')}
          className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'participantes'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participantes por Time ({participants.length})</span>
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
          <span>Equipe Técnica ({staff.length})</span>
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

      {/* TAB: PARTICIPANTES (APENAS CARTÕES PÚBLICOS — PROTEÇÃO LGPD) */}
      {activeTab === 'participantes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-800">
                    Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Exibição exclusiva de dados públicos esportivos</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Times e Atletas Vinculados — {liveProject.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Relação de atletas e participantes integrados aos Times/Turmas do projeto{' '}
                  <strong className="text-slate-900">{liveProject.name}</strong>. Cada atleta vinculado preenche automaticamente uma vaga em seu respectivo Time.
                </p>
              </div>
            </div>

            {/* Public Search & Team Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                  placeholder="Buscar participante por nome, apelido, posição ou time..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={partTeamFilter}
                onChange={(e) => setPartTeamFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="all">Todos os Times / Turmas ({participants.length})</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.filledSpots ?? 0}/{t.totalSpots} vagas)
                  </option>
                ))}
              </select>
            </div>

            {filteredProjectParticipants.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  Nenhum participante encontrado com os filtros atuais
                </h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjectParticipants.map((p) => {
                  const linkedTeam = teams.find((t) => t.id === p.teamId);
                  const modProfile = getParticipantModalityProfile(
                    p.modality || linkedTeam?.modality,
                    p.modalityOrClass
                  );
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-sky-300 transition-all flex flex-col justify-between space-y-3"
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
                            <span className="text-[11px] font-mono font-bold text-[#0284c7] block">
                              Camisa #{p.jerseyNumber} · {p.category} · OVR {p.stats.overall}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {p.name}
                            </h4>
                            <span className="text-[11px] text-slate-600 block truncate">
                              {p.position} · {modProfile.modalityName} ({modProfile.dominanceShortLabel}: {p.preferredFoot})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 bg-white px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700 truncate">
                          {linkedTeam ? linkedTeam.name : p.modalityOrClass || liveProject.name}
                        </span>
                        <span className="font-bold text-emerald-700 shrink-0">
                          Freq. {p.schoolInfo?.attendanceRate || '98%'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                        <button
                          type="button"
                          onClick={() =>
                            onEditPlayer ? onEditPlayer(p) : onInspectPlayer(p)
                          }
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar Perfil</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onInspectPlayer(p)}
                          className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Cartinha</span>
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

      {/* TAB 1: MODALIDADES, TIMES / TURMAS & FUNCIONAMENTO DO PROJETO */}
      {activeTab === 'funcionamento' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* MODALIDADES E TIMES / TURMAS GRID */}
          {teams.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">
                    Estrutura Esportiva Oficial · Modalidades & Times
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Quadro de Times / Turmas e Vagas por Modalidade
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Escolha a modalidade para visualizar os horários, polos de treinamento e vagas disponíveis em cada Time.
                  </p>
                </div>

                {/* Modality Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModality('todas')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedModality === 'todas'
                        ? 'bg-[#0284c7] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({teams.length} Times · {total} vagas)
                  </button>
                  {modalities.map((mod) => {
                    const modTeams = teams.filter((t) => t.modality === mod);
                    const modTotal = modTeams.reduce((s, t) => s + t.totalSpots, 0);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setSelectedModality(mod)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedModality === mod
                            ? 'bg-[#0284c7] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {mod} ({modTeams.length} Times · {modTotal} vagas)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cards of Times / Turmas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((team) => {
                  const tFilled = team.filledSpots ?? 0;
                  const tTotal = team.totalSpots;
                  const tAvail = team.availableSpots ?? Math.max(0, tTotal - tFilled);
                  const tPct = Math.min(100, Math.round((tFilled / Math.max(1, tTotal)) * 100));

                  return (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-300 transition-all p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-[#0284c7] text-[11px] font-extrabold uppercase">
                            {team.modality}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {team.gender} · {team.category}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900">
                          {team.name}
                        </h3>

                        <div className="space-y-1 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                            <span>{team.schedule}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                            <span>{team.polo}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-200/80">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">Vagas do Time</span>
                            <span
                              className={`font-mono tabular-nums ${
                                tAvail > 0 ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {tAvail} disponíveis
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0284c7] rounded-full"
                              style={{ width: `${tPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                            <span>{tFilled} preenchidas</span>
                            <span>Limite: {tTotal} vagas</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onEnrollDirect(liveProject, team.id)}
                          className="w-full py-2.5 px-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Inscrever neste Time</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {functioning ? (
            <>
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
                      {liveProject.targetAudience}
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
                      Locais de Treinamento (Polos):
                    </span>
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {liveProject.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50 border border-sky-200 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-slate-900">
                    Pronto para ingressar em um Time do {liveProject.name}?
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl">
                    As inscrições são 100% gratuitas e vinculadas diretamente ao Time e modalidade escolhidos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEnrollDirect(liveProject)}
                  className="px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  Escolher Time e Inscrever
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
                Professores, Treinadores e Equipe Multidisciplinar
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Profissionais habilitados dedicados às turmas de Voleibol e Futsal nos polos de Cariacica.
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
                      <span className="inline-block mt-1 text-[11px] font-mono font-bold text-slate-600">
                        {member.cref}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>

                {member.specialties && member.specialties.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Especialidades & Foco
                    </span>
                    <span>{member.specialties.join(' · ')}</span>
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
          <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-bold uppercase tracking-wider">
                <span>Vitrine Oficial de Olheiros & Scouts</span>
                <span className="text-slate-400">· {liveProject.name}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Cartinhas Técnicas dos Atletas em Destaque
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Clique em qualquer cartinha para abrir o dossiê técnico, assistir vídeos de lances e solicitar avaliação junto à coordenação da Vitalizar.
              </p>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 flex items-center gap-4 shrink-0">
              <div className="text-center">
                <span className="block text-2xl font-black text-amber-400 font-mono tabular-nums">
                  {participants.length}
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Atletas com Cartinha
                </span>
              </div>
            </div>
          </div>

          {/* Scout Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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

            <div className="flex items-center gap-2 overflow-x-auto">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="todas">Todas as Posições</option>
                <option value="goleiro">Goleiros / Líberos</option>
                <option value="defesa">Fixos / Defensores</option>
                <option value="meio">Levantadores / Alas</option>
                <option value="ataque">Ponteiras / Pivôs / Opostos</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="todas">Todas as Categorias</option>
                <option value="9 a 11">9 a 11 anos</option>
                <option value="12 a 13">12 a 13 anos</option>
                <option value="12 a 14">12 a 14 anos</option>
                <option value="14 a 15">14 a 15 anos</option>
              </select>
            </div>
          </div>

          {filteredParticipants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParticipants.map((participant) => (
                <PlayerCard
                  key={participant.id}
                  participant={participant}
                  shieldUrl={liveProject.shieldUrl}
                  projectName={liveProject.name}
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

