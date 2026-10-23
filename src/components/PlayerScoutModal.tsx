import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Award,
  Video,
  Play,
  Printer,
  Crosshair,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Copy,
  Check,
  Maximize2,
  FileText,
  Edit3,
  Camera,
  Save,
  MapPin,
  Users,
  Activity,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  ProjectParticipant,
  PlayerHighlightVideo,
  getParticipantModalityProfile,
  derivePositionGroup,
  normalizeParticipantPositionForModality,
  computeTransparencyDashboard,
  syncProjectSpotsAndTeams,
} from '../types/index.ts';
import { PlayerCard } from './PlayerCard.tsx';
import { useClubData } from '../context/ClubDataContext.tsx';
import { processImageUpload } from '../utils/fileUpload.ts';
import { DEFAULT_SITE_SETTINGS } from '../data/clubeData.ts';

interface PlayerScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: ProjectParticipant | null;
  shieldUrl?: string;
  projectName?: string;
  onOpenScoutContact: (player: ProjectParticipant) => void;
  initialEditMode?: boolean;
}

export const PlayerScoutModal: React.FC<PlayerScoutModalProps> = ({
  isOpen,
  onClose,
  player,
  shieldUrl,
  projectName = 'Projeto Vitalizar',
  onOpenScoutContact,
  initialEditMode = false,
}) => {
  const { projects, siteSettings, updateParticipantProfile, showToast } = useClubData();

  const [activeTab, setActiveTab] = useState<'scout' | 'videos' | 'fotos' | 'bio' | 'editar'>(
    initialEditMode ? 'editar' : 'scout'
  );
  const [selectedVideo, setSelectedVideo] = useState<PlayerHighlightVideo | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Locate live project and live participant from Firebase-synced context
  const liveProject = useMemo(() => {
    if (!player) return projects[0] ? syncProjectSpotsAndTeams(projects[0]) : null;
    const found =
      projects.find((pr) => pr.participants?.some((pt) => pt.id === player.id)) ||
      projects.find((pr) => pr.name === projectName) ||
      projects[0];
    return found ? syncProjectSpotsAndTeams(found) : null;
  }, [projects, player, projectName]);

  const livePlayer = useMemo(() => {
    if (!player) return null;
    const found = liveProject?.participants?.find((pt) => pt.id === player.id);
    return found || player;
  }, [liveProject, player]);

  // Edit form draft state
  const [draft, setDraft] = useState<ProjectParticipant | null>(null);
  const [strengthsText, setStrengthsText] = useState<string>('');
  const [devAreasText, setDevAreasText] = useState<string>('');
  const [highlightsText, setHighlightsText] = useState<string>('');

  useEffect(() => {
    if (isOpen && livePlayer) {
      setDraft({
        ...livePlayer,
        stats: { ...livePlayer.stats },
        schoolInfo: { ...livePlayer.schoolInfo },
        scoutReport: {
          ...livePlayer.scoutReport,
          strengths: [...(livePlayer.scoutReport?.strengths || [])],
          developmentAreas: [...(livePlayer.scoutReport?.developmentAreas || [])],
        },
        highlights: [...(livePlayer.highlights || [])],
        photos: [...(livePlayer.photos || [])],
        videos: [...(livePlayer.videos || [])],
      });
      setStrengthsText((livePlayer.scoutReport?.strengths || []).join(', '));
      setDevAreasText((livePlayer.scoutReport?.developmentAreas || []).join(', '));
      setHighlightsText((livePlayer.highlights || []).join('\n'));
      setActiveTab(initialEditMode ? 'editar' : 'scout');
    }
  }, [isOpen, livePlayer?.id, initialEditMode]);

  const transparencyKpis = useMemo(
    () =>
      computeTransparencyDashboard(
        siteSettings.transparencyDashboard || DEFAULT_SITE_SETTINGS.transparencyDashboard!,
        projects,
        siteSettings.donationPledges || []
      ),
    [siteSettings, projects]
  );

  if (!isOpen || !livePlayer || !draft) return null;

  const displayedPlayer = activeTab === 'editar' ? draft : livePlayer;
  const teams = liveProject?.teams || [];
  const linkedTeam =
    teams.find((t) => t.id === displayedPlayer.teamId) ||
    teams.find(
      (t) =>
        displayedPlayer.modalityOrClass &&
        displayedPlayer.modalityOrClass.toLowerCase().includes(t.name.toLowerCase())
    );

  const modalityProfile = getParticipantModalityProfile(
    linkedTeam?.modality || displayedPlayer.modality,
    displayedPlayer.modalityOrClass
  );

  const currentVideo =
    selectedVideo ||
    (displayedPlayer.videos && displayedPlayer.videos.length > 0
      ? displayedPlayer.videos[0]
      : null);

  const handleCopyProfileLink = () => {
    const url = window.location.href.split('#')[0] + `#atleta-${livePlayer.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await processImageUpload(file, 720, 0.82);
      const nextDraft: ProjectParticipant = {
        ...draft,
        photoUrl: dataUrl,
      };
      setDraft(nextDraft);
      if (activeTab !== 'editar' && liveProject) {
        await updateParticipantProfile(liveProject.id, nextDraft);
      } else {
        showToast('Foto carregada! Clique em "Salvar Perfil" para publicar.', 'info');
      }
    } catch {
      showToast('Não foi possível processar a imagem selecionada.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await processImageUpload(file, 960, 0.82);
      const nextPhotos = [...(draft.photos || []), dataUrl];
      const nextDraft: ProjectParticipant = {
        ...draft,
        photos: nextPhotos,
      };
      setDraft(nextDraft);
      if (activeTab !== 'editar' && liveProject) {
        await updateParticipantProfile(liveProject.id, nextDraft);
      }
    } catch {
      showToast('Não foi possível adicionar a foto.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTeamChange = (newTeamId: string) => {
    const selectedTeam = teams.find((t) => t.id === newTeamId);
    const nextModality = selectedTeam?.modality || draft.modality || 'Voleibol';
    const nextModalityOrClass = selectedTeam
      ? `${selectedTeam.name} (${selectedTeam.modality} · ${selectedTeam.polo})`
      : draft.modalityOrClass;
    const nextPosition = normalizeParticipantPositionForModality(
      draft.position,
      nextModality,
      nextModalityOrClass
    );
    const nextGroup = derivePositionGroup(nextPosition, nextModality, nextModalityOrClass);

    setDraft({
      ...draft,
      teamId: newTeamId || undefined,
      modality: nextModality,
      modalityOrClass: nextModalityOrClass,
      category: selectedTeam?.category || draft.category,
      position: nextPosition,
      positionGroup: nextGroup,
    });
  };

  const handleStatChange = (key: keyof ProjectParticipant['stats'], val: number) => {
    const clamped = Math.min(99, Math.max(40, Math.round(Number(val) || 70)));
    const nextStats = {
      ...draft.stats,
      [key]: clamped,
    };
    if (key !== 'overall') {
      const avg = Math.round(
        (nextStats.pace +
          nextStats.shooting +
          nextStats.passing +
          nextStats.dribbling +
          nextStats.defending +
          nextStats.physical) /
          6
      );
      nextStats.overall = avg;
    }
    setDraft({
      ...draft,
      stats: nextStats,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveProject || !draft.name.trim()) return;
    setIsSavingProfile(true);
    try {
      const parsedStrengths = strengthsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedDevAreas = devAreasText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedHighlights = highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const finalPosition = normalizeParticipantPositionForModality(
        draft.position,
        draft.modality,
        draft.modalityOrClass
      );
      const finalGroup = derivePositionGroup(
        finalPosition,
        draft.modality,
        draft.modalityOrClass
      );

      const payload: ProjectParticipant = {
        ...draft,
        name: draft.name.trim(),
        nickname: (draft.nickname || '').trim() || draft.name.trim().split(' ')[0],
        position: finalPosition,
        positionGroup: finalGroup,
        highlights:
          parsedHighlights.length > 0
            ? parsedHighlights
            : [`Participante ativo na modalidade ${modalityProfile.modalityName}`],
        scoutReport: {
          ...draft.scoutReport,
          strengths:
            parsedStrengths.length > 0 ? parsedStrengths : ['Assiduidade', 'Fundamentos técnicos'],
          developmentAreas:
            parsedDevAreas.length > 0 ? parsedDevAreas : ['Aperfeiçoamento contínuo'],
        },
      };

      const saved = await updateParticipantProfile(liveProject.id, payload);
      if (saved) {
        setDraft(saved);
        setActiveTab('scout');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const teamFilled = linkedTeam?.filledSpots ?? liveProject?.filledSpots ?? 0;
  const teamTotal = linkedTeam?.totalSpots ?? liveProject?.totalSpots ?? 30;
  const teamAvailable = Math.max(0, teamTotal - teamFilled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-white flex flex-col">
        {/* Top Header + Live Firebase Transparency & Modality KPIs (CSS Selector 1 target) */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {(liveProject?.shieldUrl || shieldUrl) && (
                <img
                  src={liveProject?.shieldUrl || shieldUrl}
                  alt="Escudo do Projeto"
                  className="w-9 h-9 object-contain shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/80">
                    Modalidade: {modalityProfile.modalityName}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                    {linkedTeam ? linkedTeam.name : displayedPlayer.modalityOrClass || liveProject?.name}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{displayedPlayer.name}</span>
                  {displayedPlayer.nickname && (
                    <span className="text-amber-400 font-semibold text-base">
                      "{displayedPlayer.nickname}"
                    </span>
                  )}
                  <span className="text-slate-400 font-medium text-xs sm:text-sm">
                    (Camisa #{displayedPlayer.jerseyNumber} · {displayedPlayer.position} · {displayedPlayer.category})
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'editar' ? 'scout' : 'editar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'editar'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{activeTab === 'editar' ? 'Voltar ao Dossiê' : 'Editar Perfil & Foto'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar Dossiê"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Real-Time Firebase Transparency & Modality KPIs Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/90 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Modalidade & Posição
                </span>
                <span className="font-extrabold text-sky-300 truncate block">
                  {modalityProfile.modalityName} · {displayedPlayer.position}
                </span>
              </div>
              <Activity className="w-4 h-4 text-sky-400 shrink-0" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Vagas na Turma (Tempo Real)
                </span>
                <span className="font-extrabold text-emerald-300 font-mono tabular-nums truncate block">
                  {teamFilled}/{teamTotal} ({teamAvailable} livres)
                </span>
              </div>
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Frequência & Status
                </span>
                <span className="font-extrabold text-white font-mono tabular-nums truncate block">
                  {displayedPlayer.schoolInfo?.attendanceRate || '100%'} ·{' '}
                  {(displayedPlayer.enrollmentStatus || 'ativo').toUpperCase()}
                </span>
              </div>
              <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Transparência Projeto ({transparencyKpis.fiscalYear})
                </span>
                <span className="font-extrabold text-amber-300 font-mono tabular-nums truncate block">
                  {transparencyKpis.activeParticipantsCount}/{transparencyKpis.directBeneficiaries} alunos ativos
                </span>
              </div>
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Modal Body (CSS Selector 2 target) */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Player Trading Card, Photo Upload & Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="max-w-[340px] mx-auto w-full">
              <PlayerCard
                participant={displayedPlayer}
                shieldUrl={liveProject?.shieldUrl || shieldUrl}
                projectName={liveProject?.name || projectName}
                onInspect={() => setActiveTab('editar')}
                onOpenScout={onOpenScoutContact}
              />
            </div>

            {/* Direct Profile & Photo Controls */}
            <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Gestão do Perfil & Avaliação ({modalityProfile.modalityName})
              </span>

              <div className="grid grid-cols-2 gap-2">
                <label className="py-2.5 px-3 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Enviando...' : 'Atualizar Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setActiveTab('editar')}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar Dados</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenScoutContact(displayedPlayer)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Crosshair className="w-4 h-4 text-slate-950" />
                <span>Solicitar Avaliação Técnica / Contato</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrintDossier}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Imprimir Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyProfileLink}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Content, Modality-Specific Info & Profile Editor */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('scout')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'scout'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Indicadores ({modalityProfile.modalityName})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bio')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'bio'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Turma & Modalidade</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fotos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'fotos'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>
                  {modalityProfile.photosTabLabel} ({displayedPlayer.photos?.length || 1})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'videos'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>
                  {modalityProfile.videosTabLabel} ({displayedPlayer.videos?.length || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('editar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'editar'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Perfil</span>
              </button>
            </div>

            {/* TAB 1: Modality-Specific Technical Report & Performance KPIs */}
            {activeTab === 'scout' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Scout Rating Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-sky-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      Avaliação Oficial · Modalidade {modalityProfile.modalityName}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {displayedPlayer.scoutReport.scoutRating}
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs text-center shrink-0">
                    OVR {displayedPlayer.stats.overall} · Nível {displayedPlayer.cardTier.toUpperCase()}
                  </div>
                </div>

                {/* Modality-Specific 6 Technical KPIs Breakdown */}
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>
                        Indicadores Técnicos de {modalityProfile.modalityName} ({displayedPlayer.position})
                      </span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {modalityProfile.dominanceLabel}: {displayedPlayer.preferredFoot}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        ['pace', modalityProfile.statLabels.pace, displayedPlayer.stats.pace],
                        ['shooting', modalityProfile.statLabels.shooting, displayedPlayer.stats.shooting],
                        ['passing', modalityProfile.statLabels.passing, displayedPlayer.stats.passing],
                        ['dribbling', modalityProfile.statLabels.dribbling, displayedPlayer.stats.dribbling],
                        ['defending', modalityProfile.statLabels.defending, displayedPlayer.stats.defending],
                        ['physical', modalityProfile.statLabels.physical, displayedPlayer.stats.physical],
                      ] as const
                    ).map(([key, labelObj, val]) => (
                      <div
                        key={key}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            <strong className="text-sky-400 font-mono mr-1.5">{labelObj.short}</strong>
                            {labelObj.full}
                          </span>
                          <span className="font-extrabold font-mono text-white">{val}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(10, val))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scout Executive Summary */}
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Parecer da Comissão Técnica ({modalityProfile.modalityName})</span>
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {displayedPlayer.scoutReport.summary}
                  </p>
                </div>

                {/* Strengths & Development Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pontos Fortes ({modalityProfile.modalityName})</span>
                    </h5>
                    <ul className="space-y-2">
                      {displayedPlayer.scoutReport.strengths.map((str, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-emerald-200 flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Áreas em Lapidação</span>
                    </h5>
                    <ul className="space-y-2">
                      {displayedPlayer.scoutReport.developmentAreas.map((dev, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-amber-200/90 flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{dev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Season Highlights */}
                {displayedPlayer.highlights && displayedPlayer.highlights.length > 0 && (
                  <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Conquistas & Registros na Modalidade</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {displayedPlayer.highlights.map((hl, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Highlight Videos */}
            {activeTab === 'videos' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {currentVideo ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4 group">
                      <img
                        src={currentVideo.thumbnailUrl}
                        alt={currentVideo.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                          <Play className="w-3 h-3 fill-white" />
                          <span>{currentVideo.categoryTag || modalityProfile.modalityName}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/70 text-slate-300 text-xs font-mono">
                          {currentVideo.duration}
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center justify-center my-auto">
                        <button
                          type="button"
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Play className="w-8 h-8 fill-white ml-1" />
                        </button>
                      </div>

                      <div className="relative z-10 space-y-1">
                        <h4 className="text-base font-bold text-white drop-shadow">
                          {currentVideo.title}
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {currentVideo.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Clipes Disponíveis ({modalityProfile.modalityName})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {displayedPlayer.videos.map((vid) => (
                          <div
                            key={vid.id}
                            onClick={() => {
                              setSelectedVideo(vid);
                              setIsPlayingVideo(false);
                            }}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                              currentVideo?.id === vid.id
                                ? 'bg-sky-950/60 border-sky-500 text-white'
                                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                              <img
                                src={vid.thumbnailUrl}
                                alt={vid.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="overflow-hidden flex-1">
                              <h5 className="text-xs font-bold truncate">{vid.title}</h5>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{vid.duration}</span>
                                {vid.categoryTag && <span>· {vid.categoryTag}</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400">
                    <Video className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm">
                      Nenhum vídeo cadastrado no momento para este participante de {modalityProfile.modalityName}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Photos Gallery */}
            {activeTab === 'fotos' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Registros de Treinamentos e Jogos ({modalityProfile.modalityName})
                  </span>
                  <label className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Foto em Quadra</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleGalleryPhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(displayedPlayer.photos && displayedPlayer.photos.length > 0
                    ? displayedPlayer.photos
                    : [displayedPlayer.photoUrl]
                  ).map((photo, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative group aspect-4/3"
                    >
                      <img
                        src={photo}
                        alt={`${displayedPlayer.name} registro ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                        <span className="text-xs font-medium text-slate-200">
                          {modalityProfile.modalityName} #{idx + 1} · {displayedPlayer.nickname || displayedPlayer.name}
                        </span>
                        {displayedPlayer.photos && displayedPlayer.photos.length > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              const nextPhotos = displayedPlayer.photos.filter((_, i) => i !== idx);
                              const nextDraft = { ...draft, photos: nextPhotos };
                              setDraft(nextDraft);
                              if (liveProject) {
                                await updateParticipantProfile(liveProject.id, nextDraft);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Modality & Enrolled Team Details */}
            {activeTab === 'bio' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Enrolled Team & Modality Card */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>Vínculo Oficial de Turma e Modalidade (Tempo Real)</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-bold">
                      {modalityProfile.modalityName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Time / Turma Inscrita
                      </span>
                      <span className="text-white font-bold mt-0.5 block">
                        {linkedTeam ? linkedTeam.name : displayedPlayer.modalityOrClass || liveProject?.name}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Dias e Horários de Treino
                      </span>
                      <span className="text-white font-semibold mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{linkedTeam?.schedule || liveProject?.schedule || 'Conforme turma'}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Polo de Treinamento
                      </span>
                      <span className="text-white font-semibold mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{linkedTeam?.polo || liveProject?.location || 'Rio Marinho · Cariacica/ES'}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Ocupação Real da Turma
                      </span>
                      <span className="text-emerald-300 font-extrabold mt-0.5 block font-mono">
                        {teamFilled} matriculados / {teamTotal} vagas ({teamAvailable} abertas)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modality-Specific Technical Sheet */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Ficha Esportiva na Modalidade ({modalityProfile.modalityName})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Modalidade
                      </span>
                      <span className="text-sky-300 font-extrabold mt-0.5 block">
                        {modalityProfile.modalityName}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Posição ({modalityProfile.modalityName})
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {displayedPlayer.position}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {modalityProfile.dominanceLabel}
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {displayedPlayer.preferredFoot}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Categoria / Naipe
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {displayedPlayer.category} {linkedTeam?.gender ? `· ${linkedTeam.gender}` : ''}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Camisa Oficial
                      </span>
                      <span className="text-white font-semibold mt-0.5 block font-mono">
                        #{displayedPlayer.jerseyNumber}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Frequência Escolar
                      </span>
                      <span className="text-emerald-400 font-extrabold mt-0.5 block font-mono">
                        {displayedPlayer.schoolInfo?.attendanceRate || '100%'} ({displayedPlayer.schoolInfo?.turn || 'Matutino'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Full Profile, Photo & Modality Editor */}
            {activeTab === 'editar' && (
              <form
                onSubmit={handleSaveProfile}
                className="space-y-5 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 animate-in fade-in duration-150 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      Editar Perfil, Foto e Dados da Modalidade ({modalityProfile.modalityName})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      As opções de posição e atributos se adaptam automaticamente à modalidade do Time selecionado.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}</span>
                  </button>
                </div>

                {/* 1. Foto de Perfil */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={draft.photoUrl}
                      alt={draft.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <span className="font-bold text-white block">Foto Oficial do Participante</span>
                      <span className="text-[11px] text-slate-400">
                        Envie uma foto do seu dispositivo ou informe a URL abaixo.
                      </span>
                    </div>
                  </div>
                  <label className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploadingPhoto ? 'Processando...' : 'Escolher Nova Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                </div>

                {/* 2. Identificação e Turma/Modalidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Apelido Esportivo</label>
                    <input
                      type="text"
                      value={draft.nickname || ''}
                      onChange={(e) => setDraft({ ...draft, nickname: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Seletor de Time / Turma (vincula automaticamente a modalidade) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-sky-300 mb-1">
                      Time / Turma Inscrita (define a Modalidade automaticamente)
                    </label>
                    <select
                      value={draft.teamId || linkedTeam?.id || ''}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-sky-500/50 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-400"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          [{t.modality}] {t.name} — {t.schedule} ({t.filledSpots ?? 0}/{t.totalSpots} vagas)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Posição em {modalityProfile.modalityName}
                    </label>
                    <select
                      value={
                        modalityProfile.positions.includes(draft.position)
                          ? draft.position
                          : modalityProfile.defaultPosition
                      }
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          position: e.target.value,
                          positionGroup: derivePositionGroup(
                            e.target.value,
                            draft.modality,
                            draft.modalityOrClass
                          ),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    >
                      {modalityProfile.positions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {modalityProfile.dominanceLabel}
                    </label>
                    <select
                      value={draft.preferredFoot}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          preferredFoot: e.target.value as ProjectParticipant['preferredFoot'],
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Destro">Destro(a)</option>
                      <option value="Canhoto">Canhoto(a)</option>
                      <option value="Ambidestro">Ambidestro(a)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Camisa (#)</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={draft.jerseyNumber}
                      onChange={(e) =>
                        setDraft({ ...draft, jerseyNumber: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Idade</label>
                    <input
                      type="number"
                      min={6}
                      max={25}
                      value={draft.age}
                      onChange={(e) =>
                        setDraft({ ...draft, age: Math.max(6, Number(e.target.value) || 12) })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Frequência</label>
                    <input
                      type="text"
                      value={draft.schoolInfo?.attendanceRate || '100%'}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          schoolInfo: { ...draft.schoolInfo, attendanceRate: e.target.value },
                        })
                      }
                      placeholder="Ex: 98%"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Nível Cartinha</label>
                    <select
                      value={draft.cardTier}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          cardTier: e.target.value as ProjectParticipant['cardTier'],
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="prata">Prata · Formação</option>
                      <option value="promessa">Promessa · Futuro</option>
                      <option value="destaque">Destaque Regional</option>
                      <option value="ouro">Ouro · Destaque</option>
                      <option value="diamante">Diamante · Elite</option>
                    </select>
                  </div>
                </div>

                {/* 3. Atributos da Modalidade */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400 uppercase tracking-wider">
                      Atributos de {modalityProfile.modalityName} (OVR Automático: {draft.stats.overall})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        ['pace', modalityProfile.statLabels.pace],
                        ['shooting', modalityProfile.statLabels.shooting],
                        ['passing', modalityProfile.statLabels.passing],
                        ['dribbling', modalityProfile.statLabels.dribbling],
                        ['defending', modalityProfile.statLabels.defending],
                        ['physical', modalityProfile.statLabels.physical],
                      ] as const
                    ).map(([key, labelObj]) => (
                      <div
                        key={key}
                        className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1"
                      >
                        <label className="block text-[10px] font-bold text-slate-400">
                          {labelObj.short} · {labelObj.full}
                        </label>
                        <input
                          type="number"
                          min={40}
                          max={99}
                          value={draft.stats[key]}
                          onChange={(e) => handleStatChange(key, Number(e.target.value))}
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Parecer Técnico e Destaques */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Parecer Técnico ({modalityProfile.modalityName})
                    </label>
                    <textarea
                      rows={2}
                      value={draft.scoutReport?.summary || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          scoutReport: { ...draft.scoutReport, summary: e.target.value },
                        })
                      }
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-emerald-400 mb-1">
                        Pontos Fortes (separados por vírgula)
                      </label>
                      <input
                        type="text"
                        value={strengthsText}
                        onChange={(e) => setStrengthsText(e.target.value)}
                        placeholder={
                          modalityProfile.modalityKey === 'voleibol'
                            ? 'Saque viagem, Impulsão, Recepção'
                            : 'Velocidade, Passe curto, Finalização'
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-amber-400 mb-1">
                        Áreas em Lapidação (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={devAreasText}
                        onChange={(e) => setDevAreasText(e.target.value)}
                        placeholder={
                          modalityProfile.modalityKey === 'voleibol'
                            ? 'Tempo de bloqueio, Defesa de fundo'
                            : 'Chute com perna não dominante, Recomposição'
                        }
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Conquistas & Destaques (1 por linha)
                    </label>
                    <textarea
                      rows={2}
                      value={highlightsText}
                      onChange={(e) => setHighlightsText(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('scout')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Salvando...' : 'Salvar Alterações no Firebase'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
