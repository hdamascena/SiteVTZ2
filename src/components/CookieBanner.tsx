import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface CookieBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacy }) => {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const isConsentGiven = localStorage.getItem('vitalizar_cookie_consent');
    if (!isConsentGiven) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('vitalizar_cookie_consent', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#061424] text-white py-3.5 px-4 sm:px-6 shadow-2xl border-t border-sky-950 animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-200">
          <ShieldCheck className="w-5 h-5 text-[#38bdf8] flex-shrink-0" />
          <p className="leading-snug">
            Nós usamos cookies e outras tecnologias semelhantes para melhorar a sua experiência em nossa plataforma e garantir a transparência e segurança dos serviços da Associação Esportiva Vitalizar. Conheça nossa{' '}
            <button
              onClick={onOpenPrivacy}
              className="text-[#38bdf8] underline hover:text-white font-semibold cursor-pointer"
            >
              Política de Privacidade & LGPD
            </button>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAccept}
            className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider rounded-md transition-all active:scale-95 cursor-pointer shadow border border-sky-300/40"
          >
            Aceitar
          </button>
          <button
            onClick={() => {
              localStorage.setItem('vitalizar_cookie_consent', 'dismissed');
              setAccepted(true);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
            aria-label="Dispensar aviso de cookies"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
