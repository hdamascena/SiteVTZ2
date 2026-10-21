import React from 'react';
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Clock,
  Phone,
  ArrowUp,
  Lock,
} from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';

interface FooterProps {
  onOpenContact: () => void;
  onOpenPrivacy: () => void;
  onOpenSubpage: (pageId: string, subId?: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenContact,
  onOpenPrivacy,
  onOpenSubpage,
  onOpenAdmin,
}) => {
  const { clubInfo } = useClubData();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 items-start">
          {/* Col 1: Brand & Mission (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo Associação Esportiva Vitalizar"
                className="w-12 h-12 object-contain shrink-0"
              />
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-white">
                  VITALIZAR
                </h3>
                <p className="text-xs text-sky-400 font-medium">
                  Associação Esportiva Vitalizar
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Entidade civil sem fins lucrativos dedicada à formação esportiva, saúde preventiva, cidadania e inclusão comunitária em Cariacica/ES.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={clubInfo.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#0284c7] flex items-center justify-center transition-colors text-slate-300 hover:text-white"
                aria-label="Facebook Vitalizar"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={clubInfo.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#0284c7] flex items-center justify-center transition-colors text-slate-300 hover:text-white"
                aria-label="Instagram Vitalizar"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={clubInfo.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#0284c7] flex items-center justify-center transition-colors text-slate-300 hover:text-white"
                aria-label="YouTube Vitalizar"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onOpenContact}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#0284c7] flex items-center justify-center transition-colors text-slate-300 hover:text-white cursor-pointer"
                aria-label="Fale Conosco"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Col 2: Navigation & Institutional (4 cols) */}
          <div className="lg:col-span-4 space-y-3 lg:pl-6 lg:border-l lg:border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Dados Institucionais
            </h4>

            <div className="space-y-2 text-xs text-slate-400">
              <p className="text-slate-200 font-medium">
                {clubInfo.fullName} · CNPJ {clubInfo.cnpj}
              </p>
              <p>Presidente: {clubInfo.president}</p>

              <div className="flex items-start gap-2 pt-1">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  {clubInfo.address} · CEP {clubInfo.cep} · {clubInfo.municipality}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Atendimento: {clubInfo.hours.secretaria}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Contact & Support (4 cols) */}
          <div className="lg:col-span-4 space-y-3 lg:pl-6 lg:border-l lg:border-slate-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Atendimento & Ouvidoria
            </h4>

            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{clubInfo.phones.join(' · ')}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{clubInfo.email}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Enviar Mensagem
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="bg-slate-950 py-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Portal da Transparência
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenSubpage('a-vitalizar', 'estatuto-social')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Estatuto Social
            </button>
            {onOpenAdmin && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin</span>
                </button>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} Associação Esportiva Vitalizar</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors text-xs font-medium cursor-pointer"
            aria-label="Voltar ao topo da página"
          >
            <span>Topo</span>
            <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
      </div>
    </footer>
  );
};
