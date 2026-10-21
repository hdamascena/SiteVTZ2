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
} from 'lucide-react';
import { VitalizarProject, ProjectParticipant } from '../types/index.ts';
import { PlayerCard } from './PlayerCard.tsx';
import { useClubData } from '../context/ClubDataContext.tsx';

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
  const { projects } = useClubData();

  const liveProject = useMemo(
    () => projects.find((p) => p.id === project.id) || project,
    [projects, project]
  );

  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(initialTab);
  const [filterPosition, setFilterPosition] = useState<string>('todas');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [partSearchQuery, setPartSearchQuery] = useState<string>('');
  const [partCategoryFilter, setPartCategoryFilter] = useState<string>('all');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, project.id]);

  const participants = liveProject.participants || [];
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
      if (
        partCategoryFilter !== 'all' &&
        !(p.category || '').toLowerCase().includes(partCategoryFilter.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.nickname || '').toLowerCase().includes(q) ||
        (p.modalityOrClass || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q)
      );
    });
  }, [participants, partSearchQuery, partCategoryFilter]);

  const available = liveProject.availableSpots ?? 20;
  const total = liveProject.totalSpots ?? 100;
  const filled = liveProject.filledSpots ?? participants.length ?? total - available;
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

        <div className="text-xs font-semibold text-[#0284c7] uppercase tracking-wider">
          {liveProject.category.replace('_', ' ')}
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
                <span>{participants.length} participantes</span>
                <span>Total: {total} vagas</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEnrollDirect(liveProject)}
              className="w-full py-3 px-4 bg-[#0284c7] hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
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
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  Turma e Atletas — {liveProject.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Relação de atletas e participantes integrados às turmas do projeto{' '}
                  <strong className="text-slate-900">{liveProject.name}</strong>. Dados escolares, saúde e contatos das famílias são protegidos e restritos à coordenação pedagógica.
                </p>
              </div>
            </div>

            {/* Public Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                  placeholder="Buscar participante por nome, apelido ou posição..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={partCategoryFilter}
                onChange={(e) => setPartCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="all">Todas as Categorias ({participants.length})</option>
                <option value="Sub-11">Sub-11</option>
                <option value="Sub-13">Sub-13</option>
                <option value="Sub-15">Sub-15</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Sub-20">Sub-20</option>
                <option value="Vida Ativa">Vida Ativa 60+</option>
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
                {filteredProjectParticipants.map((p) => (
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
                            Camisa #{p.jerseyNumber} · {p.category}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {p.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {p.position} · {p.preferredFoot}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <span className="text-[11px] text-slate-500 truncate">
                        {p.modalityOrClass || liveProject.name}
                      </span>
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
                ))}
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
                    <span className="text-xs font-bold text-emerald-700">
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
                    Pronto para ingressar no {project.name}?
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xl">
                    As inscrições são gratuitas e acompanhadas pela equipe pedagógica da Vitalizar.
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
                <span className="text-slate-400">· {project.name}</span>
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
                <option value="goleiro">Goleiros</option>
                <option value="defesa">Defensores / Zagueiros</option>
                <option value="meio">Meio-Campistas / Volantes</option>
                <option value="ataque">Atacantes / Extremos</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                <option value="todas">Todas as Categorias</option>
                <option value="sub-13">Sub-13</option>
                <option value="sub-15">Sub-15</option>
                <option value="sub-17">Sub-17</option>
              </select>
            </div>
          </div>

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
