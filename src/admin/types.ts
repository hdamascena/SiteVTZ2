export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'professor'
  | 'financeiro'
  | 'parceiro'
  | 'apoiador'
  | 'visitante';

export type DataClassificationLevel = 'público' | 'interno' | 'sensível';

export interface AdminUserProfile {
  uid: string;
  email: string;
  nome: string;
  role: AdminRole;
  projectIds: string[];
  ativo: boolean;
  criadoEm: string;
  criadoPor: string;
}

export interface AdminInviteRecord {
  email: string;
  nome: string;
  role: AdminRole;
  projectIds: string[];
  criadoEm: string;
  criadoPor: string;
}

export interface ParticipantPrivateRecord {
  id: string;
  projectId: string;
  participantName: string;
  birthDate?: string;
  weight?: string;
  height?: string;
  bmi?: string;
  nextfitCode?: string;
  planName?: string;
  schoolInfo?: {
    schoolName: string;
    grade: string;
    turn: 'Matutino' | 'Vespertino' | 'Integral';
    attendanceRate: string;
  };
  responsibleName?: string;
  phone?: string;
  email?: string;
  healthNotes?: string;
  updatedAt?: string;
}

export type ProjectEnrollmentStatus =
  | 'pendente'
  | 'em_analise'
  | 'aprovada'
  | 'lista_espera'
  | 'recusada';

export type AdminSectionId =
  | 'visao-geral'
  | 'inscricoes'
  | 'chamada'
  | 'participantes'
  | 'projetos'
  | 'noticias'
  | 'eventos'
  | 'galeria'
  | 'patrocinadores'
  | 'polos'
  | 'transparencia'
  | 'comunidade'
  | 'configuracoes'
  | 'usuarios'
  | 'auditoria';
