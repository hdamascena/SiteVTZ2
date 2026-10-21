import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmarExclusaoProps {
  isOpen?: boolean;
  open?: boolean;
  itemName?: string;
  itemTypeLabel?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmarExclusao: React.FC<ConfirmarExclusaoProps> = ({
  isOpen,
  open,
  itemName,
  itemTypeLabel = 'item',
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}) => {
  const [typedName, setTypedName] = useState('');

  const visible = isOpen ?? open ?? false;
  if (!visible) return null;

  const requiresTyping = Boolean(itemName && itemName.trim().length > 0);
  const isMatch = requiresTyping
    ? typedName.trim().toLowerCase() === (itemName || '').trim().toLowerCase()
    : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatch) return;
    setTypedName('');
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {title || `Confirmar exclusão de ${itemTypeLabel}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setTypedName('');
              onCancel();
            }}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {description || (
            <>
              Para evitar exclusões acidentais, digite o nome exato abaixo para confirmar. Você ainda terá{' '}
              <strong>10 segundos para desfazer</strong> após confirmar.
            </>
          )}
        </p>

        {requiresTyping && (
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 select-all">
            {itemName}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiresTyping && (
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={`Digite "${itemName}" para confirmar`}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              autoFocus
            />
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setTypedName('');
                onCancel();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isMatch}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmLabel || `Excluir ${itemTypeLabel}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
