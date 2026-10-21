/**
 * Gerador de Payload Oficial PIX (Padrão EMVCo / BRCode Banco Central do Brasil)
 * Calcula CRC16-CCITT (Polinômio 0x1021, Valor Inicial 0xFFFF)
 */
import QRCode from 'qrcode';

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

export function computeCrc16(payload: string): string {
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
  // Only numeric keys (CNPJ/CPF/phone) lose punctuation; e-mail and random (EVP) keys keep dots and hyphens
  const trimmedKey = pixKey.trim();
  const cleanKey = /^\+?[\d.\/\-\s()]+$/.test(trimmedKey)
    ? (trimmedKey.startsWith('+') ? '+' : '') + trimmedKey.replace(/\D/g, '')
    : trimmedKey;

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
 * Encodes the BR Code into a real, bank-scannable QR matrix (true = dark module).
 */
export function generatePixQrMatrix(payload: string): boolean[][] {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: 'M' });
  return Array.from({ length: modules.size }, (_, r) =>
    Array.from({ length: modules.size }, (_, c) => Boolean(modules.get(r, c)))
  );
}
