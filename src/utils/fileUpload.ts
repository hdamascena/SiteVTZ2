import type { AttachedFile } from '../types/index.ts';

async function uploadToSqlIfAuthenticated(params: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}): Promise<string> {
  try {
    if (typeof window === 'undefined') return params.dataUrl;
    const { auth } = await import('../firebase.ts');
    const user = auth.currentUser;
    if (!user) return params.dataUrl;
    const token = await user.getIdToken();
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) return params.dataUrl;
    const data = await res.json();
    return typeof data?.url === 'string' && data.url ? data.url : params.dataUrl;
  } catch {
    return params.dataUrl;
  }
}

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
 * Compresses and resizes an uploaded image file via HTML5 Canvas and stores it in Cloud SQL
 * when authenticated so records stay below Firestore's 1 MB document limit.
 */
export async function processImageUpload(
  file: File,
  maxWidth = 1280,
  quality = 0.82
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
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

  const fileId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return uploadToSqlIfAuthenticated({
    id: fileId,
    fileName: file.name || `${fileId}.jpg`,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size || rawDataUrl.length,
    dataUrl: rawDataUrl,
  });
}

/**
 * Processes any uploaded document or media file into an AttachedFile record.
 * Images are automatically compressed; documents up to 15MB are stored in Cloud SQL.
 */
export async function processAttachmentUpload(file: File): Promise<AttachedFile> {
  const MAX_RAW_SIZE = 15 * 1024 * 1024; // 15 MB limit with Cloud SQL storage
  if (file.size > MAX_RAW_SIZE && !file.type.startsWith('image/')) {
    throw new Error('O arquivo excede o limite máximo de 15 MB.');
  }

  const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let dataUrl: string;
  if (file.type.startsWith('image/')) {
    dataUrl = await processImageUpload(file, 1280, 0.82);
  } else {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo anexado.'));
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
    });
    dataUrl = await uploadToSqlIfAuthenticated({
      id: fileId,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      dataUrl: rawDataUrl,
    });
  }

  return {
    id: fileId,
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

export const TRANSPARENCY_FINANCE_SAMPLE_CSV = [
  'Tipo;Categoria / Destinacao;Percentual (%);Valor (R$);Descricao',
  'Destinacao;Material Esportivo e Uniformes;42;126000;Bolas oficiais, coletes, redes e kits de treino para os polos',
  'Destinacao;Equipe Tecnica e Professores;33;99000;Remuneracao de coordenadores, professores de educacao fisica e monitores',
  'Destinacao;Manutencao de Polos e Logistica;15;45000;Transporte para festivais, lanches e conservacao das quadras',
  'Destinacao;Gestao Administrativa e Contabil;10;30000;Contabilidade, certidoes, seguros e manutencao institucional',
  'Receita;Termos de Fomento e Emendas Publicas;55;165000;Repasses oficiais vinculados a projetos esportivos aprovados',
  'Receita;Empresas Parceiras e Patrocinios;30;90000;Apoio privado direto e cotas de patrocinio social',
  'Receita;Doacoes PIX e Comunidade;15;45000;Contribuicoes espontaneas de apoiadores e campanhas solidarias',
].join('\r\n');

export interface ParsedTransparencyFinanceCsv {
  allocationBreakdown: {
    label: string;
    percentage: number;
    amount: number;
    description: string;
  }[];
  revenueSources: {
    label: string;
    percentage: number;
    amount: number;
  }[];
  totalRevenue: number;
  totalInvested: number;
  error?: string;
}

/**
 * Parses a semicolon or comma separated CSV containing financial allocation ("Destinacao"/"Despesa")
 * and revenue sources ("Receita"/"Origem") to feed the Transparency charts.
 */
export function parseTransparencyFinancialCsv(
  rawText: string
): ParsedTransparencyFinanceCsv {
  const lines = rawText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      allocationBreakdown: [],
      revenueSources: [],
      totalRevenue: 0,
      totalInvested: 0,
      error: 'A planilha financeira precisa ter cabeçalho e pelo menos 1 linha de dados.',
    };
  }

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const allocationBreakdown: ParsedTransparencyFinanceCsv['allocationBreakdown'] = [];
  const revenueSources: ParsedTransparencyFinanceCsv['revenueSources'] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 4) continue;
    const [rawType, label, rawPct, rawAmount, description = ''] = cols;
    if (!label) continue;

    const pct = Number(rawPct.replace('%', '').replace(',', '.')) || 0;
    const amount =
      Number(
        rawAmount
          .replace(/[R$\s]/g, '')
          .replace(/\.(?=\d{3})/g, '')
          .replace(',', '.')
      ) || 0;

    const normType = rawType
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (normType.includes('receita') || normType.includes('origem') || normType.includes('entrada')) {
      revenueSources.push({
        label,
        percentage: pct,
        amount,
      });
    } else {
      allocationBreakdown.push({
        label,
        percentage: pct,
        amount,
        description: description || 'Aplicação direta nas atividades estatutárias.',
      });
    }
  }

  if (allocationBreakdown.length === 0 && revenueSources.length === 0) {
    return {
      allocationBreakdown: [],
      revenueSources: [],
      totalRevenue: 0,
      totalInvested: 0,
      error: 'Nenhuma linha financeira válida foi identificada no arquivo.',
    };
  }

  const totalInvested = allocationBreakdown.reduce((acc, item) => acc + item.amount, 0);
  const totalRevenue =
    revenueSources.reduce((acc, item) => acc + item.amount, 0) || totalInvested;

  return {
    allocationBreakdown,
    revenueSources,
    totalRevenue,
    totalInvested,
  };
}

export const ENROLLMENT_SAMPLE_CSV = [
  'Nome do Aluno;Idade;Responsavel Legal;Telefone / WhatsApp;E-mail;Turma / Turno',
  'Participante Exemplo 1;12;Responsável Exemplo 1;(00) 00000-0000;exemplo1@dominio.com;Manhã (08h00 às 10h30)',
  'Participante Exemplo 2;14;Responsável Exemplo 2;(00) 00000-0000;exemplo2@dominio.com;Tarde (14h00 às 16h30)',
].join('\r\n');

export interface ParsedEnrollmentCsvRow {
  studentName: string;
  studentAge: number;
  responsibleName: string;
  phone: string;
  email: string;
  modalityOrClass: string;
}

export function parseEnrollmentsCsv(rawText: string): {
  rows: ParsedEnrollmentCsvRow[];
  error?: string;
} {
  const lines = rawText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [],
      error: 'O arquivo CSV precisa conter o cabeçalho e pelo menos uma inscrição.',
    };
  }

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rows: ParsedEnrollmentCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
    const studentName = cols[0] || '';
    if (!studentName) continue;
    const studentAge = Number(cols[1]) || 12;
    const responsibleName = cols[2] || '';
    const phone = cols[3] || '(27) 99999-0000';
    const email = cols[4] || '';
    const modalityOrClass = cols[5] || 'Manhã (08h00 às 10h30)';
    rows.push({
      studentName,
      studentAge,
      responsibleName,
      phone,
      email,
      modalityOrClass,
    });
  }

  if (rows.length === 0) {
    return { rows: [], error: 'Nenhum aluno válido encontrado na planilha.' };
  }

  return { rows };
}

/**
 * Triggers a browser download of a UTF-8 CSV template with BOM for Excel compatibility
 */
export function downloadCsvTemplate(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

