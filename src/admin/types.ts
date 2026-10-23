export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'financeiro'
  | 'parceiro';

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

export type ProjectEnrollmentStatus =
  | 'pendente'
  | 'em_analise'
  | 'aprovada'
  | 'lista_espera'
  | 'recusada';

export type AdminSectionId =
  | 'visao-geral'
  | 'inscricoes'
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
