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
  splitParticipantPublicAndPrivate,
} from '../admin/permissions.ts';

test('RBAC permissions and LGPD masking', () => {
  assert.strictEqual(canExportSensitiveCsv('super_admin'), true);
  assert.strictEqual(canExportSensitiveCsv('admin'), true);
  assert.strictEqual(canExportSensitiveCsv('professor'), false);
  assert.strictEqual(canExportSensitiveCsv('editor'), false);
  assert.strictEqual(canAccessSection('professor', 'chamada'), true);
  assert.strictEqual(canAccessSection('professor', 'usuarios'), false);
  assert.strictEqual(canAccessSection('apoiador', 'inscricoes'), true);

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
  const { publicParticipant, privateRecord } = splitParticipantPublicAndPrivate(sample, 'proj-1');
  assert.strictEqual(publicParticipant.birthDate, '');
  assert.strictEqual(publicParticipant.weight, '');
  assert.strictEqual(publicParticipant.schoolInfo.schoolName, '');
  assert.strictEqual(privateRecord.birthDate, '2012-05-10');
  assert.strictEqual(privateRecord.weight, '52kg');
  assert.strictEqual(privateRecord.schoolInfo?.schoolName, 'EMEF Cariacica');
});

