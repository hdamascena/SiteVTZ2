/**
 * Gerador de Payload Oficial PIX (Padrão EMVCo / BRCode Banco Central do Brasil)
 * Calcula CRC16-CCITT (Polinômio 0x1021, Valor Inicial 0xFFFF)
 */

function formatEmvField(id: string, value: string): string {
  const cleanVal = value;
  const len = cleanVal.length.toString().padStart(2, '0');
  return `${id}${len}${cleanVal}`;
}

function sanitizeAscii(text: string, maxLen: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLen);
}

function computeCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixBrCodeOptions {
  pixKey: string;
  beneficiaryName: string;
  city: string;
  amount?: number;
  txId?: string;
  description?: string;
}

export function generatePixBrCode({
  pixKey,
  beneficiaryName,
  city,
  amount,
  txId = 'VITALIZAR2026',
  description = 'APOIO VITALIZAR',
}: PixBrCodeOptions): string {
  // Normalize CNPJ / Phone key if needed
  const cleanKey = pixKey.trim().replace(/\.\s*/g, '').replace(/[/-]/g, '');

  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const keyField = formatEmvField('01', cleanKey);
  const descField = description
    ? formatEmvField('02', sanitizeAscii(description, 25))
    : '';
  const merchantAccountInfo = formatEmvField('26', `${gui}${keyField}${descField}`);

  const payloadFormatIndicator = formatEmvField('00', '01');
  const merchantCategoryCode = formatEmvField('52', '0000');
  const transactionCurrency = formatEmvField('53', '986'); // BRL

  const amountField =
    typeof amount === 'number' && amount > 0
      ? formatEmvField('54', amount.toFixed(2))
      : '';

  const countryCode = formatEmvField('58', 'BR');
  const merchantName = formatEmvField(
    '59',
    sanitizeAscii(beneficiaryName || 'ASSOC ESPORTIVA VITALIZAR', 25)
  );
  const merchantCity = formatEmvField('60', sanitizeAscii(city || 'CARIACICA', 15));

  const cleanTxId = sanitizeAscii(txId, 25).replace(/\s+/g, '') || 'VITALIZAR2026';
  const additionalDataField = formatEmvField('62', formatEmvField('05', cleanTxId));

  const basePayload = [
    payloadFormatIndicator,
    merchantAccountInfo,
    merchantCategoryCode,
    transactionCurrency,
    amountField,
    countryCode,
    merchantName,
    merchantCity,
    additionalDataField,
    '6304',
  ].join('');

  const crc = computeCrc16(basePayload);
  return `${basePayload}${crc}`;
}

/**
 * Generates a deterministic 25x25 QR matrix pattern from a payload string
 * for clean, instant SVG rendering with finder patterns.
 */
export function generateDeterministicQrMatrix(payload: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[rr][cc] = isBorder || isCenter;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment pattern at bottom-right
  const alignCenter = size - 7;
  for (let r = alignCenter - 2; r <= alignCenter + 2; r++) {
    for (let c = alignCenter - 2; c <= alignCenter + 2; c++) {
      reserved[r][c] = true;
      const isEdge =
        r === alignCenter - 2 ||
        r === alignCenter + 2 ||
        c === alignCenter - 2 ||
        c === alignCenter + 2;
      const isDot = r === alignCenter && c === alignCenter;
      matrix[r][c] = isEdge || isDot;
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Fill remaining cells deterministically from payload hash
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let idx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        const charCode = payload.charCodeAt(idx % payload.length) || 65;
        const mix = ((hash >>> (idx % 16)) ^ (charCode * (r + 3) * (c + 5))) & 3;
        matrix[r][c] = mix === 0 || mix === 2;
        idx++;
      }
    }
  }

  return matrix;
}
