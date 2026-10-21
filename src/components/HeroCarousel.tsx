import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trophy,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';

interface HeroCarouselProps {
  onOpenInscricoes: () => void;
  onOpenSubpage: (pageId: string, subId?: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'slide-esporte',
    kicker: 'Esporte Educacional · Rio Marinho, Cariacica/ES',
    headline: 'Formando cidadãos e atletas através do esporte comunitário gratuito.',
    description:
      'Escolinhas de futsal, voleibol e iniciação esportiva com acompanhamento pedagógico, material completo e acesso aberto para crianças e jovens de 6 a 17 anos.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=85',
    caption: 'Treinamento das categorias Sub-11 e Sub-15 no Polo Rio Marinho',
    schedule: 'Terças, Quintas e Sábados · Manhã e Tarde',
    primaryActionLabel: 'Inscrever-se em Modalidades',
    secondaryLabel: 'Explorar Projetos Esportivos',
    secondaryTarget: 'projetos',
  },
  {
    id: 'slide-saude',
    kicker: 'Saúde Preventiva & Envelhecimento Ativo · Cariacica/ES',
    headline: 'Movimento, vitalidade e bem-estar para adultos e terceira idade.',
    description:
      'Circuitos funcionais ao ar livre, ginástica articular, alongamento orientado e convivência comunitária para promover qualidade de vida em todas as fases.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=85',
    caption: 'Circuito Saúde & Movimento com turmas da terceira idade',
    schedule: 'Segundas, Quartas e Sextas · 07h30 às 09h30',
    primaryActionLabel: 'Participar do Projeto Vida Ativa',
    secondaryLabel: 'Ver Agenda de Oficinas',
    secondaryTarget: 'eventos',
  },
  {
    id: 'slide-comunidade',
    kicker: 'Inclusão Social & Festivais Comunitários · Cariacica/ES',
    headline: 'Esporte adaptado, cultura e integração para toda a família.',
    description:
      'Festivais esportivos nos bairros, colônias de férias, oficinas culturais e atendimento inclusivo com transparência ativa e gestão participativa.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1400&q=85',
    caption: 'Festival Esportivo Comunitário e oficinas integradas em Cariacica',
    schedule: 'Programação Mensal Aberta à Comunidade',
    primaryActionLabel: 'Garantir Vaga nas Atividades',
    secondaryLabel: 'Conhecer a Vitalizar',
    secondaryTarget: 'a-vitalizar',
  },
];

const EASE_EDITORIAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onOpenInscricoes,
  onOpenSubpage,
}) => {
  const { projects, events, siteSettings } = useClubData();
  const slides =
    Array.isArray(siteSettings.heroSlides) && siteSettings.heroSlides.length > 0
      ? siteSettings.heroSlides
      : HERO_SLIDES;
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[activeSlide % slides.length] || slides[0];


  return (
    <section
      className="bg-slate-50 border-b border-slate-200"
      aria-label="Destaques e Modalidades da Associação Esportiva Vitalizar"
    >
      {/* Part 1: High-Impact Athletic Hero Showcase */}
      <div className="relative bg-gradient-to-br from-[#041226] via-[#071f40] to-[#0a2b56] text-white overflow-hidden">
        {/* Subtle Radial Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            background:
              'radial-gradient(circle at 80% 35%, rgba(56, 189, 248, 0.35), transparent 55%), radial-gradient(circle at 15% 80%, rgba(2, 132, 199, 0.28), transparent 50%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left Column: Editorial Headline, Crest Badge & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: EASE_EDITORIAL }}
              className="lg:col-span-7 flex flex-col justify-between space-y-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE_EDITORIAL }}
                  className="space-y-5"
                >
                  {/* Unboxed Kicker with Official Crest Emblem */}
                  <div className="flex items-center gap-3 text-xs font-semibold text-sky-300 tracking-wide">
                    <img
                      src="/logo.png"
                      alt="Brasão Oficial Vitalizar"
                      className="w-8 h-8 object-contain drop-shadow-sm shrink-0"
                    />
                    <span>{current.kicker}</span>
                  </div>

                  <h1
                    className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12]"
                    style={{ textWrap: 'balance' }}
                  >
                    {current.headline}
                  </h1>

                  <p className="text-base sm:text-lg text-sky-100/90 leading-relaxed max-w-2xl">
                    {current.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons & Slide Controls */}
              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={onOpenInscricoes}
                    className="px-6 py-3.5 bg-[#0284c7] hover:bg-[#0ea5e9] text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-950/60 transition-all inline-flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>{current.primaryActionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenSubpage(current.secondaryTarget)}
                    className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {current.secondaryLabel}
                  </button>
                </div>

                {/* Quantitative Impact Strip + Slide Switcher */}
                <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="grid grid-cols-3 gap-6 sm:gap-8">
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {projects.length}
                      </p>
                      <p className="text-xs text-sky-200/80 mt-0.5">
                        Projetos ativos
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#38bdf8] tabular-nums">
                        {events.length}
                      </p>
                      <p className="text-xs text-sky-200/80 mt-0.5">
                        Eventos na agenda
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        100%
                      </p>
                      <p className="text-xs text-sky-200/80 mt-0.5">
                        Gratuito à comunidade
                      </p>
                    </div>
                  </div>

                  {/* Slide Navigation Controls */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveSlide(idx)}
                        aria-label={`Ir para destaque ${idx + 1}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          activeSlide === idx
                            ? 'w-8 bg-[#38bdf8]'
                            : 'w-2 bg-white/30 hover:bg-white/60'
                        }`}
                      />
                    ))}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide(
                            (prev) => (prev - 1 + slides.length) % slides.length
                          )
                        }
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Destaque anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide((prev) => (prev + 1) % slides.length)
                        }
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Próximo destaque"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Right Column: Visual Media Showcase Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 18 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE_EDITORIAL }}
              className="lg:col-span-5 flex"
            >
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-sky-400/30 shadow-2xl flex flex-col justify-between min-h-[340px] lg:min-h-full">
                <img
                  src={current.image}
                  alt={current.caption}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030d1c]/95 via-[#030d1c]/40 to-transparent" />

                {/* Top Corner Crest Overlay */}
                <div className="relative z-10 p-5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/95 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15">
                    Cariacica · Espírito Santo
                  </span>
                </div>

                {/* Bottom Caption & Schedule */}
                <div className="relative z-10 p-6 space-y-2.5">
                  <p className="text-xs font-semibold text-[#38bdf8] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{current.schedule}</span>
                  </p>
                  <p className="font-display text-lg font-bold text-white leading-snug">
                    {current.caption}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs text-sky-200/90 border-t border-white/15">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
                      Polo Rio Marinho e Região
                    </span>
                    <button
                      type="button"
                      onClick={onOpenInscricoes}
                      className="font-semibold text-white hover:text-[#38bdf8] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Garantir vaga</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Part 2: Visually Rich Modalities & Programs Bento Showcase with Scroll Reveal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
              Frentes de Atuação · Vagas Gratuitas
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Modalidades e Programas Sociais
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenSubpage('projetos')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] cursor-pointer self-start sm:self-auto"
          >
            <span>Ver todos os {projects.length} projetos detalhados</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* 4-Card Visual Program Grid with Staggered Scroll Reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.slice(0, 4).map((proj, index) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: EASE_EDITORIAL,
              }}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400/70 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                  <img
                    src={proj.imageUrl}
                    alt={proj.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3.5 text-xs font-semibold text-white">
                    0{index + 1} · {proj.targetAudience.split('(')[0].trim()}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors leading-snug">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                  <span className="truncate">{proj.schedule}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenSubpage('projetos', proj.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={onOpenInscricoes}
                    className="px-3.5 py-2 bg-sky-50 hover:bg-[#0284c7] text-[#0284c7] hover:text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inscrever-se</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Institutional Trust & Pillars Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE_EDITORIAL }}
          className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Formação Esportiva de Base
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Metodologia pedagógica voltada à disciplina, trabalho em equipe e prevenção à vulnerabilidade social.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Saúde Preventiva & Terceira Idade
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Acompanhamento físico regular para combate ao sedentarismo, fortalecimento muscular e socialização.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                Gestão Transparente (MROSC)
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Prestação de contas aberta à comunidade em conformidade com a Lei Federal nº 13.019/2014.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
