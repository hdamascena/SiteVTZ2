import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Star,
} from 'lucide-react';
import type { DataClassificationLevel } from '../types.ts';
import type { AttachedFile } from '../../types/index.ts';
import { maskEmail, maskPhone } from '../permissions.ts';
import {
  processImageUpload,
  processAttachmentUpload,
} from '../../utils/fileUpload.ts';

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

interface CampoUploadImagemProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  disabled?: boolean;
  classification?: DataClassificationLevel;
  helpText?: string;
}

export const CampoUploadImagem: React.FC<CampoUploadImagemProps> = ({
  label,
  value,
  onChange,
  disabled,
  classification = 'público',
  helpText = 'Envie uma foto do seu dispositivo (compressão automática) ou cole um link de imagem.',
}) => {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const compressedDataUrl = await processImageUpload(file, 1100, 0.8);
      onChange(compressedDataUrl);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Falha ao processar imagem.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {classification !== 'público' && <SeloSensivel level={classification} />}
      </div>

      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt="Pré-visualização"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0 bg-slate-50 dark:bg-slate-800/40">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}

        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!disabled && (
              <label className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Processando...' : 'Enviar Imagem do Dispositivo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={disabled || uploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            {value && !disabled && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          <input
            type="text"
            value={value?.startsWith('data:') ? '' : value || ''}
            disabled={disabled}
            placeholder={
              value?.startsWith('data:')
                ? 'Imagem carregada do dispositivo (ou cole uma URL externa aqui)'
                : 'Ou cole a URL da imagem (https://...)'
            }
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
          />

          {value?.startsWith('data:') && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Arquivo de imagem otimizado pronto para salvar.</span>
            </p>
          )}
          {errorMsg && <p className="text-[11px] text-rose-600">{errorMsg}</p>}
          {helpText && !errorMsg && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {helpText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface CampoUploadDocumentoProps {
  label: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  downloadUrl?: string;
  disabled?: boolean;
  onFileProcessed: (meta: {
    fileName: string;
    fileSize: string;
    fileType: string;
    dataUrl: string;
    suggestedTitle: string;
  }) => void;
  onUrlChange?: (url: string) => void;
}

export const CampoUploadDocumento: React.FC<CampoUploadDocumentoProps> = ({
  label,
  fileName,
  fileSize,
  fileType,
  downloadUrl,
  disabled,
  onFileProcessed,
  onUrlChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const attached = await processAttachmentUpload(file);
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ');
      onFileProcessed({
        fileName: attached.name,
        fileSize: attached.size,
        fileType: attached.type,
        dataUrl: attached.dataUrl,
        suggestedTitle: cleanTitle,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao anexar documento.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {!disabled && (
        <label className="w-full p-3 border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 flex items-center justify-between gap-3 cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-[#0284c7] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                {uploading
                  ? 'Carregando arquivo...'
                  : fileName
                  ? `Arquivo anexado: ${fileName}`
                  : 'Clique para enviar PDF, Planilha (XLSX/CSV), Word ou Imagem'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {fileSize && fileType
                  ? `${fileType} · ${fileSize} · Pronto para publicação`
                  : 'Preenche automaticamente tipo, tamanho e link de download (máx. 4,5 MB)'}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-[#0284c7] text-white text-[11px] font-bold rounded-lg shrink-0">
            Escolher Arquivo
          </span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
            disabled={disabled || uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {onUrlChange && (
        <input
          type="text"
          disabled={disabled}
          value={downloadUrl?.startsWith('data:') ? '' : downloadUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={
            downloadUrl?.startsWith('data:')
              ? 'Documento anexado diretamente (ou cole link externo do Google Drive/PDF)'
              : 'Ou cole link externo para download (https://...)'
          }
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        />
      )}

      {errorMsg && <p className="text-[11px] text-rose-600">{errorMsg}</p>}
    </div>
  );
};

interface CampoUploadMultiplasFotosProps {
  photos: { url: string; caption: string }[];
  coverUrl?: string;
  disabled?: boolean;
  onChangePhotos: (photos: { url: string; caption: string }[]) => void;
  onSelectCover?: (url: string) => void;
}

export const CampoUploadMultiplasFotos: React.FC<
  CampoUploadMultiplasFotosProps
> = ({ photos, coverUrl, disabled, onChangePhotos, onSelectCover }) => {
  const [uploading, setUploading] = useState(false);

  const handleMultiFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);
    e.target.value = '';
    setUploading(true);
    try {
      const uploadedItems: { url: string; caption: string }[] = [];
      for (const file of files) {
        const dataUrl = await processImageUpload(file, 1100, 0.8);
        const cleanCaption = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]+/g, ' ');
        uploadedItems.push({ url: dataUrl, caption: cleanCaption });
      }
      const nextPhotos = [...(photos || []), ...uploadedItems];
      onChangePhotos(nextPhotos);
      if (
        onSelectCover &&
        uploadedItems.length > 0 &&
        (!coverUrl || coverUrl.includes('unsplash.com'))
      ) {
        onSelectCover(uploadedItems[0].url);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
            Fotos do Álbum ({photos?.length || 0})
          </span>
          <span className="text-[11px] text-slate-500">
            Envie várias fotos de uma só vez com compressão automática.
          </span>
        </div>
        {!disabled && (
          <label className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>
              {uploading ? 'Comprimindo fotos...' : 'Adicionar Fotos em Lote'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={disabled || uploading}
              onChange={handleMultiFiles}
              className="hidden"
            />
          </label>
        )}
      </div>

      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {photos.map((photo, idx) => (
            <div
              key={`${idx}-${photo.url.slice(0, 24)}`}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2.5"
            >
              <img
                src={photo.url}
                alt={photo.caption || `Foto ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-md object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  disabled={disabled}
                  value={photo.caption}
                  placeholder="Legenda da foto..."
                  onChange={(e) => {
                    const next = photos.map((p, i) =>
                      i === idx ? { ...p, caption: e.target.value } : p
                    );
                    onChangePhotos(next);
                  }}
                  className="w-full px-2 py-1 text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                {!disabled && (
                  <div className="flex items-center justify-between text-[10px]">
                    {onSelectCover && (
                      <button
                        type="button"
                        onClick={() => onSelectCover(photo.url)}
                        className={`font-semibold inline-flex items-center gap-1 cursor-pointer ${
                          coverUrl === photo.url
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-sky-600 dark:text-sky-400 hover:underline'
                        }`}
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>
                          {coverUrl === photo.url ? 'Capa atual' : 'Usar como capa'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onChangePhotos(photos.filter((_, i) => i !== idx))
                      }
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-2">
          Nenhuma foto interna adicionada ao álbum ainda.
        </p>
      )}
    </div>
  );
};

interface CampoUploadAnexosProps {
  label?: string;
  attachments?: AttachedFile[];
  disabled?: boolean;
  onChange: (next: AttachedFile[]) => void;
}

export const CampoUploadAnexos: React.FC<CampoUploadAnexosProps> = ({
  label = 'Arquivos e Documentos Anexos (PDF, Planilhas, Regulamentos)',
  attachments = [],
  disabled,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);
    e.target.value = '';
    setUploading(true);
    try {
      const added: AttachedFile[] = [];
      for (const f of files) {
        const item = await processAttachmentUpload(f);
        added.push(item);
      }
      onChange([...attachments, ...added]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
        {!disabled && (
          <label className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>{uploading ? 'Anexando...' : 'Anexar Arquivos'}</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
              disabled={disabled || uploading}
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                  {att.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  ({att.type} · {att.size})
                </span>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(attachments.filter((x) => x.id !== att.id))
                  }
                  className="text-rose-600 hover:underline text-[11px] font-semibold shrink-0 cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

