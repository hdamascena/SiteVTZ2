import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  inferFileTypeBadge,
  parseTransparencyFinancialCsv,
  parseEnrollmentsCsv,
  TRANSPARENCY_FINANCE_SAMPLE_CSV,
  ENROLLMENT_SAMPLE_CSV,
} from './fileUpload.ts';

test('formatFileSize and inferFileTypeBadge format metadata accurately', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2 KB');
  assert.equal(inferFileTypeBadge('balancete_2025.pdf', 'application/pdf'), 'PDF');
  assert.equal(inferFileTypeBadge('alunos.csv', 'text/csv'), 'CSV');
  assert.equal(inferFileTypeBadge('foto.png', 'image/png'), 'IMAGEM');
});

test('parseTransparencyFinancialCsv parses allocation and revenue rows from sample CSV', () => {
  const parsed = parseTransparencyFinancialCsv(TRANSPARENCY_FINANCE_SAMPLE_CSV);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.allocationBreakdown.length, 4);
  assert.equal(parsed.revenueSources.length, 3);
  assert.equal(parsed.totalInvested, 300000);
  assert.equal(parsed.totalRevenue, 300000);
});

test('parseEnrollmentsCsv parses student enrollment rows from sample CSV', () => {
  const parsed = parseEnrollmentsCsv(ENROLLMENT_SAMPLE_CSV);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].studentName, 'Participante Exemplo 1');
  assert.equal(parsed.rows[0].studentAge, 12);
});
