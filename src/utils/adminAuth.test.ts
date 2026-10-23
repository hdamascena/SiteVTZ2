import { test } from 'node:test';
import assert from 'node:assert';
import {
  isSessionValid,
  createAuditLogEntry,
  validateBackupSchema,
} from './adminAuth.ts';

test('isSessionValid checks expiration correctly', () => {
  const session = {
    token: 'tok-123',
    adminEmail: 'admin@vitalizar.org.br',
    loginTime: 1000,
    expiresAt: 5000,
  };

  assert.strictEqual(isSessionValid(session, 3000), true);
  assert.strictEqual(isSessionValid(session, 6000), false);
  assert.strictEqual(isSessionValid(null, 3000), false);
});

test('createAuditLogEntry formats log with metadata', () => {
  const log = createAuditLogEntry('EDIT_EVENT', 'admin@vitalizar.org.br', 'Evento Futsal alterado');
  assert.ok(log.id.startsWith('log-'));
  assert.strictEqual(log.action, 'EDIT_EVENT');
  assert.strictEqual(log.adminEmail, 'admin@vitalizar.org.br');
  assert.strictEqual(log.details, 'Evento Futsal alterado');
});

test('validateBackupSchema validates JSON structure', () => {
  const valid = validateBackupSchema({
    clubInfo: { name: 'Vitalizar' },
    newsArticles: [],
    events: [],
  });
  assert.strictEqual(valid.valid, true);

  const invalid = validateBackupSchema({ clubInfo: {} });
  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.length > 0);
});

import {
  canAccessSection,
  canExportSensitiveCsv,
  maskPhone,
  maskEmail,
  sanitizeShowcaseParticipant,
  normalizeAdminRole,
  isRetiredRole,
  canRoleWriteCollection,
} from '../admin/permissions.ts';

test('retired roles are inactive and never upgraded', () => {
  assert.strictEqual(isRetiredRole('professor'), true);
  assert.strictEqual(isRetiredRole('visitante'), true);
  assert.strictEqual(isRetiredRole('editor'), false);
  assert.strictEqual(normalizeAdminRole('professor'), 'parceiro');
  assert.strictEqual(canRoleWriteCollection('parceiro', 'news_articles'), false);
  assert.strictEqual(canRoleWriteCollection('parceiro', 'admins'), false);
});

test('RBAC permissions and LGPD masking', () => {
  assert.strictEqual(canExportSensitiveCsv('super_admin'), true);
  assert.strictEqual(canExportSensitiveCsv('admin'), true);
  assert.strictEqual(canExportSensitiveCsv('editor'), true);
  assert.strictEqual(canExportSensitiveCsv('parceiro'), false);
  assert.strictEqual(canAccessSection('editor', 'participantes'), true);
  assert.strictEqual(canAccessSection('editor', 'usuarios'), false);
  assert.strictEqual(canAccessSection('parceiro', 'comunidade'), true);
  assert.strictEqual(canAccessSection('financeiro', 'transparencia'), true);

  assert.strictEqual(maskPhone('(27) 99823-1144'), '(27) *****-1144');
  assert.strictEqual(maskEmail('joao.silva@gmail.com'), 'jo***@gmail.com');

  const sample: any = {
    id: 'p-1',
    name: 'Atleta Teste',
    birthDate: '2012-05-10',
    weight: '52kg',
    height: '1,62m',
    bmi: '19.8',
    nextfitCode: 'NF-100',
    schoolInfo: { schoolName: 'EMEF Cariacica', grade: '8º ano', turn: 'Matutino', attendanceRate: '98%' },
  };
  const publicParticipant = sanitizeShowcaseParticipant(sample);
  assert.strictEqual(publicParticipant.birthDate, '');
  assert.strictEqual(publicParticipant.weight, '');
  assert.strictEqual(publicParticipant.schoolInfo.schoolName, '');
});

