import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  Search,
  X,
  Share2,
  ExternalLink,
  AlertCircle,
  CalendarPlus,
  LayoutGrid,
  List,
  Paperclip,
  Download,
  FileText,
} from 'lucide-react';
import { VitalizarEvent, EventCategory } from '../types/index.ts';
import { useClubData } from '../context/ClubDataContext.tsx';
import {
  filterEvents,
  sortEventsByDate,
  validateEventRSVP,
  generateGoogleCalendarUrl,
} from '../utils/eventFilter.ts';

interface EventsCalendarProps {
  onOpenInscricoes?: () => void;
  className?: string;
  initialCategory?: EventCategory | 'all';
}

const EASE_EDITORIAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const EventsCalendar: React.FC<EventsCalendarProps> = ({
  onOpenInscricoes,
  className = '',
  initialCategory = 'all',
}) => {
  const { events, addRsvp, showToast } = useClubData();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [selectedEvent, setSelectedEvent] = useState<VitalizarEvent | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // RSVP Modal State
  const [rsvpSpots, setRsvpSpots] = useState(1);
  const [participantName, setParticipantName] = useState('');
  const [participantPhone, setParticipantPhone] = useState('');
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const filteredEvents = useMemo(() => {
    const list = filterEvents(events, {
      category: selectedCategory,
      month: 'all',
      searchQuery,
    });
    return sortEventsByDate(list, true);
  }, [events, selectedCategory, searchQuery]);

  const openEventDetails = (event: VitalizarEvent) => {
    setSelectedEvent(event);
    setRsvpSpots(1);
    setParticipantName('');
    setParticipantPhone('');
    setRsvpConfirmed(false);
    setConfirmationCode('');
    setCopiedLink(false);
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  const handleConfirmRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const validation = validateEventRSVP(selectedEvent, rsvpSpots);
    if (!validation.valid) return;

    const code = addRsvp({
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      name: participantName,
      phone: participantPhone,
      spots: rsvpSpots,
    });

    setConfirmationCode(code);
    setRsvpConfirmed(true);
    showToast(`Presença confirmada para ${participantName}! Protocolo: ${code}`);
  };

  const handleCopyLink = () => {
    if (!selectedEvent) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/#eventos-${selectedEvent.id}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getCategoryText = (category: EventCategory) => {
    switch (category) {
      case 'clinica_esportiva':
        return 'Clínica Esportiva';
      case 'oficina_comunitaria':
        return 'Oficina Comunitária';
      case 'reuniao_associacao':
        return 'Reunião Institucional';
    }
  };

  const categoryTabs = [
    { id: 'all', label: 'Todos os Eventos' },
    { id: 'clinica_esportiva', label: 'Clínicas Esportivas' },
    { id: 'oficina_comunitaria', label: 'Oficinas Comunitárias' },
    { id: 'reuniao_associacao', label: 'Reuniões' },
  ];

  return (
    <section
      id="eventos-calendario"
      className={`relative py-16 bg-slate-100/70 border-b border-slate-200/80 overflow-hidden ${className}`}
      aria-label="Agenda de Eventos e Oficinas da Associação Esportiva Vitalizar"
    >
      {/* Ambient Radial Light Orbs to Accentuate Glassmorphism */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 12% 22%, rgba(56, 189, 248, 0.18), transparent 42%), radial-gradient(circle at 88% 65%, rgba(2, 132, 199, 0.15), transparent 48%), radial-gradient(circle at 50% 95%, rgba(14, 165, 233, 0.12), transparent 40%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6"
        >
          <div>
            <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
              Programação Oficial · Cariacica/ES
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Agenda de Eventos, Clínicas e Oficinas
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Confirme sua presença gratuita nas próximas atividades esportivas, mutirões de saúde e encontros da comunidade.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            {/* Glassmorphic View Toggle */}
            <div className="inline-flex items-center bg-white/65 backdrop-blur-md p-1 rounded-xl border border-white/80 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#061a38] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-[#061a38] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Glassmorphic Filter & Search Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, delay: 0.05, ease: EASE_EDITORIAL }}
          className="bg-white/65 backdrop-blur-xl border border-white/90 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(15,23,42,0.04)]"
        >
          <div
            className="inline-flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Filtrar eventos por categoria"
          >
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(tab.id as EventCategory | 'all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0284c7] text-white shadow-sm shadow-sky-500/25'
                      : 'bg-white/75 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por modalidade ou local..."
              aria-label="Buscar evento por nome ou local"
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-sky-600 focus:outline-none placeholder-slate-400 text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Events Display */}
        {filteredEvents.length === 0 ? (
          <div className="py-14 text-center bg-white/70 backdrop-blur-xl border border-white/90 rounded-2xl space-y-3 shadow-sm">
            <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Nenhum evento encontrado para o filtro selecionado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Redefina os filtros para visualizar toda a programação aberta da Associação Esportiva Vitalizar.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Ver Toda a Programação
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, idx) => {
              const isFull = event.availableSpots === 0;
              const isFeatured = idx === 0;
              const occupancyPercent = Math.min(
                100,
                Math.round(((event.capacity - event.availableSpots) / event.capacity) * 100)
              );

              return (
                <motion.button
                  key={event.id}
                  type="button"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{
                    duration: 0.5,
                    delay: (idx % 3) * 0.08,
                    ease: EASE_EDITORIAL,
                  }}
                  onClick={() => openEventDetails(event)}
                  className={`group relative text-left rounded-2xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 hover:-translate-y-1 ${
                    isFeatured
                      ? 'bg-gradient-to-br from-[#061a38]/92 via-[#092752]/90 to-[#041226]/95 text-white border border-sky-400/40 shadow-[0_16px_40px_rgba(2,132,199,0.18)]'
                      : 'bg-white/75 hover:bg-white/90 text-slate-900 border border-white/90 hover:border-sky-300/80 shadow-[0_8px_30px_rgb(15,23,42,0.06)] hover:shadow-[0_16px_36px_rgb(2,132,199,0.12)]'
                  }`}
                >
                  {/* Subtle Top Glass Specular Highlight */}
                  <div
                    className={`p-6 pb-4 w-full ${
                      isFeatured ? 'bg-white/[0.03]' : ''
                    }`}
                  >
                    {/* Top Row: Frosted Calendar Emblem + Unboxed Metadata */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform backdrop-blur-md ${
                            isFeatured
                              ? 'bg-white/15 border border-white/25 text-white'
                              : 'bg-gradient-to-br from-[#061a38] to-[#0c2d5e] text-white border border-sky-400/30'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#38bdf8] leading-none">
                            {event.monthShort}
                          </span>
                          <span className="font-display text-xl font-extrabold text-white leading-none mt-1 tabular-nums">
                            {event.dayNumber}
                          </span>
                        </div>

                        <div>
                          <div
                            className={`text-xs font-semibold ${
                              isFeatured ? 'text-[#38bdf8]' : 'text-[#0284c7]'
                            }`}
                          >
                            {isFeatured ? `Destaque · ${getCategoryText(event.category)}` : getCategoryText(event.category)}
                          </div>
                          <div
                            className={`text-xs mt-1 flex items-center gap-1 ${
                              isFeatured ? 'text-sky-100/80' : 'text-slate-500'
                            }`}
                          >
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                isFeatured ? 'text-sky-300' : 'text-slate-400'
                              }`}
                            />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3
                      className={`font-display text-base font-bold transition-colors leading-snug line-clamp-2 ${
                        isFeatured
                          ? 'text-white group-hover:text-[#38bdf8]'
                          : 'text-slate-900 group-hover:text-[#0284c7]'
                      }`}
                    >
                      {event.title}
                    </h3>

                    <p
                      className={`mt-2 text-xs line-clamp-2 leading-relaxed ${
                        isFeatured ? 'text-sky-100/80' : 'text-slate-600'
                      }`}
                    >
                      {event.description}
                    </p>
                  </div>

                  {/* Frosted Glass Bottom Footer Inside Card */}
                  <div
                    className={`p-6 pt-4 border-t space-y-3.5 w-full backdrop-blur-md ${
                      isFeatured
                        ? 'border-white/15 bg-white/[0.06]'
                        : 'border-slate-200/60 bg-white/55'
                    }`}
                  >
                    <div
                      className={`space-y-1.5 text-xs ${
                        isFeatured ? 'text-sky-100/90' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isFeatured ? 'text-[#38bdf8]' : 'text-[#0284c7]'
                          }`}
                        />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          isFeatured ? 'text-sky-200/75' : 'text-slate-500'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{event.targetAudience}</span>
                      </div>
                    </div>

                    {/* Visual Capacity Meter */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span
                          className={`font-medium ${
                            isFeatured ? 'text-sky-200/80' : 'text-slate-500'
                          }`}
                        >
                          Vagas disponíveis
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            isFeatured ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {isFull ? 'Lotado' : `${event.availableSpots} de ${event.capacity}`}
                        </span>
                      </div>
                      <div
                        className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isFeatured ? 'bg-white/20' : 'bg-slate-200/80'
                        }`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] transition-all duration-300"
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>
                    </div>

                    <div
                      className={`pt-1 flex items-center justify-between text-xs font-semibold ${
                        isFeatured ? 'text-[#38bdf8]' : 'text-[#0284c7]'
                      }`}
                    >
                      <span>{isFull ? 'Consultar detalhes' : 'Confirmar presença gratuita'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          /* Glassmorphic Timeline List View */
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: EASE_EDITORIAL }}
            className="bg-white/75 backdrop-blur-xl border border-white/90 rounded-2xl divide-y divide-slate-200/60 overflow-hidden shadow-[0_8px_30px_rgb(15,23,42,0.05)]"
          >
            {filteredEvents.map((event) => {
              const isFull = event.availableSpots === 0;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => openEventDetails(event)}
                  className="w-full text-left p-5 hover:bg-white/90 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#061a38] text-white flex flex-col items-center justify-center shrink-0 border border-sky-400/30">
                      <span className="text-[10px] font-bold text-[#38bdf8] uppercase leading-none">
                        {event.monthShort}
                      </span>
                      <span className="font-display text-lg font-extrabold text-white leading-none mt-1 tabular-nums">
                        {event.dayNumber}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">
                        <span className="text-[#0284c7] font-semibold">
                          {getCategoryText(event.category)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{event.time}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{event.location}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors mt-1">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      {isFull ? 'Lotado' : `${event.availableSpots} vagas`}
                    </span>
                    <span className="px-4 py-2 bg-sky-50/90 group-hover:bg-[#0284c7] text-[#0284c7] group-hover:text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1">
                      <span>Participar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Glassmorphic Community Callout Banner */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE_EDITORIAL }}
          className="mt-12 relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#061a38] via-[#0a264e] to-[#041226] text-white p-6 sm:p-8 shadow-xl border border-sky-400/30"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                'radial-gradient(circle at 85% 50%, rgba(56, 189, 248, 0.35), transparent 55%)',
            }}
          />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
                <img
                  src="/logo.png"
                  alt="Brasão Associação Esportiva Vitalizar"
                  className="w-14 h-14 object-contain drop-shadow-md"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#38bdf8] tracking-wide">
                  Inscrições Abertas · Polos de Cariacica/ES
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                  Quer matricular seu filho ou participar das turmas de saúde?
                </h3>
                <p className="text-xs sm:text-sm text-sky-100/85 max-w-2xl leading-relaxed">
                  Realize a pré-inscrição online em menos de 1 minuto para escolinhas de futsal, voleibol, ginástica funcional e oficinas comunitárias.
                </p>
              </div>
            </div>

            {onOpenInscricoes && (
              <button
                type="button"
                onClick={onOpenInscricoes}
                className="px-6 py-3.5 bg-[#0284c7]/90 hover:bg-[#0ea5e9] backdrop-blur-md border border-sky-300/40 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-2"
              >
                <span>Fazer Pré-Inscrição Gratuita</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Glassmorphic Event Detail & RSVP Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={selectedEvent.title}
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/80 text-slate-800">
            <div className="sticky top-0 z-10 bg-[#061a38]/95 backdrop-blur-xl text-white px-6 py-4 flex items-center justify-between border-b border-sky-900/80">
              <div className="flex items-center gap-2 text-xs text-sky-200 font-medium">
                <span className="text-[#38bdf8] font-semibold">
                  {getCategoryText(selectedEvent.category)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedEvent.formattedDate}</span>
              </div>

              <button
                type="button"
                onClick={closeEventDetails}
                className="p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar detalhes do evento"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {selectedEvent.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white/75 backdrop-blur-md rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Horário</span>
                    <span className="text-slate-600">{selectedEvent.time}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Público-Alvo</span>
                    <span className="text-slate-600">{selectedEvent.targetAudience}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-start justify-between gap-2.5 pt-2 border-t border-slate-200/80">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {selectedEvent.location}
                      </span>
                      <span className="text-slate-500">{selectedEvent.address}</span>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${selectedEvent.location}, ${selectedEvent.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284c7] hover:underline shrink-0"
                  >
                    <span>Mapa</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Schedule Highlights & Prerequisites */}
              {((selectedEvent.scheduleHighlights && selectedEvent.scheduleHighlights.length > 0) ||
                (selectedEvent.prerequisites && selectedEvent.prerequisites.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedEvent.scheduleHighlights &&
                    selectedEvent.scheduleHighlights.length > 0 && (
                      <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/80 space-y-1.5">
                        <span className="font-bold text-slate-900 block">
                          Destaques da Programação
                        </span>
                        <ul className="space-y-1 text-slate-600 list-disc pl-4">
                          {selectedEvent.scheduleHighlights.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {selectedEvent.prerequisites && selectedEvent.prerequisites.length > 0 && (
                    <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="font-bold text-slate-900 block">
                        Orientações / Pré-requisitos
                      </span>
                      <ul className="space-y-1 text-slate-600 list-disc pl-4">
                        {selectedEvent.prerequisites.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Attached Event Documents */}
              {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
                <div className="p-4 bg-white/80 rounded-xl border border-slate-200/80 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Materiais e Anexos do Evento ({selectedEvent.attachments.length})</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedEvent.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.dataUrl}
                        download={att.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg flex items-center justify-between gap-2 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[#0284c7] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0284c7] truncate block">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {att.type} · {att.size}
                            </span>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 bg-slate-50/85 backdrop-blur-md rounded-xl border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Confirmação de Presença Gratuita
                    </h3>
                    <p className="text-xs text-slate-500">
                      Coordenação: {selectedEvent.coordinator}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0284c7] tabular-nums">
                    {selectedEvent.availableSpots > 0
                      ? `${selectedEvent.availableSpots} vagas restantes`
                      : 'Lotado'}
                  </span>
                </div>

                {rsvpConfirmed ? (
                  <div className="py-4 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#0284c7] mx-auto" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Presença Confirmada!
                    </h4>
                    <p className="text-xs text-slate-600">
                      Inscrição registrada para <strong>{participantName}</strong> ({rsvpSpots}{' '}
                      {rsvpSpots === 1 ? 'vaga' : 'vagas'}).
                    </p>
                    <p className="text-xs font-mono text-slate-700 bg-white px-3 py-1.5 rounded border border-slate-200 inline-block">
                      Protocolo: {confirmationCode}
                    </p>
                  </div>
                ) : selectedEvent.availableSpots === 0 ? (
                  <div className="p-4 bg-white rounded-lg text-center text-xs text-slate-600 space-y-1 border border-slate-200">
                    <AlertCircle className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-800">
                      Vagas preenchidas para esta atividade.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmRsvp} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Telefone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={participantPhone}
                          onChange={(e) => setParticipantPhone(e.target.value)}
                          placeholder="(27) 90000-0000"
                          className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-700">Vagas:</label>
                        <select
                          value={rsvpSpots}
                          onChange={(e) => setRsvpSpots(Number(e.target.value))}
                          className="text-xs p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                        >
                          {[1, 2, 3, 4]
                            .filter((n) => n <= selectedEvent.availableSpots)
                            .map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? 'vaga' : 'vagas'}
                              </option>
                            ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Confirmar Presença
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <a
                    href={generateGoogleCalendarUrl(selectedEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Google Agenda</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copiedLink ? 'Copiado!' : 'Compartilhar'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeEventDetails}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
