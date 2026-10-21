import React from 'react';
import { X, Check, Loader2 } from 'lucide-react';

export type SaveIndicatorState = 'idle' | 'saving' | 'saved' | 'error';

interface PainelLateralProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  saveState?: SaveIndicatorState;
  onSave?: (e: React.FormEvent) => void;
  saveLabel?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const PainelLateral: React.FC<PainelLateralProps> = ({
  isOpen,
  open,
  onClose,
  title,
  subtitle,
  saveState = 'idle',
  onSave,
  saveLabel = 'Salvar Item',
  footer,
  children,
}) => {
  const visible = isOpen ?? open ?? false;
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {saveState === 'saving' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando…</span>
              </span>
            )}
            {saveState === 'saved' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Salvo</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar painel lateral"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {onSave ? (
          <form onSubmit={onSave} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {children}
            </div>
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveState === 'saving'}
                className="px-4 py-2 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                {saveState === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando…</span>
                  </>
                ) : (
                  <span>{saveLabel}</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
            {footer && (
              <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                {footer}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
