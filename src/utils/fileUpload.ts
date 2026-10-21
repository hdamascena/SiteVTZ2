import type { AttachedFile } from '../types/index.ts';

/**
 * Formats byte count into a human-readable string (e.g. 245 KB, 1.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  const kb = bytes / k;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Infers a clean uppercase document badge from file name or MIME type
 */
export function inferFileTypeBadge(fileName: string, mimeType: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase() || '';
  if (ext === 'PDF' || mimeType.includes('pdf')) return 'PDF';
  if (['DOC', 'DOCX'].includes(ext) || mimeType.includes('word')) return 'DOCX';
  if (['XLS', 'XLSX', 'CSV'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
    return ext === 'CSV' ? 'CSV' : 'XLSX';
  }
  if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(ext) || mimeType.startsWith('image/')) {
    return 'IMAGEM';
  }
  return ext || 'ARQUIVO';
}

/**
 * Compresses and resizes an uploaded image file via HTML5 Canvas so it can be
 * stored reliably in localStorage without hitting browser quota limits.
 */
export function processImageUpload(
  file: File,
  maxWidth = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // Keep SVG as-is
      if (file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Preserve transparency for PNGs if reasonably small, otherwise use JPEG for compact storage
          const outputMime =
            file.type === 'image/png' && file.size < 450 * 1024 ? 'image/png' : 'image/jpeg';
          if (outputMime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(outputMime, quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes any uploaded document or media file into an AttachedFile record.
 * Images are automatically compressed; documents up to 4MB are encoded as Data URLs.
 */
export async function processAttachmentUpload(file: File): Promise<AttachedFile> {
  const MAX_RAW_SIZE = 4.5 * 1024 * 1024; // 4.5 MB safety guard for localStorage
  if (file.size > MAX_RAW_SIZE && !file.type.startsWith('image/')) {
    throw new Error('O arquivo excede o limite de 4,5 MB para armazenamento local.');
  }

  let dataUrl: string;
  if (file.type.startsWith('image/')) {
    dataUrl = await processImageUpload(file, 1280, 0.82);
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo anexado.'));
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
    });
  }

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: formatFileSize(file.size),
    type: inferFileTypeBadge(file.name, file.type),
    mimeType: file.type || 'application/octet-stream',
    dataUrl,
    uploadedAt: new Date().toLocaleDateString('pt-BR'),
  };
}

const MONTHS_SHORT_PT = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

const MONTHS_FULL_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Converts a YYYY-MM-DD date string into dayNumber, monthShort, and formattedDate in Portuguese
 */
export function parseEventIsoDate(isoDate: string): {
  dayNumber: string;
  monthShort: string;
  formattedDate: string;
} {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return {
      dayNumber: '01',
      monthShort: 'JAN',
      formattedDate: isoDate,
    };
  }
  const year = parts[0];
  const monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
  const day = parts[2].padStart(2, '0');

  return {
    dayNumber: day,
    monthShort: MONTHS_SHORT_PT[monthIdx] || 'JAN',
    formattedDate: `${parseInt(day, 10)} de ${MONTHS_FULL_PT[monthIdx]} de ${year}`,
  };
}
