/**
 * Pure utility functions for Admin Authentication, Rate-limiting,
 * Session Management, and Data Integrity checks.
 */

export interface AdminCredentials {
  email: string;
  passwordHashOrPlain: string;
  securityPin: string;
}

export interface RateLimitState {
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms
}

export interface AdminSession {
  token: string;
  adminEmail: string;
  loginTime: number; // epoch ms
  expiresAt: number; // epoch ms
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  adminEmail: string;
  details?: string;
}

const DEFAULT_LOCKOUT_MS = 3 * 60 * 1000; // 3 minutes lockout
const MAX_ATTEMPTS = 5;
const DEFAULT_SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Validates admin credentials against stored credentials considering rate-limiting.
 */
export function validateAdminCredentials(
  inputEmail: string,
  inputPass: string,
  storedCreds: AdminCredentials,
  rateLimit: RateLimitState,
  currentTime: number = Date.now()
): {
  success: boolean;
  reason?: string;
  updatedRateLimit: RateLimitState;
  session?: AdminSession;
} {
  // Check if currently locked out
  if (rateLimit.lockedUntil && currentTime < rateLimit.lockedUntil) {
    const remainingSec = Math.ceil((rateLimit.lockedUntil - currentTime) / 1000);
    return {
      success: false,
      reason: `Acesso temporariamente bloqueado por excesso de tentativas incorretas. Aguarde ${remainingSec}s.`,
      updatedRateLimit: rateLimit,
    };
  }

  const cleanEmail = inputEmail.trim().toLowerCase();
  const targetEmail = storedCreds.email.trim().toLowerCase();

  const isMatch = cleanEmail === targetEmail && inputPass === storedCreds.passwordHashOrPlain;

  if (isMatch) {
    // Generate session
    const session: AdminSession = {
      token: `vtl-adm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      adminEmail: cleanEmail,
      loginTime: currentTime,
      expiresAt: currentTime + DEFAULT_SESSION_DURATION_MS,
    };

    return {
      success: true,
      updatedRateLimit: {
        failedAttempts: 0,
        lockedUntil: null,
      },
      session,
    };
  }

  // Failed attempt
  const newAttempts = rateLimit.failedAttempts + 1;
  const isNowLocked = newAttempts >= MAX_ATTEMPTS;
  const lockedUntil = isNowLocked ? currentTime + DEFAULT_LOCKOUT_MS : null;

  return {
    success: false,
    reason: isNowLocked
      ? `Credenciais incorretas. Limite de ${MAX_ATTEMPTS} tentativas atingido! Acesso bloqueado por 3 minutos.`
      : `E-mail ou senha de administrador inválidos. Restam ${MAX_ATTEMPTS - newAttempts} tentativa(s).`,
    updatedRateLimit: {
      failedAttempts: newAttempts,
      lockedUntil,
    },
  };
}

/**
 * Checks if an administrative session is active and not expired.
 */
export function isSessionValid(
  session: AdminSession | null,
  currentTime: number = Date.now()
): boolean {
  if (!session || !session.token || !session.adminEmail) {
    return false;
  }
  return currentTime < session.expiresAt;
}

/**
 * Validates the 6-digit administrative PIN for critical/destructive actions.
 */
export function validateSecurityPin(inputPin: string, storedPin: string): boolean {
  if (!inputPin || !storedPin) return false;
  return inputPin.trim() === storedPin.trim();
}

/**
 * Validates password strength for admin password changes.
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: 'fraca' | 'media' | 'forte';
  reason?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      score: 'fraca',
      reason: 'A senha deve ter no mínimo 8 caracteres.',
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      score: 'fraca',
      reason: 'A senha deve conter pelo menos uma letra e um número.',
    };
  }

  if (password.length >= 10 && hasSpecial) {
    return { valid: true, score: 'forte' };
  }

  return { valid: true, score: 'media' };
}

/**
 * Formats an audit log entry for administrative activity tracking.
 */
export function createAuditLogEntry(
  action: string,
  adminEmail: string,
  details?: string,
  timestamp: string = new Date().toISOString()
): AuditLogEntry {
  return {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp,
    action,
    adminEmail,
    details,
  };
}

/**
 * Validates the schema of an imported backup JSON file.
 */
export function validateBackupSchema(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['O arquivo de backup não é um JSON válido.'] };
  }

  if (!data.clubInfo || typeof data.clubInfo !== 'object') {
    errors.push('Campo obrigatório "clubInfo" ausente.');
  }
  if (!Array.isArray(data.newsArticles)) {
    errors.push('Campo obrigatório "newsArticles" deve ser uma lista.');
  }
  if (!Array.isArray(data.events)) {
    errors.push('Campo obrigatório "events" deve ser uma lista.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
