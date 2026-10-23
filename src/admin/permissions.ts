import type {
  AdminRole,
  AdminSectionId,
  AdminUserProfile,
  DataClassificationLevel,
} from './types.ts';
import type { ProjectParticipant, VitalizarProject } from '../types/index.ts';
import type { EventRsvpRecord } from '../context/ClubDataContext.tsx';

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin (Dono)',
  admin: 'Admin (Coordenação)',
  editor: 'Editor (Vitrine & Comunicação)',
  financeiro: 'Financeiro (Transparência & PIX)',
  parceiro: 'Parceiro & Olheiro',
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Acesso total à vitrine institucional, relacionamentos, equipe e auditoria.',
  admin: 'Gestão completa da vitrine, atletas, projetos, interessados e comunidade. Não altera super_admin.',
  editor: 'Gestão da vitrine de atletas, projetos, notícias, agenda, galeria, parceiros, polos e avisos.',
  financeiro: 'Portal da transparência, relatórios fiscais, chave PIX e conferência de apoios.',
  parceiro: 'Acompanhamento de marcas parceiras, relatórios de transparência e captação técnica (olheiros).',
};

export function normalizeAdminRole(raw?: string | null): AdminRole {
  if (
    raw === 'super_admin' ||
    raw === 'admin' ||
    raw === 'editor' ||
    raw === 'financeiro' ||
    raw === 'parceiro'
  ) {
    return raw;
  }
  return 'parceiro';
}

// Roles removed in the showcase pivot: their accounts stay inactive until an admin re-invites them
export function isRetiredRole(raw?: string | null): boolean {
  return raw === 'visitante' || raw === 'apoiador' || raw === 'professor';
}

export const ROLE_SECTIONS: Record<AdminRole, AdminSectionId[]> = {
  super_admin: [
    'visao-geral',
    'inscricoes',
    'participantes',
    'projetos',
    'noticias',
    'eventos',
    'galeria',
    'patrocinadores',
    'polos',
    'transparencia',
    'comunidade',
    'configuracoes',
    'usuarios',
    'auditoria',
  ],
  admin: [
    'visao-geral',
    'inscricoes',
    'participantes',
    'projetos',
    'noticias',
    'eventos',
    'galeria',
    'patrocinadores',
    'polos',
    'transparencia',
    'comunidade',
    'configuracoes',
    'usuarios',
    'auditoria',
  ],
  editor: [
    'visao-geral',
    'participantes',
    'projetos',
    'noticias',
    'eventos',
    'galeria',
    'patrocinadores',
    'polos',
    'configuracoes',
  ],
  financeiro: ['visao-geral', 'transparencia', 'comunidade', 'configuracoes'],
  parceiro: ['visao-geral', 'patrocinadores', 'transparencia', 'comunidade'],
};

export const DATA_CLASSIFICATION: Record<string, DataClassificationLevel> = {
  // Público (Vitrine)
  news_articles: 'público',
  events: 'público',
  gallery_albums: 'público',
  sponsors: 'público',
  facility_polos: 'público',
  transparency_docs: 'público',
  club_info: 'público',
  projects: 'público',
  // Interno
  admins: 'interno',
  admin_invites: 'interno',
  audit_logs: 'interno',
  // Relacionamento & Captação
  rsvps: 'sensível',
  contact_messages: 'sensível',
  scout_inquiries: 'sensível',
  donation_pledges: 'sensível',
  volunteer_applications: 'sensível',
};

export function isStaffRole(role: AdminRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'editor' ||
    role === 'financeiro'
  );
}

export function canAccessSection(role: AdminRole, section: AdminSectionId): boolean {
  return (ROLE_SECTIONS[role] || []).includes(section);
}

export function canExportSensitiveCsv(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'editor';
}

export function canImportCsv(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'editor';
}

export function canDeleteRecords(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'editor';
}

export function canViewAuditLogs(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canManageProject(profile: AdminUserProfile | null): boolean {
  if (!profile || !profile.ativo) return false;
  return (
    profile.role === 'super_admin' ||
    profile.role === 'admin' ||
    profile.role === 'editor'
  );
}

export function getReadablePrivateCollections(role: AdminRole): string[] {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return [
        'rsvps',
        'contact_messages',
        'scout_inquiries',
        'donation_pledges',
        'volunteer_applications',
        'audit_logs',
      ];
    case 'financeiro':
      return ['donation_pledges'];
    case 'parceiro':
      return ['scout_inquiries'];
    case 'editor':
    default:
      return [];
  }
}

export function canRoleWriteCollection(role: AdminRole, collectionName: string): boolean {
  if (role === 'super_admin' || role === 'admin') return true;
  if (collectionName === 'audit_logs') return true;

  switch (role) {
    case 'editor':
      return [
        'club_info',
        'site_settings',
        'news_articles',
        'sponsors',
        'events',
        'projects',
        'gallery_albums',
        'facility_polos',
      ].includes(collectionName);
    case 'financeiro':
      return [
        'transparency_docs',
        'site_settings',
        'donation_pledges',
      ].includes(collectionName);
    case 'parceiro':
      return ['sponsors', 'scout_inquiries'].includes(collectionName);
    default:
      return false;
  }
}

export function canRoleDeleteFromCollection(role: AdminRole, collectionName: string): boolean {
  if (collectionName === 'audit_logs') return false;
  if (role === 'super_admin') return true;
  if (role === 'admin') return collectionName !== 'admins';
  if (role === 'editor') {
    return ['news_articles', 'sponsors', 'events', 'gallery_albums', 'facility_polos'].includes(
      collectionName
    );
  }
  if (role === 'financeiro') {
    return collectionName === 'transparency_docs';
  }
  return false;
}

export function maskPhone(phone?: string): string {
  if (!phone) return 'Não informado';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  const last4 = digits.slice(-4);
  const ddd = digits.length >= 10 ? `(${digits.slice(0, 2)}) ` : '';
  return `${ddd}*****-${last4}`;
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'Não informado';
  const [user, domain] = email.split('@');
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

/**
 * Ensures athlete records in the showcase only carry public sports showcase attributes
 * without private parent/health/nextfit data.
 */
export function sanitizeShowcaseParticipant(
  participant: ProjectParticipant
): ProjectParticipant {
  return {
    ...participant,
    nextfitCode: '',
    planName: '',
    bmi: '',
    birthDate: '',
    height: '',
    weight: '',
    schoolInfo: {
      schoolName: '',
      grade: '',
      turn: 'Matutino',
      attendanceRate: 'Regular',
    },
  };
}

export function resolveProjectIdFromRsvp(
  rsvp: Pick<EventRsvpRecord, 'projectId' | 'eventId' | 'eventTitle'>,
  projects: Pick<VitalizarProject, 'id' | 'name'>[] = []
): string | null {
  if (rsvp.projectId) return rsvp.projectId;
  if (rsvp.eventId?.startsWith('inscricao-')) {
    return rsvp.eventId.replace('inscricao-', '');
  }
  const titleLower = (rsvp.eventTitle || '').toLowerCase();
  const matched = projects.find(
    (p) =>
      titleLower.includes(p.name.toLowerCase()) ||
      rsvp.eventId?.toLowerCase().includes(p.id.toLowerCase())
  );
  return matched ? matched.id : null;
}

export function filterPrivateCollectionsForUser(
  rawCollections: Record<string, any[]>,
  profile: AdminUserProfile | null | undefined
): Record<string, any[]> {
  const empty: Record<string, any[]> = {
    rsvps: [],
    contact_messages: [],
    scout_inquiries: [],
    donation_pledges: [],
    volunteer_applications: [],
    audit_logs: [],
  };
  if (!profile || !profile.ativo) return empty;

  const role = profile.role;
  if (role === 'super_admin' || role === 'admin') {
    return {
      rsvps: rawCollections.rsvps || [],
      contact_messages: rawCollections.contact_messages || [],
      scout_inquiries: rawCollections.scout_inquiries || [],
      donation_pledges: rawCollections.donation_pledges || [],
      volunteer_applications: rawCollections.volunteer_applications || [],
      audit_logs: rawCollections.audit_logs || [],
    };
  }

  if (role === 'financeiro') {
    return {
      ...empty,
      donation_pledges: rawCollections.donation_pledges || [],
    };
  }

  if (role === 'parceiro') {
    return {
      ...empty,
      scout_inquiries: rawCollections.scout_inquiries || [],
    };
  }

  return empty;
}
