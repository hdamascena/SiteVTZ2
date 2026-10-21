import test from 'node:test';
import assert from 'node:assert/strict';
import { computeCrc16, generatePixBrCode, generatePixQrMatrix } from './pixPayload.ts';

const build = (pixKey: string) =>
  generatePixBrCode({ pixKey, beneficiaryName: 'Vitalizar', city: 'Cariacica', amount: 50 });

test('CRC16 matches the CCITT-FALSE check value and the Banco Central sample', () => {
  assert.equal(computeCrc16('123456789'), '29B1');
  assert.equal(
    computeCrc16(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304'
    ),
    '1D3D'
  );
});

test('PIX key keeps e-mail dots and EVP hyphens, strips CNPJ and phone punctuation', () => {
  assert.ok(build('contato@projetovitalizar.com.br').includes('0131contato@projetovitalizar.com.br'));
  assert.ok(build('123e4567-e12b-12d1-a456-426655440000').includes('0136123e4567-e12b-12d1-a456-426655440000'));
  assert.ok(build('63.083.068/0001-00').includes('011463083068000100'));
  assert.ok(build('+55 (27) 99999-9999').includes('0114+5527999999999'));
});

test('BR Code ends with its own CRC and encodes into a real QR matrix', () => {
  const code = build('63083068000100');
  assert.equal(code.slice(-4), computeCrc16(code.slice(0, -4)));
  assert.ok(code.includes('540550.00'));

  const matrix = generatePixQrMatrix(code);
  assert.ok(matrix.length >= 21 && (matrix.length - 17) % 4 === 0);
  assert.ok(matrix.every((row) => row.length === matrix.length));
  assert.deepEqual(matrix[0].slice(0, 7), [true, true, true, true, true, true, true]);
});
