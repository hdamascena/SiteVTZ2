import React, { useState, useEffect } from 'react';
import {
  Search,
  Menu,
  X,
  Lock,
  ArrowUpRight,
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenInscricoes: () => void;
  onOpenSubpage: (pageId: string, subId?: string) => void;
  onOpenAdmin?: () => void;
  activePageId?: string | null;
}

const NAV_LINKS = [
  { id: 'home', label: 'Início' },
  { id: 'a-vitalizar', label: 'Quem Somos' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'portal-comunidade', label: 'Apoie PIX & Jogos' },
  { id: 'eventos', label: 'Agenda' },
  { id: 'noticias', label: 'Notícias' },
  { id: 'patrocinadores', label: 'Parceiros' },
  { id: 'transparencia', label: 'Transparência' },
  { id: 'contato', label: 'Contato' },
];

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenInscricoes,
  onOpenSubpage,
  onOpenAdmin,
  activePageId = 'home',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (id: string) => {
    onOpenSubpage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-[#04142b]/95 backdrop-blur-md border-b border-sky-900/60 shadow-lg'
          : 'bg-[#061a38] border-b border-sky-900/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Lockup with New 3D Metallic Crest */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="group relative z-50 flex items-center gap-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-xl py-1 cursor-pointer shrink-0"
          aria-label="Ir para a página inicial da Associação Esportiva Vitalizar"
        >
          <img
            src="/logo.png"
            alt="Brasão Associação Esportiva Vitalizar"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain translate-y-2.5 sm:translate-y-3 pt-0 -mt-[21px] -ml-[13px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-105 shrink-0"
          />
          <span className="font-display text-white font-extrabold text-xl sm:text-2xl tracking-tight whitespace-nowrap shrink-0">
            VITALIZAR
          </span>
        </button>

        {/* Zone 2: Single-Line Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-5 xl:gap-6"
          aria-label="Navegação principal"
        >
          {NAV_LINKS.map((link) => {
            const isActive = (activePageId || 'home') === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`text-sm font-semibold transition-colors py-1.5 whitespace-nowrap shrink-0 cursor-pointer relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[#38bdf8] after:transition-all ${
                  isActive
                    ? 'text-white after:w-full'
                    : 'text-sky-100/80 hover:text-white after:w-0 hover:after:w-full'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Utility Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Buscar no portal"
            title="Buscar no portal"
          >
            <Search className="w-4 h-4" />
          </button>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Painel Administrativo"
            >
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenInscricoes}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0ea5e9] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-md shadow-sky-950/50"
          >
            <span>Inscrever-se</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-sky-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu de navegação'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-[#061a38] text-white h-full shadow-2xl border-l border-sky-900/60 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-sky-900/60">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Brasão Vitalizar"
                    className="w-11 h-11 object-contain shrink-0"
                  />
                  <span className="font-display font-extrabold text-lg text-white">
                    VITALIZAR
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-sky-300 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1" aria-label="Menu mobile">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleLinkClick(link.id)}
                    className="w-full text-left py-3 px-3 text-sm font-semibold text-sky-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{link.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-sky-900/60 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenInscricoes();
                  }}
                  className="w-full py-3 px-4 bg-[#0284c7] hover:bg-[#0ea5e9] text-white font-semibold text-xs rounded-xl text-center transition-colors cursor-pointer"
                >
                  Inscrever-se em Modalidades
                </button>

                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-sky-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Painel Administrativo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-sky-900/60 text-xs text-sky-300/80 space-y-1">
              <p className="font-semibold text-white">Associação Esportiva Vitalizar</p>
              <p>Rio Marinho · Cariacica/ES</p>
              <p>(27) 9774-0773 · (27) 9297-9056</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
