import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateAdminCredentials,
  isSessionValid,
  validateSecurityPin,
  validatePasswordStrength,
  createAuditLogEntry,
  validateBackupSchema,
} from './adminAuth.ts';
import type { AdminCredentials, RateLimitState } from './adminAuth.ts';

const mockCreds: AdminCredentials = {
  email: 'admin@vitalizar.org.br',
  passwordHashOrPlain: 'vitalizar2026!',
  securityPin: '140926',
};

const initialRateLimit: RateLimitState = {
  failedAttempts: 0,
  lockedUntil: null,
};

test('validateAdminCredentials grants session on valid email & password', () => {
  const result = validateAdminCredentials(
    'admin@vitalizar.org.br',
    'vitalizar2026!',
    mockCreds,
    initialRateLimit,
    1000000
  );

  assert.strictEqual(result.success, true);
  assert.ok(result.session);
  assert.strictEqual(result.session.adminEmail, 'admin@vitalizar.org.br');
  assert.strictEqual(result.updatedRateLimit.failedAttempts, 0);
  assert.strictEqual(result.updatedRateLimit.lockedUntil, null);
});

test('validateAdminCredentials rejects incorrect password and increments failure count', () => {
  const result = validateAdminCredentials(
    'admin@vitalizar.org.br',
    'wrong-password',
    mockCreds,
    initialRateLimit,
    1000000
  );

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.updatedRateLimit.failedAttempts, 1);
  assert.strictEqual(result.updatedRateLimit.lockedUntil, null);
});

test('validateAdminCredentials locks out after 5 consecutive failed attempts', () => {
  let rateState: RateLimitState = { failedAttempts: 4, lockedUntil: null };
  const currentTime = 1000000;

  const result = validateAdminCredentials(
    'admin@vitalizar.org.br',
    'wrong-5',
    mockCreds,
    rateState,
    currentTime
  );

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.updatedRateLimit.failedAttempts, 5);
  assert.ok(result.updatedRateLimit.lockedUntil !== null);
  assert.strictEqual(result.updatedRateLimit.lockedUntil, currentTime + 3 * 60 * 1000);
});

test('validateAdminCredentials prevents login while lockout period is active', () => {
  const lockedState: RateLimitState = {
    failedAttempts: 5,
    lockedUntil: 1000000 + 180000,
  };

  const result = validateAdminCredentials(
    'admin@vitalizar.org.br',
    'vitalizar2026!',
    mockCreds,
    lockedState,
    1000000 + 60000 // Only 1 minute has passed
  );

  assert.strictEqual(result.success, false);
  assert.ok(result.reason?.includes('bloqueado'));
});

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

test('validateSecurityPin correctly checks master 6-digit pin', () => {
  assert.strictEqual(validateSecurityPin('140926', '140926'), true);
  assert.strictEqual(validateSecurityPin(' 140926 ', '140926'), true);
  assert.strictEqual(validateSecurityPin('000000', '140926'), false);
  assert.strictEqual(validateSecurityPin('', '140926'), false);
});

test('validatePasswordStrength checks complexity', () => {
  const tooShort = validatePasswordStrength('123');
  assert.strictEqual(tooShort.valid, false);

  const noNumber = validatePasswordStrength('abcdefghij');
  assert.strictEqual(noNumber.valid, false);

  const good = validatePasswordStrength('Vitalizar2026!');
  assert.strictEqual(good.valid, true);
  assert.strictEqual(good.score, 'forte');
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
