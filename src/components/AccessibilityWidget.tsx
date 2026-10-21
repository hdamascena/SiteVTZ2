import React, { useState, useEffect } from 'react';
import {
  Accessibility,
  ZoomIn,
  ZoomOut,
  SunMoon,
  Underline,
  RotateCcw,
  X,
  Type,
} from 'lucide-react';

export const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(0); // -1, 0, 1, 2
  const [highContrast, setHighContrast] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);
  const [readableFont, setReadableFont] = useState(false);

  useEffect(() => {
    // Apply Font Size
    const root = document.documentElement;
    if (fontSizeLevel === 1) {
      root.style.fontSize = '110%';
    } else if (fontSizeLevel === 2) {
      root.style.fontSize = '120%';
    } else if (fontSizeLevel === -1) {
      root.style.fontSize = '90%';
    } else {
      root.style.fontSize = '100%';
    }

    // Apply High Contrast
    if (highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }

    // Apply Underline Links
    if (underlineLinks) {
      document.body.classList.add('underline-links-mode');
    } else {
      document.body.classList.remove('underline-links-mode');
    }

    // Apply Readable Font
    if (readableFont) {
      document.body.classList.add('dyslexia-font-mode');
    } else {
      document.body.classList.remove('dyslexia-font-mode');
    }
  }, [fontSizeLevel, highContrast, underlineLinks, readableFont]);

  const resetAll = () => {
    setFontSizeLevel(0);
    setHighContrast(false);
    setUnderlineLinks(false);
    setReadableFont(false);
  };

  return (
    <div className="fixed right-4 bottom-24 z-40">
      {/* Floating Trigger Button in Celeste Blue */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer border-2 border-white focus:outline-none focus:ring-4 focus:ring-sky-300"
        title="Menu de Acessibilidade"
        aria-label="Menu de Acessibilidade"
      >
        <Accessibility className="w-6 h-6" />
      </button>

      {/* Floating Accessibility Panel */}
      {isOpen && (
        <div className="absolute right-0 bottom-14 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-[#0284c7]" />
              <span className="font-bold text-xs uppercase tracking-wider text-[#0a1e36]">
                Acessibilidade Vitalizar
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              aria-label="Fechar acessibilidade"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Font Size controls */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase">
                Tamanho do Texto
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSizeLevel(Math.max(-1, fontSizeLevel - 1))}
                  className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>A-</span>
                </button>
                <button
                  onClick={() => setFontSizeLevel(0)}
                  className="px-2 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Normal
                </button>
                <button
                  onClick={() => setFontSizeLevel(Math.min(2, fontSizeLevel + 1))}
                  className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>A+</span>
                </button>
              </div>
            </div>

            {/* High Contrast */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                highContrast
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <SunMoon className="w-4 h-4" />
                <span>Alto Contraste</span>
              </span>
              <span className="text-[10px] font-bold uppercase">{highContrast ? 'ON' : 'OFF'}</span>
            </button>

            {/* Underline links */}
            <button
              onClick={() => setUnderlineLinks(!underlineLinks)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                underlineLinks
                  ? 'bg-sky-50 text-[#0284c7] border-[#0284c7]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Underline className="w-4 h-4" />
                <span>Sublinhar Links</span>
              </span>
              <span className="text-[10px] font-bold uppercase">{underlineLinks ? 'ON' : 'OFF'}</span>
            </button>

            {/* Readable font */}
            <button
              onClick={() => setReadableFont(!readableFont)}
              className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                readableFont
                  ? 'bg-sky-50 text-[#0284c7] border-[#0284c7]'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span>Fonte Legível</span>
              </span>
              <span className="text-[10px] font-bold uppercase">{readableFont ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Reset button */}
          <div className="mt-3 pt-2 border-t border-slate-100">
            <button
              onClick={resetAll}
              className="w-full py-1.5 text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
