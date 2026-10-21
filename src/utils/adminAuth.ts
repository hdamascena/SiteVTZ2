/**
 * Pure utility functions for Admin Session Management, audit logs
 * and Data Integrity checks. Authentication itself is Firebase Auth.
 */

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
  role?: string;
  collection?: string;
  itemId?: string;
  beforeSummary?: string;
  afterSummary?: string;
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
 * Formats an audit log entry for administrative activity tracking.
 */
export function createAuditLogEntry(
  action: string,
  adminEmail: string,
  details?: string,
  timestamp: string = new Date().toISOString(),
  extra?: {
    role?: string;
    collection?: string;
    itemId?: string;
    beforeSummary?: string;
    afterSummary?: string;
  }
): AuditLogEntry {
  return {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp,
    action,
    adminEmail,
    details,
    ...(extra?.role ? { role: extra.role } : {}),
    ...(extra?.collection ? { collection: extra.collection } : {}),
    ...(extra?.itemId ? { itemId: extra.itemId } : {}),
    ...(extra?.beforeSummary ? { beforeSummary: extra.beforeSummary } : {}),
    ...(extra?.afterSummary ? { afterSummary: extra.afterSummary } : {}),
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
