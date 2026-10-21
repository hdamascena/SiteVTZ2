import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { DataClassificationLevel } from '../types.ts';
import { maskEmail, maskPhone } from '../permissions.ts';

export const SeloSensivel: React.FC<{ level?: DataClassificationLevel }> = ({
  level = 'sensível',
}) => {
  if (level === 'público') return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase ${
        level === 'sensível'
          ? 'text-amber-700 dark:text-amber-400'
          : 'text-slate-500 dark:text-slate-400'
      }`}
      title={
        level === 'sensível'
          ? 'Dado pessoal ou de menor protegido pela LGPD'
          : 'Informação de uso interno da equipe'
      }
    >
      <Lock className="w-2.5 h-2.5" />
      <span>{level === 'sensível' ? 'Sensível' : 'Interno'}</span>
    </span>
  );
};

interface CampoSensivelMascaraProps {
  value?: string;
  type: 'phone' | 'email';
  itemLabel: string;
  collection: string;
  itemId: string;
  onRevealAudit: (params: {
    action: string;
    collection: string;
    itemId: string;
    details: string;
  }) => void;
}

export const CampoSensivelMascara: React.FC<CampoSensivelMascaraProps> = ({
  value,
  type,
  itemLabel,
  collection,
  itemId,
  onRevealAudit,
}) => {
  const [revealed, setRevealed] = useState(false);

  if (!value) {
    return <span className="text-slate-400 text-xs">Não informado</span>;
  }

  const masked = type === 'phone' ? maskPhone(value) : maskEmail(value);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!revealed) {
      onRevealAudit({
        action: 'REVELAR_DADO_SENSIVEL',
        collection,
        itemId,
        details: `Visualizou ${type === 'phone' ? 'telefone' : 'e-mail'} sensível de "${itemLabel}".`,
      });
    }
    setRevealed((prev) => !prev);
  };

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
      <span className={revealed ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
        {revealed ? value : masked}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-sky-700 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
        title={revealed ? 'Ocultar dado sensível' : 'Mostrar dado sensível (registrado no log)'}
      >
        {revealed ? (
          <>
            <EyeOff className="w-3 h-3" />
            <span>ocultar</span>
          </>
        ) : (
          <>
            <Eye className="w-3 h-3" />
            <span>mostrar</span>
          </>
        )}
      </button>
    </span>
  );
};

interface CampoTextoProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'url' | 'textarea';
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  classification?: DataClassificationLevel;
  rows?: number;
  helpText?: string;
}

export const CampoTexto: React.FC<CampoTextoProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  placeholder,
  required,
  disabled,
  classification = 'público',
  rows = 3,
  helpText,
}) => {
  const isTextarea = type === 'textarea' || multiline;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        {classification !== 'público' && <SeloSensivel level={classification} />}
      </div>

      {isTextarea ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
        />
      )}

      {helpText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helpText}</p>
      )}
    </div>
  );
};
