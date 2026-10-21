import React from 'react';
import { ExternalLink, Award, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';
import type { Sponsor, SponsorTier } from '../types/index.ts';

interface SponsorsSectionProps {
  onOpenContact?: () => void;
  title?: string;
  subtitle?: string;
}

const TIER_CONFIG: Record<
  SponsorTier,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    borderCol: string;
    cardSize: string;
    logoHeight: string;
    icon: typeof Award;
  }
> = {
  master: {
    label: 'Patrocinadores Master',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-700 border-amber-300',
    borderCol: 'border-amber-200/80 hover:border-amber-400',
    cardSize: 'col-span-12 md:col-span-6 lg:col-span-6',
    logoHeight: 'h-20',
    icon: Sparkles,
  },
  ouro: {
    label: 'Patrocinadores Ouro',
    badgeBg: 'bg-yellow-500/10',
    badgeText: 'text-yellow-800 border-yellow-300',
    borderCol: 'border-yellow-200 hover:border-yellow-400',
    cardSize: 'col-span-12 sm:col-span-6 lg:col-span-4',
    logoHeight: 'h-16',
    icon: Award,
  },
  prata: {
    label: 'Patrocinadores Prata',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 border-slate-300',
    borderCol: 'border-slate-200 hover:border-slate-400',
    cardSize: 'col-span-12 sm:col-span-6 lg:col-span-3',
    logoHeight: 'h-14',
    icon: ShieldCheck,
  },
  bronze: {
    label: 'Patrocinadores Bronze',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-800 border-orange-200',
    borderCol: 'border-orange-100 hover:border-orange-300',
    cardSize: 'col-span-12 sm:col-span-6 lg:col-span-3',
    logoHeight: 'h-12',
    icon: HeartHandshake,
  },
  apoio: {
    label: 'Apoio Institucional & Chancela',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-800 border-sky-200',
    borderCol: 'border-sky-100 hover:border-sky-300',
    cardSize: 'col-span-12 sm:col-span-6 lg:col-span-3',
    logoHeight: 'h-14',
    icon: HeartHandshake,
  },
};

export const SponsorsSection: React.FC<SponsorsSectionProps> = ({
  onOpenContact,
  title = 'Patrocinadores & Parceiros Oficiais',
  subtitle = 'Empresas e instituições que acreditam no impacto transformador do esporte e da cidadania em Cariacica/ES.',
}) => {
  const { sponsors } = useClubData();

  const activeSponsors = sponsors.filter((s) => s.active);

  // Group by tier
  const masterSponsors = activeSponsors.filter((s) => s.tier === 'master');
  const ouroSponsors = activeSponsors.filter((s) => s.tier === 'ouro');
  const prataSponsors = activeSponsors.filter((s) => s.tier === 'prata');
  const bronzeSponsors = activeSponsors.filter((s) => s.tier === 'bronze');
  const apoioSponsors = activeSponsors.filter((s) => s.tier === 'apoio');

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-slate-200">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-100 text-[#0284c7] text-xs font-black uppercase tracking-wider mb-2">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Rede de Apoio ao Esporte</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{subtitle}</p>
          </div>

          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="px-5 py-3 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-sky-400/30 shrink-0"
            >
              <HeartHandshake className="w-4 h-4 text-[#38bdf8]" />
              <span>Seja um Patrocinador</span>
            </button>
          )}
        </div>

        {/* Master Tier */}
        {masterSponsors.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Patrocinador Master & Poder Público
              </h3>
            </div>
            <div className="grid grid-cols-12 gap-6">
              {masterSponsors.map((spon) => (
                <div
                  key={spon.id}
                  className="col-span-12 md:col-span-6 bg-white p-6 rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-24 h-24 rounded-xl bg-amber-50/50 p-2 flex items-center justify-center border border-amber-200 shrink-0 overflow-hidden">
                      <img
                        src={spon.logoUrl}
                        alt={`Logo ${spon.name}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          {spon.tierLabel}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{spon.category}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900">{spon.name}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {spon.description}
                      </p>
                    </div>
                  </div>

                  {spon.websiteUrl && (
                    <div className="mt-4 pt-3 border-t border-amber-100 flex justify-end">
                      <a
                        href={spon.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:text-[#0a1e36] transition-colors"
                      >
                        <span>Conhecer Parceiro</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ouro & Prata Tiers */}
        {(ouroSponsors.length > 0 || prataSponsors.length > 0) && (
          <div className="mt-10">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Patrocinadores Ouro & Prata</span>
            </h3>

            <div className="grid grid-cols-12 gap-5">
              {[...ouroSponsors, ...prataSponsors].map((spon) => (
                <div
                  key={spon.id}
                  className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          spon.tier === 'ouro'
                            ? 'bg-yellow-50 text-yellow-900 border-yellow-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {spon.tierLabel}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {spon.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-50 p-1 flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                        <img
                          src={spon.logoUrl}
                          alt={`Logo ${spon.name}`}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80';
                          }}
                        />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{spon.name}</h4>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {spon.description}
                    </p>
                  </div>

                  {spon.websiteUrl && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                      <a
                        href={spon.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284c7] hover:underline"
                      >
                        <span>Visitar site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bronze & Apoio Institucional */}
        {(bronzeSponsors.length > 0 || apoioSponsors.length > 0) && (
          <div className="mt-10">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-slate-400" />
              <span>Apoiadores Comunitários & Chancela Institucional</span>
            </h3>

            <div className="grid grid-cols-12 gap-4">
              {[...bronzeSponsors, ...apoioSponsors].map((spon) => (
                <div
                  key={spon.id}
                  className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex items-center gap-3.5"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-50 p-1 flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                    <img
                      src={spon.logoUrl}
                      alt={`Logo ${spon.name}`}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase text-slate-500 block">
                      {spon.tierLabel}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate" title={spon.name}>
                      {spon.name}
                    </h5>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {spon.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Callout: Lei de Incentivo e Apoio */}
        <div className="mt-12 bg-[#0a1e36] text-white p-6 sm:p-8 rounded-3xl border border-sky-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider">
              Associação Esportiva Vitalizar • CNPJ 63.083.068/0001-00
            </span>
            <h4 className="text-lg sm:text-xl font-black">
              Sua empresa também pode transformar vidas através do esporte
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Atuamos sob a Lei Federal nº 13.019/2014 (MROSC) e mecanismos de incentivo fiscal ao
              esporte. Oferecemos visibilidade de marca em uniformes, festivais comunitários e redes
              sociais, além de relatórios de prestação de contas transparentes.
            </p>
          </div>

          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="px-6 py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer shrink-0 border border-sky-300/40"
            >
              Solicitar Proposta de Parceria
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
