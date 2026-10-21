import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Shield,
  Award,
  Trophy,
  CheckCircle2,
  Send,
  Scale,
  FileCheck2,
  Search,
  X,
  Share2,
  ArrowRight,
  Download,
  Paperclip,
  FileText,
  Tag,
  Users,
  BarChart3,
  PieChart,
  Eye,
  LayoutGrid,
  List,
  Printer,
  HeartHandshake,
  TrendingUp,
  FolderOpen,
  FileSpreadsheet,
  ScrollText,
  ShieldCheck,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  GraduationCap,
  Star,
  Play,
  Video,
  Crosshair,
  Activity,
  UserCheck,
  Sparkles,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { FACILITY_POLOS, DEFAULT_SITE_SETTINGS } from '../data/clubeData.ts';
import { useClubData } from '../context/ClubDataContext.tsx';
import {
  NewsArticle,
  TransparencyDocument,
  VitalizarProject,
  ProjectParticipant,
  ProjectStaffMember,
  PlayerHighlightVideo,
} from '../types/index.ts';
import { EventsCalendar } from './EventsCalendar.tsx';
import { SponsorsSection } from './SponsorsSection.tsx';
import { ProjectDetailPage, type ProjectDetailTab } from './ProjectDetailPage.tsx';
import { PlayerScoutModal } from './PlayerScoutModal.tsx';
import { DirectEnrollmentModal } from './DirectEnrollmentModal.tsx';
import { ScoutContactModal } from './ScoutContactModal.tsx';
import { CommunityHubView, type CommunityHubTab } from './CommunityHubView.tsx';
import { NextFitParticipantsManager } from './NextFitParticipantsManager.tsx';

interface SubpageViewProps {
  pageId: string;
  subId?: string;
  onBack: () => void;
  onOpenInscricoes: () => void;
}

export const SubpageView: React.FC<SubpageViewProps> = ({
  pageId,
  subId,
  onBack,
  onOpenInscricoes,
}) => {
  const {
    clubInfo,
    siteSettings,
    newsArticles,
    projects,
    transparencyDocs,
    facilityPolos,
    addContactMessage,
    addRsvp,
    saveAdminChanges,
    showToast,
  } = useClubData();
  const polosList =
    Array.isArray(facilityPolos) && facilityPolos.length > 0 ? facilityPolos : FACILITY_POLOS;

  const [activeTab, setActiveTab] = useState<string>(subId || 'quem-somos');
  const [contactSubject, setContactSubject] = useState(
    subId === 'parcerias' ? 'Parcerias' : 'Dúvidas Gerais'
  );
  const [contactSent, setContactSent] = useState(false);

  // News subpage state
  const [newsFilterCategory, setNewsFilterCategory] = useState<string>('all');
  const [newsSearch, setNewsSearch] = useState('');
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsArticle | null>(null);

  // Transparency Portal state
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [docViewMode, setDocViewMode] = useState<'catalog' | 'table'>('catalog');
  const [docSortOrder, setDocSortOrder] = useState<'recent' | 'az' | 'category'>('recent');
  const [docYearFilter, setDocYearFilter] = useState<string>('all');
  const [copiedDocProtocol, setCopiedDocProtocol] = useState<string | null>(null);
  const [dashboardBreakdownTab, setDashboardBreakdownTab] = useState<'allocation' | 'sources' | 'governance'>('allocation');
  const [inspectedDoc, setInspectedDoc] = useState<TransparencyDocument | null>(null);
  const [socioModalOpen, setSocioModalOpen] = useState<boolean>(false);
  const [selectedSocioTier, setSelectedSocioTier] = useState<string>('Sócio Campeão da Comunidade');
  const [socioFormName, setSocioFormName] = useState<string>('');
  const [socioFormEmail, setSocioFormEmail] = useState<string>('');
  const [socioFormPhone, setSocioFormPhone] = useState<string>('');
  const [socioFormCpf, setSocioFormCpf] = useState<string>('');

  // Projects & Scouts State
  const [selectedProject, setSelectedProject] = useState<VitalizarProject | null>(null);
  const [projectTab, setProjectTab] = useState<ProjectDetailTab>('funcionamento');
  const [projectsViewMode, setProjectsViewMode] = useState<'catalogo' | 'participantes'>('catalogo');
  const [projectsParticipantFilter, setProjectsParticipantFilter] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<ProjectParticipant | null>(null);
  const [activePlayerVideo, setActivePlayerVideo] = useState<PlayerHighlightVideo | null>(null);
  const [scoutModalOpen, setScoutModalOpen] = useState<boolean>(false);
  const [scoutTargetPlayer, setScoutTargetPlayer] = useState<ProjectParticipant | null>(null);
  const [scoutFilterPosition, setScoutFilterPosition] = useState<string>('todas');
  const [scoutFilterCategory, setScoutFilterCategory] = useState<string>('todas');
  const [scoutSearchQuery, setScoutSearchQuery] = useState<string>('');
  const [directEnrollProject, setDirectEnrollProject] = useState<VitalizarProject | null>(null);

  // Direct Project Enrollment Form States
  const [enrollStudentName, setEnrollStudentName] = useState('');
  const [enrollStudentAge, setEnrollStudentAge] = useState(12);
  const [enrollResponsibleName, setEnrollResponsibleName] = useState('');
  const [enrollPhone, setEnrollPhone] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollTurn, setEnrollTurn] = useState<'matutino' | 'vespertino'>('matutino');
  const [enrollPolo, setEnrollPolo] = useState('Polo Central Rio Marinho');

  // Scout Contact Form States
  const [scoutName, setScoutName] = useState('');
  const [scoutClub, setScoutClub] = useState('');
  const [scoutRole, setScoutRole] = useState('Olheiro / Observador Técnico');
  const [scoutPhone, setScoutPhone] = useState('');
  const [scoutEmail, setScoutEmail] = useState('');
  const [scoutMessage, setScoutMessage] = useState('');

  // Sync subId changes when navigating across subpages
  useEffect(() => {
    const validInstitucionalTabs = [
      'quem-somos',
      'missao-valores',
      'diretoria-conselhos',
      'sede-polos',
      'estatuto-social',
    ];
    if (pageId === 'a-vitalizar') {
      if (subId && validInstitucionalTabs.includes(subId)) {
        setActiveTab(subId);
      } else {
        setActiveTab('quem-somos');
      }
    }
    if (pageId === 'contato') {
      if (subId === 'parcerias') {
        setContactSubject('Parcerias');
      } else if (subId === 'ouvidoria') {
        setContactSubject('Ouvidoria');
      }
    }
    if (pageId === 'noticias' && subId) {
      const found = newsArticles.find((a) => a.id === subId);
      if (found) {
        setSelectedNewsArticle(found);
      }
    }
    if (pageId === 'projetos') {
      if (subId === 'participantes') {
        setSelectedProject(null);
        setProjectsViewMode('participantes');
      } else if (subId) {
        const foundProj = projects.find((p) => p.id === subId);
        if (foundProj) {
          setSelectedProject(foundProj);
        }
      }
    } else {
      setSelectedProject(null);
    }
  }, [pageId, subId, newsArticles, projects]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    addContactMessage({
      name,
      email,
      phone,
      subject: contactSubject,
      message,
    });
    showToast('Mensagem enviada com sucesso!');
    setContactSent(true);
  };

  const renderVitalizarInstitucional = () => (
    <div className="space-y-8">
      {/* Clean Editorial Header */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90">
        <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
          Institucional · Rio Marinho, Cariacica/ES
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Associação Esportiva Vitalizar
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Entidade civil sem fins lucrativos dedicada ao desenvolvimento esportivo, promoção da saúde preventiva, cultura e inclusão comunitária em Cariacica/ES.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'quem-somos', label: 'Quem Somos' },
          { id: 'missao-valores', label: 'Missão e Valores' },
          { id: 'diretoria-conselhos', label: 'Diretoria e Governança' },
          { id: 'sede-polos', label: 'Polos de Atendimento' },
          { id: 'estatuto-social', label: 'Estatuto Social' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#0284c7] text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'quem-somos' && (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed bg-white p-6 sm:p-8 rounded-2xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Nossa Origem e Propósito</h2>
          <p>
            Sediada no bairro Rio Marinho, em Cariacica/ES, a{' '}
            <strong className="text-slate-900">Associação Esportiva Vitalizar</strong> atua como agente de transformação comunitária por meio do esporte educacional, lazer e saúde preventiva.
          </p>
          <p>
            Nossos programas atendem gratuitamente crianças, adolescentes, adultos, pessoas idosas e pessoas com deficiência, promovendo escolinhas de base, oficinas culturais e circuitos de qualidade de vida.
          </p>
        </div>
      )}

      {activeTab === 'missao-valores' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <Trophy className="w-5 h-5 text-[#0284c7]" />
            <h3 className="text-base font-bold text-slate-900">Missão</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fomentar a prática esportiva, a cultura, a promoção da saúde e o desenvolvimento humano, transformando a realidade de crianças, jovens e famílias em Cariacica.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <Award className="w-5 h-5 text-[#0284c7]" />
            <h3 className="text-base font-bold text-slate-900">Visão</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ser referência em gestão transparente e impacto comunitário na execução de projetos socioesportivos e de saúde preventiva no Espírito Santo.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <Shield className="w-5 h-5 text-[#0284c7]" />
            <h3 className="text-base font-bold text-slate-900">Valores</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Ética e transparência ativa</li>
              <li>Inclusão social e respeito à diversidade</li>
              <li>Valorização comunitária e trabalho em equipe</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'diretoria-conselhos' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Diretoria Executiva e Conselho Fiscal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-sm text-slate-900 block">
                Diretoria Executiva (Mandato 2026–2030)
              </span>
              <p>Presidente: <strong className="text-slate-900">{clubInfo.president}</strong></p>
              <p>Composição estatutária: Vice-Presidente, 1º e 2º Secretários e Tesoureiro.</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-sm text-slate-900 block">
                Conselho Fiscal & Assessoria
              </span>
              <p>Assessoria Jurídica: <strong className="text-slate-900">{clubInfo.legalCounsel}</strong></p>
              <p>Fiscalização contábil semestral e emissão de pareceres à Assembleia Geral.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sede-polos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {polosList.map((polo) => (
            <div
              key={polo.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between"
            >
              <img
                src={polo.imageUrl}
                alt={polo.name}
                referrerPolicy="no-referrer"
                className="h-44 w-full object-cover"
              />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded mb-1.5">
                    {polo.capacity}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{polo.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{polo.address}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{polo.description}</p>
                  {polo.includedItems && polo.includedItems.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
                      {polo.includedItems.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0284c7] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenInscricoes}
                  className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Inscrever-se neste Polo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {activeTab === 'estatuto-social' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6 text-xs text-slate-600 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Síntese do Estatuto Social Consolidado ({clubInfo.statuteDate})
            </h3>
            <p className="text-slate-500 mt-1">
              CNPJ {clubInfo.cnpj} · Sede: {clubInfo.address}, {clubInfo.municipality}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block">Finalidade Social</span>
              <p>
                Promoção gratuita do esporte educacional, iniciação esportiva, saúde preventiva, cultura e inclusão social em Cariacica/ES.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-900 block">Governança e Transparência</span>
              <p>
                Prestação de contas ativa de parcerias e recursos públicos em conformidade com o Marco Regulatório das Organizações da Sociedade Civil (Lei 13.019/2014).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProjetos = () => {
    const totalParticipantsCount = projects.reduce(
      (acc, p) => acc + (p.participants?.length || 0),
      0
    );

    if (selectedProject) {
      const currentLiveProject =
        projects.find((p) => p.id === selectedProject.id) || selectedProject;

      return (
        <div className="space-y-6">
          <ProjectDetailPage
            project={currentLiveProject}
            initialTab={projectTab}
            onBack={() => {
              setSelectedProject(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEnrollDirect={(p) => setDirectEnrollProject(p)}
            onInspectPlayer={(p) => setSelectedPlayer(p)}
            onOpenScoutContact={(p) => {
              setScoutTargetPlayer(p);
              setScoutModalOpen(true);
            }}
          />

          <PlayerScoutModal
            isOpen={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            player={selectedPlayer}
            shieldUrl={currentLiveProject?.shieldUrl}
            projectName={currentLiveProject?.name}
            onOpenScoutContact={(p) => {
              setScoutTargetPlayer(p);
              setScoutModalOpen(true);
            }}
          />

          <DirectEnrollmentModal
            isOpen={!!directEnrollProject}
            onClose={() => setDirectEnrollProject(null)}
            project={directEnrollProject}
          />

          <ScoutContactModal
            isOpen={scoutModalOpen}
            onClose={() => {
              setScoutModalOpen(false);
              setScoutTargetPlayer(null);
            }}
            player={scoutTargetPlayer}
            projectName={currentLiveProject?.name}
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Institutional Section Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-xs font-bold uppercase tracking-wider">
                  Esporte, Educação & Comunidade
                </span>
                <span className="text-xs text-slate-400">· Cariacica/ES</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Projetos, Equipes & Participantes Vinculados
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Atividades gratuitas para todas as idades com acompanhamento de professores registrados, gestão de participantes vinculados via planilha .CSV (Next Fit) por projeto específico e vitrine técnica de atletas.
              </p>

              {/* Quick Metrics */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Shield className="w-4 h-4 text-[#0284c7]" />
                  <span>{projects.length} Projetos Ativos</span>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{totalParticipantsCount} Participantes Vinculados</span>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5 font-bold text-[#0284c7]">
                  <FileSpreadsheet className="w-4 h-4 text-[#0284c7]" />
                  <span>
                    {projects.reduce((acc, p) => acc + (p.availableSpots ?? 15), 0)} Vagas Abertas
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const p = projects[0];
                  if (p) setDirectEnrollProject(p);
                  else onOpenInscricoes();
                }}
                className="px-5 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Quero Fazer Minha Inscrição</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation inside Projects View Structure: 1. Projetos & Equipes | 2. Participantes (CSV por Projeto) */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setProjectsViewMode('catalogo')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  projectsViewMode === 'catalogo'
                    ? 'bg-[#0a1e36] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Projetos & Estrutura ({projects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectsViewMode('participantes')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  projectsViewMode === 'participantes'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Participantes ({totalParticipantsCount})</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                    projectsViewMode === 'participantes'
                      ? 'bg-emerald-900/60 text-emerald-100'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  .CSV / Por Projeto
                </span>
              </button>
            </div>

            {projectsViewMode === 'catalogo' && (
              <p className="text-[11px] text-slate-500">
                Clique em <strong>"Participantes"</strong> em qualquer card abaixo para ver ou associar a lista .CSV específica daquele projeto.
              </p>
            )}
          </div>
        </div>

        {/* VIEW MODE 2: PARTICIPANTES VINCULADOS POR PROJETO ESPECÍFICO + IMPORTAÇÃO CSV */}
        {projectsViewMode === 'participantes' ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Project-Specific Selector Cards */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Vínculo por Projeto Específico
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Selecione um Projeto para Filtrar ou Associar Lista .CSV
                  </h2>
                </div>
                {projectsParticipantFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = projects.find((p) => p.id === projectsParticipantFilter);
                      if (found) {
                        setProjectTab('participantes');
                        setSelectedProject(found);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Abrir Página Completa deste Projeto</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setProjectsParticipantFilter('all')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    projectsParticipantFilter === 'all'
                      ? 'bg-[#0a1e36] text-white border-[#0a1e36] shadow-sm'
                      : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider block ${
                        projectsParticipantFilter === 'all' ? 'text-sky-300' : 'text-slate-400'
                      }`}
                    >
                      Visão Consolidada
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm block truncate mt-0.5">
                      Todos os Projetos
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 ${
                      projectsParticipantFilter === 'all'
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    {totalParticipantsCount}
                  </span>
                </button>

                {projects.map((proj) => {
                  const isSelected = projectsParticipantFilter === proj.id;
                  const pCount = (proj.participants || []).length;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setProjectsParticipantFilter(proj.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {proj.shieldUrl ? (
                          <img
                            src={proj.shieldUrl}
                            alt={proj.name}
                            className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
                              isSelected ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            {proj.category.replace(/_/g, ' ')}
                          </span>
                          <span className="font-extrabold text-xs block truncate">
                            {proj.name}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {pCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Integrated CSV Association & Project-Linked Participants Manager */}
            <NextFitParticipantsManager
              mode="projects_subtab"
              projects={projects}
              selectedProjectFilter={projectsParticipantFilter}
              onSelectProjectFilterChange={setProjectsParticipantFilter}
              onUpdateProjects={(updatedProjects, toastMsg) => {
                saveAdminChanges({
                  projects: updatedProjects,
                  toastMessage: toastMsg,
                  logDetails:
                    toastMsg ||
                    'Relação de participantes atualizada e vinculada aos projetos via .CSV.',
                });
              }}
              onNotify={showToast}
            />
          </div>
        ) : (
          /* VIEW MODE 1: PROJECTS CATALOG GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const avail = proj.availableSpots ?? 20;
              const tot = proj.totalSpots ?? 100;
              const participantCount = proj.participants?.length || 0;
              const fill = proj.filledSpots ?? participantCount ?? (tot - avail);
              const pct = Math.min(100, Math.round((fill / Math.max(1, tot)) * 100));
              const staffCount = proj.staff?.length || 0;

              return (
                <div
                  key={proj.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg hover:border-sky-300 transition-all group"
                >
                  {/* Image Banner with Floating Official Shield */}
                  <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                    <img
                      src={proj.imageUrl}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    {/* Floating Project Shield */}
                    {proj.shieldUrl && (
                      <div
                        className="absolute top-3 left-3 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-md p-1.5 shadow-xl border border-white/60 flex items-center justify-center transition-transform hover:scale-110"
                        title={`Escudo Oficial: ${proj.name}`}
                      >
                        <img
                          src={proj.shieldUrl}
                          alt="Escudo"
                          className="w-full h-full object-contain filter drop-shadow-sm"
                        />
                      </div>
                    )}

                    {/* Category Pill */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                      {proj.category.replace('_', ' ')}
                    </div>

                    {/* Bottom Image Info */}
                    <div className="absolute bottom-3 inset-x-3 text-white flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-200 text-[11px] truncate">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>{proj.location}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/90 text-white text-[10px] font-bold shrink-0">
                        Gratuito
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0284c7] transition-colors leading-tight">
                        {proj.name}
                      </h3>
                      {proj.motto && (
                        <p className="text-[11px] text-amber-600 font-semibold italic mt-0.5">
                          "{proj.motto}"
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    {/* Live Spots Bar */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#0284c7]" />
                          <span>Vagas Disponíveis:</span>
                        </span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-extrabold text-[10px]">
                          {avail} vagas abertas
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-[#0284c7] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{participantCount} participantes vinculados</span>
                        <span>Total: {tot} vagas</span>
                      </div>
                    </div>

                    {/* Team, Participants & Scouts Mini Indicators */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-100/80">
                        <span className="text-[10px] font-bold uppercase text-[#0284c7] block truncate">
                          Equipe
                        </span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {staffCount > 0 ? `${staffCount} Prof.` : 'Ativa'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProjectTab('participantes');
                          setSelectedProject(proj);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-left transition-colors cursor-pointer"
                        title="Ver e associar participantes (.CSV) deste projeto"
                      >
                        <span className="text-[10px] font-bold uppercase text-emerald-800 block truncate">
                          Participantes
                        </span>
                        <span className="font-extrabold text-emerald-950 truncate block mt-0.5">
                          {participantCount} alunos →
                        </span>
                      </button>

                      <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100/80">
                        <span className="text-[10px] font-bold uppercase text-amber-700 block truncate">
                          Olheiros
                        </span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {participantCount > 0 ? `${participantCount} Fichas` : 'Ativo'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Schedule & Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                        <span className="truncate">{proj.schedule}</span>
                      </div>

                      {proj.attachments && proj.attachments.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {proj.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.dataUrl}
                              download={att.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-2.5 py-1 bg-sky-50/80 hover:bg-sky-100 text-[#0284c7] rounded-lg border border-sky-200 text-[10px] font-semibold flex items-center justify-between gap-2 transition-colors"
                            >
                              <span className="truncate flex items-center gap-1">
                                <Paperclip className="w-3 h-3 shrink-0" />
                                {att.name}
                              </span>
                              <Download className="w-3 h-3 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProjectTab('funcionamento');
                            setSelectedProject(proj);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="py-2.5 px-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                        >
                          <span>Detalhes</span>
                          <ChevronRight className="w-3 h-3 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProjectTab('participantes');
                            setSelectedProject(proj);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-700 text-emerald-800 hover:text-white border border-emerald-200 font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Abrir visualização de Participantes deste projeto"
                        >
                          <Users className="w-3 h-3 shrink-0" />
                          <span>Participantes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDirectEnrollProject(proj)}
                          className="py-2.5 px-2 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-800 font-bold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <FileCheck2 className="w-3 h-3 shrink-0" />
                          <span>Inscrição</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Modals for Direct Catalog Actions */}
        {(() => {
          const playerProj = selectedPlayer
            ? projects.find((pr) => pr.participants?.some((pt) => pt.id === selectedPlayer.id))
            : null;

          return (
            <>
              <PlayerScoutModal
                isOpen={!!selectedPlayer}
                onClose={() => setSelectedPlayer(null)}
                player={selectedPlayer}
                shieldUrl={playerProj?.shieldUrl}
                projectName={playerProj?.name}
                onOpenScoutContact={(p) => {
                  setScoutTargetPlayer(p);
                  setScoutModalOpen(true);
                }}
              />

              <DirectEnrollmentModal
                isOpen={!!directEnrollProject}
                onClose={() => setDirectEnrollProject(null)}
                project={directEnrollProject}
              />

              <ScoutContactModal
                isOpen={scoutModalOpen}
                onClose={() => {
                  setScoutModalOpen(false);
                  setScoutTargetPlayer(null);
                }}
                player={scoutTargetPlayer}
                projectName={playerProj?.name}
              />
            </>
          );
        })()}
      </div>
    );
  };

  const getCategoryLabel = (cat: TransparencyDocument['category']) => {
    const map: Record<TransparencyDocument['category'], string> = {
      estatuto: 'Estatuto Social',
      cnpj: 'Cadastro RFB / CNPJ',
      governanca: 'Governança & Atas',
      emendas: 'MROSC & Emendas',
      fomento: 'Termos de Fomento',
      prestacao_contas: 'Relatórios & Balancetes',
      certidoes: 'Certidões de Regularidade',
    };
    return map[cat] || 'Documento Oficial';
  };

  const getDocumentVisualMeta = (docItem: TransparencyDocument) => {
    const cat = docItem.category;
    const typeUpper = (docItem.fileType || '').toUpperCase();

    if (cat === 'prestacao_contas' || typeUpper.includes('PLANILHA') || typeUpper.includes('BALANCETE')) {
      return {
        icon: BarChart3,
        formatIcon: FileSpreadsheet,
        accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        groupLabel: 'Relatório Financeiro & Contábil',
        formatPill: 'bg-emerald-100 text-emerald-800',
        cardBorder: 'hover:border-emerald-300',
        actionBg: 'hover:bg-emerald-50 hover:text-emerald-800',
      };
    }
    if (cat === 'fomento' || cat === 'emendas' || typeUpper.includes('MROSC')) {
      return {
        icon: ScrollText,
        formatIcon: FileText,
        accentBg: 'bg-sky-50 text-[#0284c7] border-sky-200/90',
        badgeBg: 'bg-sky-50 text-[#0284c7] border-sky-200',
        dotColor: 'bg-[#0284c7]',
        groupLabel: 'Parceria MROSC & Fomento',
        formatPill: 'bg-sky-100 text-sky-800',
        cardBorder: 'hover:border-sky-300',
        actionBg: 'hover:bg-sky-50 hover:text-[#0369a1]',
      };
    }
    if (cat === 'certidoes' || cat === 'cnpj') {
      return {
        icon: ShieldCheck,
        formatIcon: FileCheck2,
        accentBg: 'bg-teal-50 text-teal-700 border-teal-200/90',
        badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
        dotColor: 'bg-teal-500',
        groupLabel: 'Certidão & Regularidade Fiscal',
        formatPill: 'bg-teal-100 text-teal-800',
        cardBorder: 'hover:border-teal-300',
        actionBg: 'hover:bg-teal-50 hover:text-teal-800',
      };
    }
    if (cat === 'estatuto' || cat === 'governanca') {
      return {
        icon: Scale,
        formatIcon: FileText,
        accentBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
        groupLabel: 'Estatuto & Governança',
        formatPill: 'bg-indigo-100 text-indigo-800',
        cardBorder: 'hover:border-indigo-300',
        actionBg: 'hover:bg-indigo-50 hover:text-indigo-800',
      };
    }

    return {
      icon: FileText,
      formatIcon: FileText,
      accentBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      dotColor: 'bg-slate-500',
      groupLabel: 'Documento Oficial',
      formatPill: 'bg-slate-100 text-slate-800',
      cardBorder: 'hover:border-slate-300',
      actionBg: 'hover:bg-slate-100 hover:text-slate-900',
    };
  };

  const handleCopyProtocol = (protocol: string) => {
    if (!protocol) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(protocol).then(() => {
        setCopiedDocProtocol(protocol);
        showToast(`Protocolo copiado para a área de transferência: ${protocol}`);
        setTimeout(() => {
          setCopiedDocProtocol((prev) => (prev === protocol ? null : prev));
        }, 2500);
      }).catch(() => {
        showToast(`Protocolo: ${protocol}`);
      });
    } else {
      showToast(`Protocolo: ${protocol}`);
    }
  };

  const handleDownloadDocument = (docItem: TransparencyDocument) => {
    const directHref = docItem.fileDataUrl || docItem.downloadUrl;
    if (directHref) {
      const link = document.createElement('a');
      link.href = directHref;
      link.download =
        docItem.fileName ||
        `${docItem.id || 'documento-vitalizar'}.${(docItem.fileType || 'pdf')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'pdf'}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Download iniciado: ${docItem.title}`);
      return;
    }

    // Generate official structured institutional report document when no binary is attached
    const lines = [
      '================================================================================',
      'ASSOCIAÇÃO ESPORTIVA VITALIZAR',
      `CNPJ: ${clubInfo.cnpj} | Sede: ${clubInfo.address}, ${clubInfo.municipality}`,
      'PORTAL DA TRANSPARÊNCIA ATIVA · LEI FEDERAL Nº 13.019/2014 (MROSC)',
      '================================================================================',
      '',
      `TÍTULO DO DOCUMENTO: ${docItem.title}`,
      `PROTOCOLO / REGISTRO: ${docItem.protocolNumber || `VTL-${docItem.id.toUpperCase()}`}`,
      `CATEGORIA: ${getCategoryLabel(docItem.category)}`,
      `DATA DE EMISSÃO / ATUALIZAÇÃO: ${docItem.date}`,
      `PERÍODO DE REFERÊNCIA: ${docItem.period || 'Exercício 2026'}`,
      `ÓRGÃO / SETOR RESPONSÁVEL: ${docItem.responsible || 'Diretoria Executiva & Conselho Fiscal'}`,
      `STATUS DE CONFORMIDADE: ${docItem.badge}`,
      docItem.financialValue ? `INDICADOR / VALOR VINCULADO: ${docItem.financialValue}` : '',
      '',
      '--------------------------------------------------------------------------------',
      '1. SÍNTESE EXECUTIVA E FINALIDADE',
      '--------------------------------------------------------------------------------',
      docItem.description,
      '',
      ...(docItem.summaryPoints && docItem.summaryPoints.length > 0
        ? [
            '--------------------------------------------------------------------------------',
            '2. DESTAQUES TÉCNICOS E DEMONSTRATIVOS VERIFICADOS',
            '--------------------------------------------------------------------------------',
            ...docItem.summaryPoints.map((pt, idx) => `  ${idx + 1}. ${pt}`),
            '',
          ]
        : []),
      '--------------------------------------------------------------------------------',
      '3. AUTENTICAÇÃO INSTITUCIONAL',
      '--------------------------------------------------------------------------------',
      `Presidente Executivo: ${clubInfo.president}`,
      `Assessoria Jurídica: ${clubInfo.legalCounsel}`,
      `Documento exportado eletronicamente em ${new Date().toLocaleString('pt-BR')}.`,
      '================================================================================',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docItem.id}-relatorio-oficial-vitalizar.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Relatório exportado: ${docItem.title}`);
  };

  const handleExportTransparencyCsv = () => {
    const dash = siteSettings.transparencyDashboard || DEFAULT_SITE_SETTINGS.transparencyDashboard!;
    const rows = [
      ['Tipo de Registro', 'Identificador / Protocolo', 'Título / Indicador', 'Categoria', 'Data / Período', 'Valor / Métrica', 'Status'],
      ['INDICADOR', 'SOCIO-TOTAL', 'Sócio-Torcedores Ativos', 'Quadro Associativo', dash.fiscalYear, `${dash.socioTorcedoresTotal} sócios (Meta: ${dash.socioTorcedoresGoal})`, 'Ativo'],
      ['INDICADOR', 'SOCIO-MES', 'Novos Sócio-Torcedores no Mês', 'Quadro Associativo', dash.fiscalYear, `+${dash.socioTorcedoresNewMonth} adesões`, 'Verificado'],
      ['INDICADOR', 'FIN-RECEITA', 'Receita Total Captada no Exercício', 'Financeiro', dash.fiscalYear, `R$ ${dash.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, dash.auditStatus],
      ['INDICADOR', 'FIN-INVESTIDO', 'Investimento Direto em Projetos Sociais', 'Financeiro', dash.fiscalYear, `R$ ${dash.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Auditado'],
      ['INDICADOR', 'IMPACTO-DIRETO', 'Beneficiários Atendidos Gratuitamente', 'Impacto Social', dash.fiscalYear, `${dash.directBeneficiaries} pessoas`, 'Confirmado'],
      ...transparencyDocs.map((d) => [
        'DOCUMENTO',
        d.protocolNumber || d.id,
        d.title.replace(/;/g, ','),
        getCategoryLabel(d.category),
        d.period || d.date,
        d.financialValue || d.fileSize || d.fileType,
        d.badge,
      ]),
    ];

    const csvContent =
      '\uFEFF' + rows.map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `painel-transparencia-vitalizar-${dash.fiscalYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Planilha consolidada de transparência exportada (CSV)!');
  };

  const handleSocioAdhesionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContactMessage({
      name: socioFormName,
      email: socioFormEmail,
      phone: socioFormPhone,
      subject: 'Adesão Sócio-Torcedor',
      message: `Solicitação de adesão ao Programa Sócio-Torcedor Vitalizar na modalidade [${selectedSocioTier}]. CPF informado: ${socioFormCpf || 'Não informado'}.`,
    });
    showToast(`Solicitação de adesão ao plano ${selectedSocioTier} registrada com sucesso!`);
    setSocioModalOpen(false);
    setSocioFormName('');
    setSocioFormEmail('');
    setSocioFormPhone('');
    setSocioFormCpf('');
  };

  const renderTransparencia = () => {
    const defaultDash = DEFAULT_SITE_SETTINGS.transparencyDashboard!;
    const rawDash = siteSettings?.transparencyDashboard || defaultDash;
    const dash = {
      ...defaultDash,
      ...rawDash,
      socioTorcedoresTiers:
        Array.isArray(rawDash.socioTorcedoresTiers) && rawDash.socioTorcedoresTiers.length > 0
          ? rawDash.socioTorcedoresTiers
          : defaultDash.socioTorcedoresTiers,
      socioTorcedoresMonthlyGrowth:
        Array.isArray(rawDash.socioTorcedoresMonthlyGrowth) &&
        rawDash.socioTorcedoresMonthlyGrowth.length > 0
          ? rawDash.socioTorcedoresMonthlyGrowth
          : defaultDash.socioTorcedoresMonthlyGrowth,
      allocationBreakdown:
        Array.isArray(rawDash.allocationBreakdown) && rawDash.allocationBreakdown.length > 0
          ? rawDash.allocationBreakdown
          : defaultDash.allocationBreakdown,
      revenueSources:
        Array.isArray(rawDash.revenueSources) && rawDash.revenueSources.length > 0
          ? rawDash.revenueSources
          : defaultDash.revenueSources,
    };
    const socioGoalPercent = Math.min(
      100,
      Math.round((dash.socioTorcedoresTotal / Math.max(1, dash.socioTorcedoresGoal)) * 100)
    );
    const directExecutionPercent =
      dash.totalRevenue > 0
        ? ((dash.totalInvested / dash.totalRevenue) * 100).toFixed(1).replace('.', ',')
        : '94,2';

    const maxGrowthCount = Math.max(
      ...dash.socioTorcedoresMonthlyGrowth.map((m) => Number(m?.count) || 0),
      100
    );

    const filterGroups = [
      { id: 'all', label: 'Todos os Arquivos', count: transparencyDocs.length, icon: LayoutGrid },
      {
        id: 'relatorios',
        label: 'Relatórios & Balancetes',
        count: transparencyDocs.filter((d) => d.category === 'prestacao_contas').length,
        icon: BarChart3,
      },
      {
        id: 'mrosc',
        label: 'Fomento & MROSC',
        count: transparencyDocs.filter((d) => d.category === 'fomento' || d.category === 'emendas').length,
        icon: ScrollText,
      },
      {
        id: 'certidoes',
        label: 'Certidões & CNPJ',
        count: transparencyDocs.filter((d) => d.category === 'certidoes' || d.category === 'cnpj').length,
        icon: ShieldCheck,
      },
      {
        id: 'institucional',
        label: 'Estatuto & Atas',
        count: transparencyDocs.filter((d) => d.category === 'estatuto' || d.category === 'governanca').length,
        icon: Scale,
      },
    ];

    const availableYears = Array.from(
      new Set(
        transparencyDocs
          .map((d) => {
            const match = (d.period || d.date || '').match(/202\d/);
            return match ? match[0] : null;
          })
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => b.localeCompare(a));

    const filteredDocs = transparencyDocs.filter((docItem) => {
      const matchesGroup =
        docCategoryFilter === 'all' ||
        (docCategoryFilter === 'relatorios' && docItem.category === 'prestacao_contas') ||
        (docCategoryFilter === 'mrosc' &&
          (docItem.category === 'fomento' || docItem.category === 'emendas')) ||
        (docCategoryFilter === 'certidoes' &&
          (docItem.category === 'certidoes' || docItem.category === 'cnpj')) ||
        (docCategoryFilter === 'institucional' &&
          (docItem.category === 'estatuto' || docItem.category === 'governanca'));

      const matchesYear =
        docYearFilter === 'all' ||
        (docItem.period && docItem.period.includes(docYearFilter)) ||
        (docItem.date && docItem.date.includes(docYearFilter));

      const q = docSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (docItem.title || '').toLowerCase().includes(q) ||
        (docItem.description || '').toLowerCase().includes(q) ||
        (docItem.protocolNumber && docItem.protocolNumber.toLowerCase().includes(q)) ||
        (docItem.period && docItem.period.toLowerCase().includes(q)) ||
        (docItem.badge && docItem.badge.toLowerCase().includes(q));

      return matchesGroup && matchesYear && matchesQuery;
    });

    const sortedDocs = [...filteredDocs].sort((a, b) => {
      if (docSortOrder === 'az') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (docSortOrder === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });

    return (
      <div className="space-y-8">
        {/* 1. Institutional Header & Operational Compliance Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-[#0284c7]">Transparência Ativa & Governança</span>
                <span aria-hidden="true">·</span>
                <span>Lei Federal nº 13.019/2014 (MROSC)</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">CNPJ {clubInfo.cnpj}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
                Portal da Transparência, Relatórios e Quadro Associativo
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Acompanhamento público em tempo real da execução financeira, relatórios de impacto socioesportivo, certidões de regularidade e evolução de Sócio-Torcedores da Associação Esportiva Vitalizar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleExportTransparencyCsv}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4 text-[#0284c7]" />
                <span>Exportar Dados (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSocioTier(
                    dash.socioTorcedoresTiers[1]?.name || 'Sócio Campeão da Comunidade'
                  );
                  setSocioModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Aderir ao Sócio-Torcedor</span>
              </button>
            </div>
          </div>

          {/* Operational Utility Strip */}
          <div className="bg-slate-900 text-slate-200 px-6 sm:px-8 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Exercício Fiscal: <strong className="text-white font-mono tabular-nums">{dash.fiscalYear}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Última Conferência Contábil:{' '}
                <strong className="text-white font-mono tabular-nums">{dash.lastAuditDate}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Status Fiscal: <strong className="text-sky-300">{dash.auditStatus}</strong>
              </span>
            </div>
            <div className="text-slate-400 font-mono tabular-nums">
              {transparencyDocs.length} arquivos e relatórios homologados
            </div>
          </div>
        </div>

        {/* 2. Executive KPI Strip (4-Column Full-Width Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Sócio-Torcedores Ativos</span>
              <Users className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {dash.socioTorcedoresTotal.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                +{dash.socioTorcedoresNewMonth} novas adesões no mês · Meta {dash.socioTorcedoresGoal}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Receita Captada ({dash.fiscalYear})</span>
              <TrendingUp className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                R$ {dash.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Fomento MROSC, Sócio-Torcedor e Parceiros
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Investido em Projetos</span>
              <BarChart3 className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                R$ {dash.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1 font-mono tabular-nums">
                {directExecutionPercent}% aplicado direto na atividade-fim
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Beneficiários Diretos</span>
              <Award className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {dash.directBeneficiaries.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Atendimento 100% gratuito em Cariacica/ES
              </div>
            </div>
          </div>
        </div>

        {/* 3. Contagem de Sócio-Torcedores & Dashboard Financeiro (2-Column Balanced Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (5 cols): Contagem Oficial de Sócio-Torcedores & Evolução */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold text-[#0284c7]">
                    Comunidade & Sustentabilidade
                  </p>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    Contagem de Sócio-Torcedores
                  </h2>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xs text-slate-500 block">Retenção Mensal</span>
                  <span className="text-sm font-bold text-slate-900">
                    {dash.socioTorcedoresRetentionRate}
                  </span>
                </div>
              </div>

              {/* Counter Highlight Box */}
              <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs text-sky-300 block">Total de Contribuintes Ativos</span>
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight">
                      {dash.socioTorcedoresTotal}
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-mono tabular-nums">
                      / {dash.socioTorcedoresGoal} meta anual
                    </span>
                  </div>
                  <span className="text-sm font-bold text-sky-400 font-mono tabular-nums">
                    {socioGoalPercent}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#38bdf8] rounded-full transition-all duration-300"
                    style={{ width: `${socioGoalPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums pt-0.5">
                  <span>+{dash.socioTorcedoresNewMonth} novos neste mês</span>
                  <span>Faltam {Math.max(0, dash.socioTorcedoresGoal - dash.socioTorcedoresTotal)} para a meta</span>
                </div>
              </div>

              {/* Breakdown by Socio Tier */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-700">
                  Distribuição por Categoria Associativa
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {dash.socioTorcedoresTiers.map((tier) => {
                    const tierPct = Math.round(
                      (tier.count / Math.max(1, dash.socioTorcedoresTotal)) * 100
                    );
                    return (
                      <div
                        key={tier.id}
                        className="p-3.5 bg-white hover:bg-slate-50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                          <span className="text-xs font-bold text-[#0284c7] font-mono tabular-nums">
                            {tier.count} sócios ({tierPct}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {tier.benefitSummary}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-semibold text-slate-700 font-mono tabular-nums">
                            Contribuição: {tier.monthlyContribution}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSocioTier(tier.name);
                              setSocioModalOpen(true);
                            }}
                            className="text-[11px] font-semibold text-[#0284c7] hover:text-[#0369a1] cursor-pointer whitespace-nowrap"
                          >
                            Aderir a este plano →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 6-Month Evolution Mini Bar Chart */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Evolução Semestral do Quadro Social</span>
                <span className="text-slate-500 font-mono tabular-nums">Últimos 6 meses</span>
              </div>
              <div className="grid grid-cols-6 gap-2 items-end h-24 pt-2">
                {dash.socioTorcedoresMonthlyGrowth.map((item) => {
                  const barHeightPct = Math.max(
                    18,
                    Math.round((item.count / maxGrowthCount) * 100)
                  );
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-700 font-mono tabular-nums">
                        {item.count}
                      </span>
                      <div className="w-full bg-slate-100 rounded-t-md flex items-end h-14 overflow-hidden">
                        <div
                          className="w-full bg-[#0284c7] rounded-t-md transition-all duration-300"
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Dashboard de Execução Financeira & Prestação de Contas */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold text-[#0284c7]">
                    Painel Analítico de Recursos
                  </p>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    Dashboard de Execução Orçamentária ({dash.fiscalYear})
                  </h2>
                </div>

                {/* Segmented Control */}
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                  <button
                    type="button"
                    onClick={() => setDashboardBreakdownTab('allocation')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      dashboardBreakdownTab === 'allocation'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Destinação por Área
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardBreakdownTab('sources')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      dashboardBreakdownTab === 'sources'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Fontes de Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardBreakdownTab('governance')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      dashboardBreakdownTab === 'governance'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Conselho Fiscal
                  </button>
                </div>
              </div>

              {dashboardBreakdownTab === 'allocation' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Demonstrativo da aplicação direta dos recursos financeiros por eixo de atuação estatutária em Cariacica/ES:
                  </p>

                  <div className="space-y-4">
                    {dash.allocationBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.label}</span>
                          <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                            <span className="font-bold text-slate-900">
                              R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-bold text-[#0284c7]">{item.percentage}%</span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0284c7] rounded-full transition-all duration-300"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardBreakdownTab === 'sources' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Composição das fontes de custeio auditadas em contas bancárias específicas da Associação Esportiva Vitalizar:
                  </p>

                  <div className="space-y-3.5">
                    {dash.revenueSources.map((src) => (
                      <div
                        key={src.label}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{src.label}</span>
                          <span className="text-xs font-bold text-[#0284c7] font-mono tabular-nums">
                            R$ {src.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({src.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full"
                            style={{ width: `${src.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200/80 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block">
                      Rastreabilidade Bancária Integral (Art. 30 do Estatuto)
                    </span>
                    <p>
                      Toda movimentação de termos de fomento e emendas parlamentares ocorre exclusivamente via transferência eletrônica identificada (PIX/TED), sendo vedado o saque em espécie.
                    </p>
                  </div>
                </div>
              )}

              {dashboardBreakdownTab === 'governance' && (
                <div className="space-y-4 text-xs text-slate-600">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] text-slate-500 block">Presidência Executiva</span>
                      <span className="font-bold text-sm text-slate-900 block">
                        {clubInfo.president}
                      </span>
                      <p>Responsável legal pela assinatura de termos de fomento e ordenação de despesas.</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[11px] text-slate-500 block">Assessoria Jurídica & Estatutária</span>
                      <span className="font-bold text-sm text-slate-900 block">
                        {clubInfo.legalCounsel}
                      </span>
                      <p>Supervisão de conformidade com a Lei Federal nº 13.019/2014 e averbações cartorárias.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">
                      Diretrizes de Controle Social e Auditoria Independente
                    </span>
                    <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li>Exame semestral dos livros contábeis, extratos bancários e notas fiscais pelo Conselho Fiscal.</li>
                      <li>Publicação aberta de relatórios de execução física e financeira sem necessidade de requerimento prévio.</li>
                      <li>Atendimento 100% gratuito e universal nas escolinhas e oficinas comunitárias em Cariacica/ES.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Summary Footer inside Dashboard Card */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="font-mono tabular-nums">
                Saldo de Reserva Operacional Auditado:{' '}
                <strong className="text-slate-900">
                  R$ {Math.max(0, dash.totalRevenue - dash.totalInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  const balancete = transparencyDocs.find((d) =>
                    d.id.includes('balancete') || d.category === 'prestacao_contas'
                  );
                  if (balancete) setInspectedDoc(balancete);
                }}
                className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] cursor-pointer self-start sm:self-auto"
              >
                Abrir Demonstrativo Contábil Detalhado →
              </button>
            </div>
          </div>
        </div>

        {/* 4. Central de Arquivos, Certidões e Relatórios (Explorer em Grade com Ícones) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0284c7]">
                <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
                <span>Transparência Ativa & Repositório Digital</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                Central de Relatórios, Prestação de Contas e Arquivos Oficiais
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Navegue pelos documentos organizados em grade com ícones temáticos, visualize a síntese executiva simplificada ou faça o download direto dos arquivos homologados.
              </p>
            </div>

            {/* View Mode Toggle (Grade com Ícones vs Tabela) */}
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
              <span className="text-xs text-slate-500 hidden sm:inline">Visualização:</span>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setDocViewMode('catalog')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    docViewMode === 'catalog'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Exibir em grade de cartões com ícones"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Grade com Ícones</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    docViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Exibir em tabela compacta"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Lista Resumida</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4.1 Clean Category Navigation Strip with Icons & Badge Counters */}
          <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
            <div className="inline-flex items-center gap-2 min-w-full sm:min-w-0">
              {filterGroups.map((grp) => {
                const IconComp = grp.icon;
                const isActive = docCategoryFilter === grp.id;
                return (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setDocCategoryFilter(grp.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      isActive
                        ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#0284c7]'}`} />
                    <span>{grp.label}</span>
                    <span
                      className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {grp.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4.2 Interactive Search & Filter Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Buscar por protocolo, título, ano ou palavra-chave..."
                className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              {docSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDocSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Selects & Tools */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Year / Period Filter */}
              {availableYears.length > 0 && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 text-[11px]">Ano:</span>
                  <select
                    value={docYearFilter}
                    onChange={(e) => setDocYearFilter(e.target.value)}
                    className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">Todos</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Order Selector */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 text-[11px]">Ordem:</span>
                <select
                  value={docSortOrder}
                  onChange={(e) => setDocSortOrder(e.target.value as 'recent' | 'az' | 'category')}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="az">Título (A-Z)</option>
                  <option value="category">Por Categoria</option>
                </select>
              </div>

              {/* Results Counter Pill */}
              <div className="text-[11px] font-mono tabular-nums text-slate-500 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hidden sm:block">
                {sortedDocs.length} de {transparencyDocs.length} arquivos
              </div>

              {/* Reset filter shortcut if active */}
              {(docCategoryFilter !== 'all' || docSearchQuery || docYearFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setDocCategoryFilter('all');
                    setDocSearchQuery('');
                    setDocYearFilter('all');
                  }}
                  className="text-[11px] text-[#0284c7] hover:text-[#0369a1] font-semibold underline underline-offset-2 cursor-pointer ml-1"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* 4.3 Content Display: Grid vs Table */}
          {sortedDocs.length === 0 ? (
            /* Empty State */
            <div className="py-14 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3 px-4">
              <FolderOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Nenhum arquivo ou relatório encontrado para estes critérios
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tente alterar as palavras da busca, mudar a categoria documental ou selecionar outro ano de exercício fiscal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocCategoryFilter('all');
                  setDocSearchQuery('');
                  setDocYearFilter('all');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Exibir Todos os {transparencyDocs.length} Documentos
              </button>
            </div>
          ) : docViewMode === 'catalog' ? (
            /* ==================================================================== */
            /* Modern Grid Layout with Themed Category Icons (3-Col Responsive Grid) */
            /* ==================================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedDocs.map((docItem) => {
                const meta = getDocumentVisualMeta(docItem);
                const CategoryIcon = meta.icon;
                const isCopied = copiedDocProtocol === docItem.protocolNumber;

                return (
                  <div
                    key={docItem.id}
                    className={`bg-white rounded-2xl border border-slate-200/90 ${meta.cardBorder} hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 group`}
                  >
                    <div className="space-y-3.5">
                      {/* Card Header: Category Icon + Protocol Tag + Official Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${meta.accentBg}`}
                          title={meta.groupLabel}
                        >
                          <CategoryIcon className="w-5 h-5" />
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {/* Protocol Monospace Tag with Quick Copy */}
                          {docItem.protocolNumber ? (
                            <button
                              type="button"
                              onClick={() => handleCopyProtocol(docItem.protocolNumber!)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200/70 transition-colors cursor-pointer"
                              title="Clique para copiar protocolo oficial"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{docItem.protocolNumber}</span>
                            </button>
                          ) : (
                            <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                              VTL-{docItem.id.toUpperCase().slice(0, 8)}
                            </span>
                          )}

                          {/* Official Status Badge with Color Dot */}
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeBg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                            <span>{docItem.badge}</span>
                          </span>
                        </div>
                      </div>

                      {/* Category Label Subtitle */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                          {getCategoryLabel(docItem.category)}
                        </span>

                        {/* Title (Clickable) */}
                        <h3
                          onClick={() => setInspectedDoc(docItem)}
                          className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors leading-snug line-clamp-2 mt-1 cursor-pointer"
                          title={docItem.title}
                        >
                          {docItem.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1.5">
                          {docItem.description}
                        </p>
                      </div>

                      {/* Highlight Metric Pill / Snippet */}
                      {docItem.financialValue ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-mono tabular-nums">
                          <BarChart3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{docItem.financialValue}</span>
                        </div>
                      ) : docItem.summaryPoints && docItem.summaryPoints.length > 0 ? (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/70 flex items-start gap-1.5 line-clamp-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0284c7] shrink-0 mt-0.5" />
                          <span className="truncate">{docItem.summaryPoints[0]}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Card Footer: File Format, Size & Action Buttons */}
                    <div className="pt-3.5 border-t border-slate-100 mt-4 space-y-3">
                      {/* Specs Row */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${meta.formatPill}`}>
                            {docItem.fileType || 'PDF'}
                          </span>
                          <span>{docItem.fileSize || '1.2 MB'}</span>
                        </div>
                        <span>{docItem.period || docItem.date}</span>
                      </div>

                      {/* Action Buttons: Visualizar (Simplificada) & Baixar */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setInspectedDoc(docItem)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 bg-slate-50 ${meta.actionBg} text-slate-800`}
                          title="Visualização simplificada do relatório com pontos auditados"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0284c7]" />
                          <span>Visualizar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(docItem)}
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs"
                          title="Baixar arquivo original homologado"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ==================================================================== */
            /* Technical / Summary Table View */
            /* ==================================================================== */
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                    <th className="py-3 px-4">Doc & Ícone</th>
                    <th className="py-3 px-4">Protocolo</th>
                    <th className="py-3 px-4">Título & Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Período / Vigência</th>
                    <th className="py-3 px-4 text-center">Formato</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {sortedDocs.map((docItem) => {
                    const meta = getDocumentVisualMeta(docItem);
                    const CategoryIcon = meta.icon;
                    return (
                      <tr key={docItem.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center ${meta.accentBg}`}
                            title={meta.groupLabel}
                          >
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-700 whitespace-nowrap">
                          {docItem.protocolNumber || `VTL-${docItem.id.toUpperCase().slice(0, 8)}`}
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <button
                            type="button"
                            onClick={() => setInspectedDoc(docItem)}
                            className="font-bold text-slate-900 hover:text-[#0284c7] text-left cursor-pointer transition-colors line-clamp-1 block"
                          >
                            {docItem.title}
                          </button>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {docItem.description}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {getCategoryLabel(docItem.category)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {docItem.period || docItem.date}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${meta.formatPill}`}>
                            {docItem.fileType || 'PDF'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectedDoc(docItem)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Visualizar síntese"
                            >
                              <Eye className="w-3 h-3 text-[#0284c7]" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(docItem)}
                              className="px-2.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Baixar arquivo"
                            >
                              <Download className="w-3 h-3" />
                              <span>Baixar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 5. Visualização Simplificada de Documentos (Modal Reader Otimizado) */}
        {/* ==================================================================== */}
        {inspectedDoc && (() => {
          const docMeta = getDocumentVisualMeta(inspectedDoc);
          const DocCategoryIcon = docMeta.icon;
          const isCopied = copiedDocProtocol === inspectedDoc.protocolNumber;

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
                {/* Modal Top Header with Icon, Category, Protocol & Close */}
                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${docMeta.accentBg}`}>
                      <DocCategoryIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-700">
                          {getCategoryLabel(inspectedDoc.category)}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold border ${docMeta.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${docMeta.dotColor}`} />
                          {inspectedDoc.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          {inspectedDoc.protocolNumber || `VTL-${inspectedDoc.id.toUpperCase()}`}
                        </span>
                        {inspectedDoc.protocolNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopyProtocol(inspectedDoc.protocolNumber!)}
                            className="text-[10px] text-[#0284c7] hover:text-[#0369a1] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Copiar protocolo oficial"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectedDoc(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                    aria-label="Fechar visualizador"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 sm:p-7 space-y-6">
                  {/* Document Title & Description */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <div className="text-[11px] font-semibold text-[#0284c7] uppercase tracking-wider">
                      Associação Esportiva Vitalizar · CNPJ {clubInfo.cnpj}
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                      {inspectedDoc.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {inspectedDoc.description}
                    </p>
                  </div>

                  {/* 4-Card Simplified Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block">Data de Emissão</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums text-xs sm:text-sm mt-0.5 block">
                        {inspectedDoc.date}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block">Exercício / Período</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums text-xs sm:text-sm mt-0.5 block">
                        {inspectedDoc.period || 'Exercício 2026'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block">Órgão Responsável</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block truncate" title={inspectedDoc.responsible || 'Diretoria & Conselho Fiscal'}>
                        {inspectedDoc.responsible || 'Diretoria & Conselho Fiscal'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block">Formato / Indicador</span>
                      <span className="font-bold text-[#0284c7] font-mono tabular-nums text-xs sm:text-sm mt-0.5 block truncate">
                        {inspectedDoc.financialValue || `${inspectedDoc.fileType || 'PDF'} (${inspectedDoc.fileSize || '1.2 MB'})`}
                      </span>
                    </div>
                  </div>

                  {/* Síntese Executiva & Pontos Auditados (Executive Summary List) */}
                  {inspectedDoc.summaryPoints && inspectedDoc.summaryPoints.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0284c7]" />
                          <span>Síntese Executiva e Pontos Auditados no Documento</span>
                        </h3>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500">
                          {inspectedDoc.summaryPoints.length} pontos verificados
                        </span>
                      </div>

                      <div className="space-y-2">
                        {inspectedDoc.summaryPoints.map((point, index) => (
                          <div
                            key={index}
                            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700 leading-relaxed"
                          >
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0284c7] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              0{index + 1}
                            </span>
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Document Container: Image Preview or Official Folha de Documento */}
                  {inspectedDoc.fileDataUrl && inspectedDoc.fileDataUrl.startsWith('data:image/') ? (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        Visualização Direta do Arquivo Original:
                      </span>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 p-3 flex justify-center">
                        <img
                          src={inspectedDoc.fileDataUrl}
                          alt={inspectedDoc.title}
                          className="max-h-96 object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Official Document Sheet Preview (Simplified Institutional View) */
                    <div className="p-5 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 space-y-3 font-sans">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-900 uppercase block tracking-wider">
                            Repositório Oficial Digital · Vitalizar
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Protocolo: {inspectedDoc.protocolNumber || `VTL-${inspectedDoc.id.toUpperCase()}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block font-semibold">
                            Homologação Válida
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                        <p>
                          Documento arquivado no banco oficial de transparência da Associação Esportiva Vitalizar sob regência da Lei Federal nº 13.019/2014 (Marco Regulatório das Organizações da Sociedade Civil - MROSC) e Artigo 30 do Estatuto Social consolidado.
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Assinatura Eletrônica Verificada · Responsáveis: {inspectedDoc.responsible || 'Diretoria Executiva & Conselho Fiscal'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Institutional Legal Sign-off */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Autenticidade e Controle Social (Art. 30 do Estatuto)
                      </span>
                      <span>
                        Presidência: {clubInfo.president} · Assessoria Jurídica: {clubInfo.legalCounsel}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500 shrink-0">
                      Lei Federal nº 13.019/2014
                    </span>
                  </div>
                </div>

                {/* Modal Action Bar (Sticky Bottom) */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Imprimir visualização deste relatório"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>

                    {inspectedDoc.protocolNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyProtocol(inspectedDoc.protocolNumber!)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Copiar número do protocolo oficial"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{isCopied ? 'Copiado!' : 'Copiar Protocolo'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setInspectedDoc(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                    >
                      Fechar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(inspectedDoc)}
                      className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        Baixar {inspectedDoc.fileName ? inspectedDoc.fileName : 'Arquivo Completo'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 6. Modal de Adesão ao Programa Sócio-Torcedor */}
        {socioModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-semibold text-[#0284c7]">
                    Programa Sócio-Torcedor Vitalizar
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    Cadastro de Novo Sócio-Torcedor
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSocioModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSocioAdhesionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Categoria de Sócio-Torcedor Escolhida *
                  </label>
                  <select
                    value={selectedSocioTier}
                    onChange={(e) => setSelectedSocioTier(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {dash.socioTorcedoresTiers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.monthlyContribution})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={socioFormName}
                    onChange={(e) => setSocioFormName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={socioFormPhone}
                      onChange={(e) => setSocioFormPhone(e.target.value)}
                      placeholder="(27) 99999-9999"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      CPF (opcional)
                    </label>
                    <input
                      type="text"
                      value={socioFormCpf}
                      onChange={(e) => setSocioFormCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={socioFormEmail}
                    onChange={(e) => setSocioFormEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200/80 text-[11px] text-slate-600 leading-relaxed">
                  Sua adesão fortalece diretamente as escolinhas gratuitas e projetos de saúde preventiva em Cariacica/ES. A secretaria enviará a carteirinha digital e os dados de contribuição oficial.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSocioModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold rounded-lg cursor-pointer"
                  >
                    Confirmar Adesão Sócio-Torcedor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContato = () => (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90">
        <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
          Atendimento & Ouvidoria
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Fale com a Vitalizar
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Tire dúvidas sobre inscrições, apresente propostas de parceria ou fale diretamente com a coordenação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
          {contactSent ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#0284c7] mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Mensagem Enviada!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Recebemos sua solicitação e responderemos pelo e-mail <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setContactSent(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Enviar Nova Mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assunto *
                </label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {(siteSettings.contactSubjects && siteSettings.contactSubjects.length > 0
                    ? siteSettings.contactSubjects
                    : [
                        'Dúvidas Gerais',
                        'Inscrição em Projetos',
                        'Voluntariado',
                        'Parcerias',
                        'Ouvidoria',
                      ]
                  ).map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(27) 99999-9999"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensagem *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Como podemos ajudar?"
                  className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Mensagem</span>
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Canais de Atendimento</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0284c7]" />
                <span className="font-medium text-slate-900">{clubInfo.phones.join(' · ')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0284c7]" />
                <span>{clubInfo.email}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>{clubInfo.hours.secretaria}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <span>
                  {clubInfo.address} · CEP {clubInfo.cep} · {clubInfo.municipality}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show Sponsors & Partnership showcase in Contact/Parcerias */}
      <div className="pt-4">
        <SponsorsSection />
      </div>
    </div>
  );

  const renderNoticias = () => {
    const dynamicCategories =
      siteSettings.newsCategories && siteSettings.newsCategories.length > 0
        ? siteSettings.newsCategories
        : ['Institucional', 'Esporte Educacional', 'Saúde & Qualidade de Vida', 'Transparência'];

    const categories = [
      { id: 'all', label: 'Todas' },
      ...dynamicCategories.map((cat) => ({ id: cat, label: cat })),
    ];

    const filteredArticles = newsArticles.filter((art) => {
      const matchCat =
        newsFilterCategory === 'all' ||
        art.category.toLowerCase().includes(newsFilterCategory.toLowerCase());
      const matchSearch =
        !newsSearch.trim() ||
        art.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
        art.summary.toLowerCase().includes(newsSearch.toLowerCase());
      return matchCat && matchSearch;
    });

    return (
      <div className="space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90">
          <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
            Comunicação Oficial
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Notícias e Comunicados
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Acompanhe as ações comunitárias, eventos realizados e novidades da Associação Esportiva Vitalizar.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start">
            {categories.map((cat) => {
              const isSelected = newsFilterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setNewsFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
              placeholder="Buscar notícia..."
              className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
            {newsSearch && (
              <button
                type="button"
                onClick={() => setNewsSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => setSelectedNewsArticle(article)}
              className="group text-left bg-white rounded-xl overflow-hidden border border-slate-200/90 hover:border-slate-300 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 w-full">
                <div>
                  <div className="text-xs text-slate-500">
                    <span>{article.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{article.date}</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors leading-snug line-clamp-2 mt-1.5">
                    {article.title}
                  </h2>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0284c7] w-full">
                  <span>Ler matéria</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Article Reader Modal */}
        {selectedNewsArticle && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  <span>{selectedNewsArticle.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{selectedNewsArticle.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Link copiado!');
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Compartilhar notícia"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedNewsArticle(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Fechar notícia"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative aspect-16/9 bg-slate-100">
                <img
                  src={selectedNewsArticle.imageUrl}
                  alt={selectedNewsArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {selectedNewsArticle.title}
                </h1>

                <p className="text-sm font-medium text-slate-600 pb-4 border-b border-slate-200">
                  {selectedNewsArticle.summary}
                </p>

                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  {selectedNewsArticle.content && selectedNewsArticle.content.length > 0 ? (
                    selectedNewsArticle.content.map((p, idx) => <p key={idx}>{p}</p>)
                  ) : (
                    <p>{selectedNewsArticle.summary}</p>
                  )}
                </div>

                {selectedNewsArticle.attachments && selectedNewsArticle.attachments.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#0284c7]" />
                      <span>Arquivos Anexados ({selectedNewsArticle.attachments.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedNewsArticle.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.dataUrl}
                          download={att.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-[#0284c7] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-[#0284c7] truncate block">
                                {att.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {att.type} · {att.size}
                              </span>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-[#0284c7] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer bg-white px-3.5 py-2 rounded-lg border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 text-[#0284c7]" />
            <span>Voltar ao Início</span>
          </button>
        </div>

        {pageId === 'a-vitalizar' && renderVitalizarInstitucional()}
        {pageId === 'projetos' && renderProjetos()}
        {pageId === 'portal-comunidade' && (
          <CommunityHubView
            mode="full_page"
            initialTab={
              subId === 'resultados' ||
              subId === 'apoie-pix' ||
              subId === 'voluntariado'
                ? (subId as CommunityHubTab)
                : 'resultados'
            }
          />
        )}
        {pageId === 'transparencia' && renderTransparencia()}
        {pageId === 'contato' && renderContato()}
        {pageId === 'atividades' && renderProjetos()}
        {pageId === 'noticias' && renderNoticias()}
        {pageId === 'patrocinadores' && (
          <div className="space-y-8">
            <SponsorsSection
              title="Rede de Patrocinadores & Parceiros Institucionais"
              subtitle="Conheça as empresas, órgãos públicos e instituições que viabilizam o esporte gratuito e o impacto social da Associação Esportiva Vitalizar em Cariacica/ES."
            />
          </div>
        )}
        {pageId === 'eventos' && (
          <EventsCalendar
            onOpenInscricoes={onOpenInscricoes}
            initialCategory={
              subId === 'clinica_esportiva' ||
              subId === 'oficina_comunitaria' ||
              subId === 'reuniao_associacao'
                ? subId
                : 'all'
            }
          />
        )}
        {pageId !== 'a-vitalizar' &&
          pageId !== 'projetos' &&
          pageId !== 'portal-comunidade' &&
          pageId !== 'transparencia' &&
          pageId !== 'contato' &&
          pageId !== 'atividades' &&
          pageId !== 'noticias' &&
          pageId !== 'patrocinadores' &&
          pageId !== 'eventos' &&
          renderVitalizarInstitucional()}
      </div>
    </div>
  );
};

