import type {
  AdminRole,
  AdminSectionId,
  AdminUserProfile,
  DataClassificationLevel,
  ParticipantPrivateRecord,
} from './types.ts';
import type { ProjectParticipant, VitalizarProject } from '../types/index.ts';
import type { EventRsvpRecord } from '../context/ClubDataContext.tsx';

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin (Dono)',
  admin: 'Admin (Coordenação)',
  editor: 'Editor (Comunicação)',
  professor: 'Professor (Turmas)',
  financeiro: 'Financeiro (Conferência)',
  parceiro: 'Parceiro Institucional',
  apoiador: 'Apoiador Vitalizar',
  visitante: 'Visitante',
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Acesso total ao sistema, dados sensíveis, usuários e perfis.',
  admin: 'Todo o conteúdo, inscrições e dados pessoais. Não cria nem altera super_admin.',
  editor: 'Notícias, eventos, galeria, patrocinadores, banners e páginas. Sem dados pessoais.',
  professor: 'Apenas projetos vinculados (projectIds): participantes, chamada e inscrições da turma.',
  financeiro: 'Transparência, configuração do PIX e registros de doação (leitura e conferência).',
  parceiro: 'Acompanhamento de impacto social, marca parceira, transparência e captação técnica.',
  apoiador: 'Perfil concedido aos visitantes que realizaram doação, com selo oficial e inscrições.',
  visitante: 'Acompanhamento de inscrições nos projetos, eventos e envio de apoio comunitário.',
};

export const ROLE_SECTIONS: Record<AdminRole, AdminSectionId[]> = {
  super_admin: [
    'visao-geral',
    'inscricoes',
    'chamada',
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
    'chamada',
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
    'projetos',
    'noticias',
    'eventos',
    'galeria',
    'patrocinadores',
    'polos',
    'configuracoes',
  ],
  professor: ['visao-geral', 'chamada', 'participantes', 'inscricoes', 'projetos'],
  financeiro: ['visao-geral', 'transparencia', 'comunidade', 'configuracoes'],
  parceiro: ['visao-geral', 'patrocinadores', 'transparencia', 'comunidade', 'projetos'],
  apoiador: ['visao-geral', 'inscricoes', 'transparencia', 'comunidade'],
  visitante: ['visao-geral', 'inscricoes', 'comunidade'],
};

export const DATA_CLASSIFICATION: Record<string, DataClassificationLevel> = {
  // Público
  news_articles: 'público',
  events: 'público',
  gallery_albums: 'público',
  sponsors: 'público',
  facility_polos: 'público',
  transparency_docs: 'público',
  club_info: 'público',
  // Interno
  admins: 'interno',
  admin_invites: 'interno',
  audit_logs: 'interno',
  // Sensível (LGPD - menores, contatos, doações, chamada, saúde)
  participant_private: 'sensível',
  attendance_sessions: 'sensível',
  rsvps: 'sensível',
  contact_messages: 'sensível',
  scout_inquiries: 'sensível',
  donation_pledges: 'sensível',
  volunteer_applications: 'sensível',
};

export function canAccessSection(role: AdminRole, section: AdminSectionId): boolean {
  return (ROLE_SECTIONS[role] || []).includes(section);
}

export function canExportSensitiveCsv(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canImportCsv(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canDeleteRecords(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'editor';
}

export function canViewAuditLogs(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canManageProject(profile: AdminUserProfile | null, projectId: string): boolean {
  if (!profile || !profile.ativo) return false;
  if (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'editor') {
    return true;
  }
  if (profile.role === 'professor') {
    return (profile.projectIds || []).includes(projectId);
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
 * Strips sensitive LGPD fields (health/BMI/weight/height, birthDate, schoolInfo, nextfitCode)
 * from the public project participant and returns both the sanitized public participant
 * and the private record for `/participant_private/{id}`.
 */
export function splitParticipantPublicAndPrivate(
  participant: ProjectParticipant,
  projectId: string
): {
  publicParticipant: ProjectParticipant;
  privateRecord: ParticipantPrivateRecord;
} {
  const privateRecord: ParticipantPrivateRecord = {
    id: participant.id,
    projectId,
    participantName: participant.name,
    birthDate: participant.birthDate || '',
    weight: participant.weight || '',
    height: participant.height || '',
    bmi: participant.bmi || '',
    nextfitCode: participant.nextfitCode || '',
    planName: participant.planName || '',
    schoolInfo: participant.schoolInfo
      ? { ...participant.schoolInfo }
      : {
          schoolName: '',
          grade: '',
          turn: 'Matutino',
          attendanceRate: '100%',
        },
    updatedAt: new Date().toISOString(),
  };

  // Public document keeps only public showcase fields (no birthDate, weight, height, bmi, school name, or nextfitCode)
  const publicParticipant: ProjectParticipant = {
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
      attendanceRate: participant.schoolInfo?.attendanceRate || 'Regular',
    },
  };

  return { publicParticipant, privateRecord };
}

export function mergeParticipantWithPrivate(
  participant: ProjectParticipant,
  priv?: ParticipantPrivateRecord
): ProjectParticipant {
  if (!priv) return participant;
  return {
    ...participant,
    birthDate: priv.birthDate || participant.birthDate || '',
    weight: priv.weight || participant.weight || '',
    height: priv.height || participant.height || '',
    bmi: priv.bmi || participant.bmi || '',
    nextfitCode: priv.nextfitCode || participant.nextfitCode || '',
    planName: priv.planName || participant.planName || '',
    schoolInfo: priv.schoolInfo?.schoolName
      ? priv.schoolInfo
      : participant.schoolInfo,
  };
}

export function resolveProjectIdFromRsvp(
  rsvp: EventRsvpRecord,
  projects: VitalizarProject[]
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
