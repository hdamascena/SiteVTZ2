import React from 'react';
import {
  Sparkles,
  Award,
  Video,
  GraduationCap,
  Eye,
  Crosshair,
  Footprints,
  Calendar,
  Ruler,
  Weight,
} from 'lucide-react';
import { ProjectParticipant } from '../types/index.ts';

interface PlayerCardProps {
  participant: ProjectParticipant;
  shieldUrl?: string;
  projectName?: string;
  onInspect: (participant: ProjectParticipant) => void;
  onOpenScout?: (participant: ProjectParticipant) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  participant,
  shieldUrl,
  projectName = 'Projeto Vitalizar',
  onInspect,
  onOpenScout,
}) => {
  const { stats, cardTier } = participant;

  // Visual theming based on card tier
  const getTierTheme = () => {
    switch (cardTier) {
      case 'diamante':
        return {
          cardBg: 'from-slate-950 via-sky-950 to-slate-900',
          border: 'border-cyan-400/90 shadow-cyan-500/20',
          badgeBg: 'bg-cyan-500/20 border-cyan-400/80 text-cyan-300',
          accentText: 'text-cyan-400',
          glow: 'from-cyan-500/20 via-sky-500/10 to-transparent',
          label: 'DIAMANTE · ELITE',
          numberColor: 'text-cyan-300',
          pillBg: 'bg-cyan-950/70 border-cyan-800/60 text-cyan-200',
        };
      case 'ouro':
        return {
          cardBg: 'from-slate-950 via-amber-950/80 to-slate-900',
          border: 'border-amber-400/90 shadow-amber-500/20',
          badgeBg: 'bg-amber-500/20 border-amber-400/80 text-amber-300',
          accentText: 'text-amber-400',
          glow: 'from-amber-500/20 via-yellow-500/10 to-transparent',
          label: 'OURO · DESTAQUE',
          numberColor: 'text-amber-300',
          pillBg: 'bg-amber-950/70 border-amber-800/60 text-amber-200',
        };
      case 'promessa':
        return {
          cardBg: 'from-slate-950 via-emerald-950/80 to-slate-900',
          border: 'border-emerald-400/90 shadow-emerald-500/20',
          badgeBg: 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300',
          accentText: 'text-emerald-400',
          glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
          label: 'PROMESSA · FUTURO',
          numberColor: 'text-emerald-300',
          pillBg: 'bg-emerald-950/70 border-emerald-800/60 text-emerald-200',
        };
      case 'destaque':
        return {
          cardBg: 'from-slate-950 via-purple-950/80 to-slate-900',
          border: 'border-purple-400/90 shadow-purple-500/20',
          badgeBg: 'bg-purple-500/20 border-purple-400/80 text-purple-300',
          accentText: 'text-purple-400',
          glow: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
          label: 'DESTAQUE REGIONAL',
          numberColor: 'text-purple-300',
          pillBg: 'bg-purple-950/70 border-purple-800/60 text-purple-200',
        };
      default:
        return {
          cardBg: 'from-slate-950 via-slate-900 to-slate-950',
          border: 'border-slate-300/80 shadow-slate-500/10',
          badgeBg: 'bg-slate-700/50 border-slate-400/80 text-slate-200',
          accentText: 'text-slate-300',
          glow: 'from-slate-500/15 via-slate-600/10 to-transparent',
          label: 'PRATA · FORMAÇÃO',
          numberColor: 'text-slate-300',
          pillBg: 'bg-slate-900/80 border-slate-700 text-slate-300',
        };
    }
  };

  const theme = getTierTheme();

  const getPositionAbbr = (pos: string) => {
    const lower = pos.toLowerCase();
    if (lower.includes('centroavante') || lower.includes('atacante')) return 'ATA';
    if (lower.includes('meia') || lower.includes('armador')) return 'MEI';
    if (lower.includes('volante')) return 'VOL';
    if (lower.includes('goleiro')) return 'GOL';
    if (lower.includes('zagueiro')) return 'ZAG';
    if (lower.includes('lateral')) return 'LAT';
    if (lower.includes('ponta') || lower.includes('ala')) return 'ALA';
    return pos.slice(0, 3).toUpperCase();
  };

  return (
    <div
      className={`group relative rounded-2xl bg-gradient-to-b ${theme.cardBg} border-2 ${theme.border} p-4 text-white shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between overflow-hidden cursor-pointer`}
      onClick={() => onInspect(participant)}
    >
      {/* Background ambient glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-radial ${theme.glow} opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity`}
      />

      {/* Decorative top pattern */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Card Header: Rating, Position, Shield, Jersey Number */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* OVR Rating Box */}
          <div className="text-center leading-none">
            <span className="block text-2xl sm:text-3xl font-black tracking-tighter drop-shadow-md">
              {stats.overall}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 inline-block ${theme.badgeBg}`}
            >
              {getPositionAbbr(participant.position)}
            </span>
          </div>

          {/* Project Shield */}
          {shieldUrl && (
            <div
              className="w-8 h-8 rounded-full bg-slate-900/80 p-1 border border-white/20 shadow-xs flex items-center justify-center shrink-0"
              title={projectName}
            >
              <img
                src={shieldUrl}
                alt="Escudo do Projeto"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Tier Label & Jersey Number */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
            {participant.category}
          </span>
          <div
            className={`w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-xs ${theme.numberColor}`}
            title={`Camisa #${participant.jerseyNumber}`}
          >
            #{participant.jerseyNumber}
          </div>
        </div>
      </div>

      {/* Player Photo Centerpiece */}
      <div className="relative z-10 my-3 flex flex-col items-center">
        <div className="relative w-32 h-36 sm:w-36 sm:h-40 rounded-xl overflow-hidden border border-white/20 bg-slate-900/60 shadow-inner group-hover:scale-105 transition-transform duration-300">
          <img
            src={participant.photoUrl}
            alt={participant.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

          {/* Video indicator badge */}
          {participant.videos && participant.videos.length > 0 && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white text-[9px] font-bold flex items-center gap-1 shadow-md">
              <Video className="w-2.5 h-2.5" />
              <span>{participant.videos.length} VÍDEOS</span>
            </div>
          )}

          {/* Preferred Foot Pill */}
          <div className="absolute bottom-1 left-2 text-[10px] font-semibold text-slate-300 flex items-center gap-1">
            <Footprints className="w-2.5 h-2.5 text-sky-400" />
            <span>{participant.preferredFoot}</span>
          </div>
        </div>

        {/* Name & Nickname Banner */}
        <div className="mt-2 text-center w-full">
          <h4 className="text-base font-extrabold tracking-tight text-white uppercase drop-shadow-sm truncate">
            {participant.nickname || participant.name.split(' ')[0]}
          </h4>
          <p className="text-[11px] font-medium text-slate-400 truncate">
            {participant.name}
          </p>
          <p className="text-[11px] font-semibold text-sky-300 mt-0.5">
            {participant.position}
          </p>
        </div>
      </div>

      {/* Core Attributes Hexagon / 6 FIFA-style Stats Grid */}
      <div className="relative z-10 bg-slate-950/80 rounded-xl border border-white/10 p-2.5 shadow-inner backdrop-blur-xs">
        <div className="grid grid-cols-3 gap-y-1.5 gap-x-2 text-center text-xs">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">VEL</span>
            <span className="font-extrabold text-white text-sm">{stats.pace}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">FIN</span>
            <span className="font-extrabold text-white text-sm">{stats.shooting}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">PAS</span>
            <span className="font-extrabold text-white text-sm">{stats.passing}</span>
          </div>
          <div className="flex flex-col items-center border-t border-white/5 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">DRI</span>
            <span className="font-extrabold text-white text-sm">{stats.dribbling}</span>
          </div>
          <div className="flex flex-col items-center border-t border-white/5 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">DEF</span>
            <span className="font-extrabold text-white text-sm">{stats.defending}</span>
          </div>
          <div className="flex flex-col items-center border-t border-white/5 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">FIS</span>
            <span className="font-extrabold text-white text-sm">{stats.physical}</span>
          </div>
        </div>
      </div>

      {/* School Compliance & Scouting Mini Info */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1 text-slate-400">
            <GraduationCap className="w-3 h-3 text-emerald-400" />
            <span>Frequência:</span>
          </span>
          <span className="font-bold text-emerald-300">
            {participant.schoolInfo.attendanceRate}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span className="text-slate-400">Idade / Porte:</span>
          <span className="font-semibold text-white">
            {participant.age} anos · {participant.height} · {participant.weight}
          </span>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(participant);
            }}
            className="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Analisar Dossiê</span>
          </button>

          {onOpenScout && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenScout(participant);
              }}
              title="Solicitar Avaliação Técnica deste Atleta"
              className="p-2 rounded-lg bg-white/10 hover:bg-amber-500/20 hover:text-amber-300 border border-white/20 text-slate-200 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
