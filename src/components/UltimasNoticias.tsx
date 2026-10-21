import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  X,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Paperclip,
  Download,
  FileText,
} from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';
import { NewsArticle } from '../types/index.ts';

interface UltimasNoticiasProps {
  onViewAllNews: () => void;
  onOpenSubpage?: (pageId: string, subId?: string) => void;
}

const EASE_EDITORIAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const UltimasNoticias: React.FC<UltimasNoticiasProps> = ({
  onViewAllNews,
  onOpenSubpage,
}) => {
  const { newsArticles } = useClubData();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const featuredArticle = newsArticles[0];
  const sideArticles = newsArticles.slice(1, 4);

  if (!featuredArticle) return null;

  return (
    <section
      className="relative py-16 bg-slate-100/80 border-t border-slate-200/80 overflow-hidden"
      aria-label="Últimas Notícias e Comunicados"
    >
      {/* Ambient Radial Light Orbs to Highlight Frosted Glass Surfaces */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 18% 30%, rgba(2, 132, 199, 0.16), transparent 45%), radial-gradient(circle at 82% 25%, rgba(56, 189, 248, 0.18), transparent 45%), radial-gradient(circle at 50% 85%, rgba(15, 23, 42, 0.06), transparent 50%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-[#0284c7] tracking-wide">
              Comunicação & Ações Comunitárias
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Últimas Notícias e Acontecimentos
            </h2>
          </div>

          <button
            type="button"
            onClick={onViewAllNews}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/75 hover:bg-white backdrop-blur-md text-slate-800 border border-white/90 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <span>Ver Todas as Notícias</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0284c7]" />
          </button>
        </motion.div>

        {/* 2-Column Glassmorphic Editorial News Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Lead Story with Frosted Glass Overlay & Translucent Editorial Frame */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: EASE_EDITORIAL }}
            className="lg:col-span-7 flex"
          >
            <button
              type="button"
              onClick={() => setSelectedArticle(featuredArticle)}
              className="group relative text-left bg-white/70 hover:bg-white/85 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/90 hover:border-sky-300/80 shadow-[0_12px_36px_rgb(15,23,42,0.07)] hover:shadow-[0_20px_44px_rgb(2,132,199,0.14)] transition-all duration-300 flex flex-col justify-between w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-900">
                <img
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Floating Glassmorphism Metadata Bar over Hero Image */}
                <div className="absolute bottom-4 left-4 right-4 px-4 py-2.5 rounded-xl bg-slate-950/45 backdrop-blur-md border border-white/20 flex items-center justify-between gap-2 text-xs text-sky-100">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-[#38bdf8] font-semibold">
                      {featuredArticle.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredArticle.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {featuredArticle.attachments && featuredArticle.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
                        <Paperclip className="w-3 h-3" />
                        <span>{featuredArticle.attachments.length}</span>
                      </span>
                    )}
                    <span className="text-white/90 font-semibold hidden sm:inline">
                      Matéria de Capa
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between w-full bg-gradient-to-b from-white/50 to-white/80 backdrop-blur-xl">
                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors leading-snug">
                    {featuredArticle.title}
                  </h3>

                  <p className="text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {featuredArticle.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs font-semibold text-[#0284c7] w-full">
                  <span>Ler matéria completa</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          </motion.div>

          {/* Secondary Glassmorphic Stories Stack */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {sideArticles.map((article, idx) => (
              <motion.button
                key={article.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08 + idx * 0.08,
                  ease: EASE_EDITORIAL,
                }}
                onClick={() => setSelectedArticle(article)}
                className="group text-left bg-white/70 hover:bg-white/90 backdrop-blur-xl p-4 rounded-2xl border border-white/90 hover:border-sky-300/80 shadow-[0_8px_24px_rgb(15,23,42,0.05)] hover:shadow-[0_12px_30px_rgb(2,132,199,0.12)] transition-all duration-200 flex gap-4 items-center cursor-pointer w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 hover:-translate-y-0.5"
              >
                <div className="relative w-32 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-white/60 shadow-2xs">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="truncate font-semibold text-[#0284c7]">
                        {article.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{article.date.split(' ')[0]}</span>
                      {article.attachments && article.attachments.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5 text-[#0284c7] font-semibold">
                            <Paperclip className="w-3 h-3" />
                            {article.attachments.length}
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors line-clamp-2 mt-1 leading-snug">
                      {article.title}
                    </h4>
                  </div>

                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#0284c7] inline-flex items-center gap-1 mt-2">
                    <span>Ler matéria</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Glassmorphic Institutional & Polos Quick-Access Strip */}
        {onOpenSubpage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE_EDITORIAL }}
            className="mt-14 pt-12 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <button
              type="button"
              onClick={() => onOpenSubpage('a-vitalizar', 'sede-polos')}
              className="group text-left bg-white/70 hover:bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/90 hover:border-sky-300/80 shadow-[0_8px_24px_rgb(15,23,42,0.05)] hover:shadow-[0_14px_32px_rgb(2,132,199,0.12)] transition-all flex items-start gap-4 cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#061a38] text-[#38bdf8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  Polos em Cariacica/ES
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conheça nossa sede em Rio Marinho e os espaços parceiros de treinamento esportivo.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenSubpage('transparencia')}
              className="group text-left bg-white/70 hover:bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/90 hover:border-sky-300/80 shadow-[0_8px_24px_rgb(15,23,42,0.05)] hover:shadow-[0_14px_32px_rgb(2,132,199,0.12)] transition-all flex items-start gap-4 cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#061a38] text-[#38bdf8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  Portal da Transparência
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consulte o estatuto social, certidões, diretoria e relatórios de prestação de contas.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onOpenSubpage('contato')}
              className="group text-left bg-white/70 hover:bg-white/90 backdrop-blur-xl p-6 rounded-2xl border border-white/90 hover:border-sky-300/80 shadow-[0_8px_24px_rgb(15,23,42,0.05)] hover:shadow-[0_14px_32px_rgb(2,132,199,0.12)] transition-all flex items-start gap-4 cursor-pointer hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#061a38] text-[#38bdf8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition-colors">
                  Fale Conosco & Parcerias
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Entre em contato com a coordenação para dúvidas, voluntariado ou apoio institucional.
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </div>

      {/* Glassmorphic Article Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/80 text-slate-800">
            <div className="sticky top-0 bg-white/85 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-slate-200/80 z-10">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="text-[#0284c7] font-semibold">{selectedArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedArticle.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Fechar notícia"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-16/9 bg-slate-100">
              <img
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {selectedArticle.title}
              </h2>

              <p className="text-sm font-medium text-slate-600 leading-relaxed border-b border-slate-200 pb-4">
                {selectedArticle.summary}
              </p>

              <div className="text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                {Array.isArray(selectedArticle.content)
                  ? selectedArticle.content.join('\n\n')
                  : selectedArticle.content || selectedArticle.summary}
              </div>

              {/* Attached Files / Downloads Section */}
              {selectedArticle.attachments && selectedArticle.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Arquivos e Documentos Anexados ({selectedArticle.attachments.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedArticle.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.dataUrl}
                        download={att.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#061a38] text-[#38bdf8] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
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

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Por {selectedArticle.author}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
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
