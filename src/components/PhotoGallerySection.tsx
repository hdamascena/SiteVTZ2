import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowUpRight,
  Camera,
} from 'lucide-react';
import { useClubData, INITIAL_GALLERY_ALBUMS } from '../context/ClubDataContext.tsx';
import type { PastEventPhoto } from '../types/index.ts';

export type { PastEventPhoto };
export const PAST_EVENTS_GALLERY: PastEventPhoto[] = INITIAL_GALLERY_ALBUMS;

const EASE_EDITORIAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const PhotoGallerySection: React.FC = () => {
  const { galleryAlbums } = useClubData();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeAlbum, setActiveAlbum] = useState<PastEventPhoto | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const categories = [
    'Todos',
    'Festivais Esportivos',
    'Categorias de Base',
    'Saúde & Vida Ativa',
    'Inclusão & Comunidade',
  ];

  const albumsSource = galleryAlbums && galleryAlbums.length > 0 ? galleryAlbums : INITIAL_GALLERY_ALBUMS;

  const filteredAlbums =
    selectedCategory === 'Todos'
      ? albumsSource
      : albumsSource.filter((item) => item.category === selectedCategory);

  const openLightbox = (album: PastEventPhoto, initialIndex = 0) => {
    setActiveAlbum(album);
    setPhotoIndex(initialIndex);
    setIsZoomed(false);
  };

  const closeLightbox = useCallback(() => {
    setActiveAlbum(null);
    setIsZoomed(false);
  }, []);

  const nextPhoto = useCallback(() => {
    if (!activeAlbum) return;
    setPhotoIndex((prev) => (prev + 1) % activeAlbum.albumPhotos.length);
    setIsZoomed(false);
  }, [activeAlbum]);

  const prevPhoto = useCallback(() => {
    if (!activeAlbum) return;
    setPhotoIndex(
      (prev) => (prev - 1 + activeAlbum.albumPhotos.length) % activeAlbum.albumPhotos.length
    );
    setIsZoomed(false);
  }, [activeAlbum]);

  useEffect(() => {
    if (!activeAlbum) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlbum, closeLightbox, nextPhoto, prevPhoto]);

  const currentPhoto = activeAlbum?.albumPhotos[photoIndex];

  return (
    <section
      className="py-16 bg-gradient-to-b from-[#041226] to-[#071d3b] text-white border-b border-sky-900/50"
      aria-label="Galeria de Fotos de Projetos e Eventos"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Segmented Filter Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6"
        >
          <div>
            <p className="text-xs font-semibold text-[#38bdf8] tracking-wide flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Memória Esportiva · Cariacica/ES</span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Galeria de Projetos e Eventos Realizados
            </h2>
            <p className="text-sm text-sky-100/80 mt-1.5 max-w-2xl">
              Clique em qualquer álbum para abrir os registros fotográficos em tela cheia com zoom e navegação entre fotos.
            </p>
          </div>

          {/* Interactive Filter Tabs */}
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15 self-start"
            role="tablist"
            aria-label="Filtrar galeria por categoria"
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0284c7] text-white shadow-sm'
                      : 'text-sky-100/80 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Rich 4-Column Photo Album Grid with Staggered Scroll Reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAlbums.map((album, idx) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: EASE_EDITORIAL,
              }}
              onClick={() => openLightbox(album, 0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(album, 0);
                }
              }}
              aria-label={`Abrir álbum: ${album.title}`}
              className="group text-left bg-[#0b2548]/85 backdrop-blur-xl rounded-2xl overflow-hidden border border-sky-400/20 hover:border-[#38bdf8]/60 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer hover:-translate-y-1"
            >
              <div>
                <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041226] via-transparent to-transparent opacity-85" />

                  <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-sky-200 font-medium">
                    <span>{album.category}</span>
                    <span className="tabular-nums font-bold text-white">
                      {album.albumPhotos.length} fotos
                    </span>
                  </div>
                </div>

                <div className="p-5 pb-3">
                  <div className="text-xs text-[#38bdf8] font-medium">
                    {album.date} · {album.location.split('·')[0].trim()}
                  </div>

                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#38bdf8] transition-colors line-clamp-2 mt-1.5 leading-snug">
                    {album.title}
                  </h3>

                  <p className="text-xs text-sky-100/75 mt-2 line-clamp-2 leading-relaxed">
                    {album.caption}
                  </p>
                </div>
              </div>

              {/* Mini Filmstrip Thumbnail Row & Action */}
              <div className="px-5 pb-5 pt-3 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {album.albumPhotos.slice(0, 3).map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(album, pIdx);
                      }}
                      className="aspect-16/10 rounded-lg overflow-hidden border border-white/15 hover:border-[#38bdf8] transition-colors"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-[#38bdf8]">
                  <span>Abrir álbum em tela cheia</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeAlbum && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria de fotos: ${activeAlbum.title}`}
        >
          {/* Lightbox Header */}
          <div className="px-4 sm:px-8 py-4 border-b border-slate-800 flex items-center justify-between text-white z-10">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 text-xs text-sky-400">
                <span>{activeAlbum.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Foto {photoIndex + 1} de {activeAlbum.albumPhotos.length}
                </span>
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {activeAlbum.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                aria-label={isZoomed ? 'Reduzir zoom' : 'Ampliar imagem'}
                title={isZoomed ? 'Reduzir zoom' : 'Ampliar imagem'}
              >
                {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={closeLightbox}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                aria-label="Fechar galeria em tela cheia"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Stage */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 select-none">
            {activeAlbum.albumPhotos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-[#0284c7] text-white border border-slate-700 shadow-xl transition-colors cursor-pointer"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="flex flex-col items-center justify-center max-w-5xl w-full h-full">
              <div className="relative flex items-center justify-center overflow-hidden max-h-[64vh] w-full">
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption}
                  referrerPolicy="no-referrer"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`max-h-[62vh] max-w-full object-contain rounded-lg transition-transform duration-200 cursor-zoom-in ${
                    isZoomed ? 'scale-125 cursor-zoom-out' : 'scale-100'
                  }`}
                />
              </div>

              <div className="mt-4 max-w-3xl text-center px-4">
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  {currentPhoto.caption}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {activeAlbum.location} · {activeAlbum.date}
                </p>
              </div>
            </div>

            {activeAlbum.albumPhotos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-[#0284c7] text-white border border-slate-700 shadow-xl transition-colors cursor-pointer"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Filmstrip Thumbnails */}
          <div className="px-4 sm:px-8 py-3.5 border-t border-slate-800 flex items-center justify-center gap-3 overflow-x-auto">
            {activeAlbum.albumPhotos.map((photo, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setPhotoIndex(index);
                  setIsZoomed(false);
                }}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  photoIndex === index
                    ? 'border-[#38bdf8] opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-90'
                }`}
                aria-label={`Ver foto ${index + 1}`}
              >
                <img
                  src={photo.url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
