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
