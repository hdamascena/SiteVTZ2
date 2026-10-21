import React, { useState } from 'react';
import {
  X,
  Award,
  Video,
  Play,
  Share2,
  Printer,
  Crosshair,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Ruler,
  Weight,
  Footprints,
  Shield,
  Phone,
  Mail,
  Copy,
  Check,
  ChevronRight,
  Maximize2,
  FileText,
} from 'lucide-react';
import { ProjectParticipant, PlayerHighlightVideo } from '../types/index.ts';
import { PlayerCard } from './PlayerCard.tsx';

interface PlayerScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: ProjectParticipant | null;
  shieldUrl?: string;
  projectName?: string;
  onOpenScoutContact: (player: ProjectParticipant) => void;
}

export const PlayerScoutModal: React.FC<PlayerScoutModalProps> = ({
  isOpen,
  onClose,
  player,
  shieldUrl,
  projectName = 'Projeto Vitalizar',
  onOpenScoutContact,
}) => {
  const [activeTab, setActiveTab] = useState<'scout' | 'videos' | 'fotos' | 'bio'>('scout');
  const [selectedVideo, setSelectedVideo] = useState<PlayerHighlightVideo | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen || !player) return null;

  const currentVideo = selectedVideo || (player.videos && player.videos.length > 0 ? player.videos[0] : null);

  const handleCopyProfileLink = () => {
    const url = window.location.href.split('#')[0] + `#atleta-${player.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-white flex flex-col">
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shieldUrl && (
              <img
                src={shieldUrl}
                alt="Escudo do Projeto"
                className="w-9 h-9 object-contain"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/80">
                  Dossiê Oficial de Olheiro · Vitrine de Atletas
                </span>
                <span className="text-xs text-slate-400">· {projectName}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                <span>{player.name}</span>
                {player.nickname && (
                  <span className="text-amber-400 font-semibold text-base">
                    "{player.nickname}"
                  </span>
                )}
                <span className="text-slate-400 font-medium text-sm">
                  (Camisa #{player.jerseyNumber} · {player.position})
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar Dossiê"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Player Trading Card & Quick Scout Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="max-w-[340px] mx-auto w-full">
              <PlayerCard
                participant={player}
                shieldUrl={shieldUrl}
                projectName={projectName}
                onInspect={() => {}}
                onOpenScout={onOpenScoutContact}
              />
            </div>

            {/* Quick Scout Action Buttons */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Ações para Observadores & Clubes
              </span>

              <button
                type="button"
                onClick={() => onOpenScoutContact(player)}
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

          {/* Right Column: Tabbed Content & In-depth Scout Analysis */}
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
                <span>Relatório Técnico (Scout)</span>
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
                <span>Vídeos de Jogadas ({player.videos?.length || 0})</span>
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
                <span>Fotos em Campo ({player.photos?.length || 1})</span>
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
                <span>Ficha Escolar & Dados</span>
              </button>
            </div>

            {/* TAB 1: Scout Report */}
            {activeTab === 'scout' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Scout Rating Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-sky-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      Classificação Oficial de Captação
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {player.scoutReport.scoutRating}
                    </h3>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs text-center shrink-0">
                    OVR {player.stats.overall} · Nível {player.cardTier.toUpperCase()}
                  </div>
                </div>

                {/* Scout Executive Summary */}
                <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Parecer da Comissão Técnica Vitalizar</span>
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {player.scoutReport.summary}
                  </p>
                </div>

                {/* Strengths & Development Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pontos Fortes (Destaque)</span>
                    </h5>
                    <ul className="space-y-2">
                      {player.scoutReport.strengths.map((str, idx) => (
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

                  {/* Development Areas */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Áreas em Lapidação</span>
                    </h5>
                    <ul className="space-y-2">
                      {player.scoutReport.developmentAreas.map((dev, idx) => (
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
                {player.highlights && player.highlights.length > 0 && (
                  <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Conquistas & Registros na Temporada</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {player.highlights.map((hl, idx) => (
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
                    {/* Simulated High-Res Video Player Box */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4 group">
                      <img
                        src={currentVideo.thumbnailUrl}
                        alt={currentVideo.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Video Tag badge */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                          <Play className="w-3 h-3 fill-white" />
                          <span>{currentVideo.categoryTag || 'Destaque'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/70 text-slate-300 text-xs font-mono">
                          {currentVideo.duration}
                        </span>
                      </div>

                      {/* Play Button Overlay */}
                      <div className="relative z-10 flex items-center justify-center my-auto">
                        <button
                          type="button"
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Play className="w-8 h-8 fill-white ml-1" />
                        </button>
                      </div>

                      {/* Video title overlay bottom */}
                      <div className="relative z-10 space-y-1">
                        <h4 className="text-base font-bold text-white drop-shadow">
                          {currentVideo.title}
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {currentVideo.description}
                        </p>
                      </div>
                    </div>

                    {/* Playlist selector */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Clipes Disponíveis para Avaliação
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {player.videos.map((vid) => (
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
                    <p className="text-sm">Nenhum vídeo cadastrado no momento para este atleta.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Photos Gallery */}
            {activeTab === 'fotos' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Registros de Partidas Oficiais e Treinamentos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(player.photos && player.photos.length > 0 ? player.photos : [player.photoUrl]).map(
                    (photo, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative group aspect-4/3"
                      >
                        <img
                          src={photo}
                          alt={`${player.name} registro ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                          <span className="text-xs font-medium text-slate-200">
                            Registro de Campo #{idx + 1} · {player.nickname || player.name}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Bio, School & Anthropometrics */}
            {activeTab === 'bio' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* School Information */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Conformidade Escolar Obrigatória (Exigência Vitalizar)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Unidade Escolar
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.schoolInfo.schoolName}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Série & Turno
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.schoolInfo.grade} ({player.schoolInfo.turn})
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/40 col-span-1 sm:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Frequência Escolar Comprovada
                        </span>
                        <span className="text-emerald-300 font-extrabold text-sm mt-0.5 block">
                          {player.schoolInfo.attendanceRate} de Assiduidade
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold rounded-lg uppercase">
                        Apto & Regular
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anthropometrics & Profile Details */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Ruler className="w-4 h-4" />
                    <span>Dados Biométricos & Físicos</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Idade / Nasc.
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.age} anos ({player.birthDate})
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Altura / Estatura
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.height}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Peso Corporal
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.weight}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Pé Preferencial
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.preferredFoot}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Categoria
                      </span>
                      <span className="text-white font-semibold mt-0.5 block">
                        {player.category}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Setor Tático
                      </span>
                      <span className="text-white font-semibold mt-0.5 block uppercase">
                        {player.positionGroup}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
