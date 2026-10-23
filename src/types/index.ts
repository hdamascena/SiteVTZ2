export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface NavSubItem {
  id: string;
  label: string;
  description?: string;
  isPdf?: boolean;
  pdfUrl?: string;
}

export interface NavItem {
  id: string;
  label: string;
  subItems?: NavSubItem[];
  highlight?: boolean;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  highlightText?: string;
  tag?: string;
  date?: string;
  location?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaText: string;
  actionId: string;
  badge?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  content: string[];
  imageUrl: string;
  author?: string;
  views?: number;
  tags?: string[];
  attachments?: AttachedFile[];
  status?: 'publicado' | 'rascunho';
}

export interface GalleryItem {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  photosCount: number;
  description: string;
  images: { url: string; caption: string }[];
}

export interface PastEventPhoto {
  id: string;
  title: string;
  category:
    | 'Festivais Esportivos'
    | 'Categorias de Base'
    | 'Saúde & Vida Ativa'
    | 'Inclusão & Comunidade'
    | string;
  date: string;
  location: string;
  coverUrl: string;
  caption: string;
  albumPhotos: {
    url: string;
    caption: string;
  }[];
}

export interface ProjectStaffMember {
  id: string;
  name: string;
  role: string;
  cref?: string;
  photoUrl: string;
  bio: string;
  specialties: string[];
  contact?: string;
}

export interface PlayerAttributes {
  pace: number; // VEL (Velocidade)
  shooting: number; // FIN (Finalização)
  passing: number; // PAS (Passe)
  dribbling: number; // DRI (Drible)
  defending: number; // DEF (Defesa)
  physical: number; // FIS (Físico)
  overall: number; // OVR Geral
}

export interface PlayerHighlightVideo {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  youtubeId?: string;
  thumbnailUrl: string;
  description: string;
  categoryTag?: string;
}

export interface ProjectTeamClass {
  id: string;
  name: string;
  modality: string;
  category: string;
  gender: 'Feminino' | 'Masculino' | 'Misto';
  schedule: string;
  polo: string;
  totalSpots: number;
  filledSpots?: number;
  availableSpots?: number;
}

export interface ProjectParticipant {
  id: string;
  name: string;
  nickname?: string;
  nextfitCode?: string;
  enrollmentStatus?: 'ativo' | 'trancado' | 'inativo' | 'pendente';
  teamId?: string;
  modality?: string;
  modalityOrClass?: string;
  planName?: string;
  bmi?: string;
  lastSyncDate?: string;
  photoUrl: string;
  jerseyNumber: number;
  position: string;
  positionGroup: 'ataque' | 'meio' | 'defesa' | 'goleiro';
  preferredFoot: 'Destro' | 'Canhoto' | 'Ambidestro';
  age: number;
  birthDate: string;
  category: string;
  height: string;
  weight: string;
  cardTier: 'ouro' | 'diamante' | 'promessa' | 'destaque' | 'prata';
  stats: PlayerAttributes;
  schoolInfo: {
    schoolName: string;
    grade: string;
    turn: 'Matutino' | 'Vespertino' | 'Integral';
    attendanceRate: string;
  };
  highlights: string[];
  scoutReport: {
    summary: string;
    strengths: string[];
    developmentAreas: string[];
    scoutRating: string;
  };
  photos: string[];
  videos: PlayerHighlightVideo[];
}

export interface NextFitCsvAthleteRow {
  id: string;
  nextfitCode: string;
  name: string;
  age: number;
  birthDate: string;
  enrollmentStatus: 'ativo' | 'trancado' | 'inativo' | 'pendente';
  modalityOrClass: string;
  planName: string;
  category: string;
  position: string;
  height: string;
  weight: string;
  bmi: string;
  schoolName: string;
  notes: string;
  photoUrl: string;
  targetProjectId?: string;
}

export interface ProjectFunctioning {
  overview: string;
  methodology: string;
  requirements: string[];
  scheduleDetails: {
    day: string;
    hours: string;
    polo: string;
    modality: string;
  }[];
  benefits: string[];
}

export interface VitalizarProject {
  id: string;
  name: string;
  projectNumber?: string;
  incentiveLaw?: string;
  modalities?: string[];
  teams?: ProjectTeamClass[];
  category:
    | 'esporte_educacional'
    | 'saude_qualidade_vida'
    | 'cultura_cidadania'
    | 'inclusao_pcd'
    | 'terceira_idade'
    | string;
  targetAudience: string;
  description: string;
  schedule: string;
  location: string;
  coordinator: string;
  fundingSource: string;
  imageUrl: string;
  shieldUrl?: string;
  motto?: string;
  totalSpots?: number;
  filledSpots?: number;
  availableSpots?: number;
  functioning?: ProjectFunctioning;
  staff?: ProjectStaffMember[];
  participants?: ProjectParticipant[];
  tags?: string[];
  attachments?: AttachedFile[];
}

export interface ParticipantModalityProfile {
  modalityKey: 'voleibol' | 'futsal';
  modalityName: 'Voleibol' | 'Futsal';
  positions: string[];
  defaultPosition: string;
  dominanceLabel: string;
  dominanceShortLabel: string;
  tacticalSectorLabel: string;
  photosTabLabel: string;
  videosTabLabel: string;
  statLabels: {
    pace: { short: string; full: string };
    shooting: { short: string; full: string };
    passing: { short: string; full: string };
    dribbling: { short: string; full: string };
    defending: { short: string; full: string };
    physical: { short: string; full: string };
  };
}

export function getParticipantModalityProfile(
  modality?: string,
  modalityOrClass?: string
): ParticipantModalityProfile {
  const combined = `${modality || ''} ${modalityOrClass || ''}`.toLowerCase();
  const isFutsal = combined.includes('futsal') || combined.includes('futebol');

  if (isFutsal) {
    return {
      modalityKey: 'futsal',
      modalityName: 'Futsal',
      positions: ['Ala', 'Fixo', 'Pivô', 'Goleiro(a)'],
      defaultPosition: 'Ala',
      dominanceLabel: 'Pé Dominante',
      dominanceShortLabel: 'Pé',
      tacticalSectorLabel: 'Função Tática no Futsal',
      photosTabLabel: 'Fotos em Quadra (Futsal)',
      videosTabLabel: 'Lances de Quadra',
      statLabels: {
        pace: { short: 'VEL', full: 'Velocidade & Explosão' },
        shooting: { short: 'FIN', full: 'Finalização & Chute' },
        passing: { short: 'PAS', full: 'Passe & Visão de Jogo' },
        dribbling: { short: 'DRI', full: 'Drible & Controle de Bola' },
        defending: { short: 'DEF', full: 'Marcação & Desarme' },
        physical: { short: 'FIS', full: 'Físico & Resistência' },
      },
    };
  }

  return {
    modalityKey: 'voleibol',
    modalityName: 'Voleibol',
    positions: ['Ponteiro(a)', 'Levantador(a)', 'Central', 'Oposto(a)', 'Líbero'],
    defaultPosition: 'Ponteiro(a)',
    dominanceLabel: 'Mão Dominante',
    dominanceShortLabel: 'Mão',
    tacticalSectorLabel: 'Função em Quadra (Voleibol)',
    photosTabLabel: 'Fotos em Quadra (Voleibol)',
    videosTabLabel: 'Ralis & Fundamentos',
    statLabels: {
      pace: { short: 'SAQ', full: 'Saque & Potência' },
      shooting: { short: 'ATA', full: 'Ataque & Cortada' },
      passing: { short: 'LEV', full: 'Levantamento & Toque' },
      dribbling: { short: 'REC', full: 'Recepção & Manchete' },
      defending: { short: 'BLO', full: 'Bloqueio & Rede' },
      physical: { short: 'IMP', full: 'Impulsão & Alcance' },
    },
  };
}

export function derivePositionGroup(
  position: string,
  modality?: string,
  modalityOrClass?: string
): ProjectParticipant['positionGroup'] {
  const lower = (position || '').toLowerCase();
  const profile = getParticipantModalityProfile(modality, modalityOrClass);
  if (profile.modalityKey === 'voleibol') {
    if (lower.includes('líbero') || lower.includes('libero')) return 'goleiro';
    if (lower.includes('central')) return 'defesa';
    if (lower.includes('levantador')) return 'meio';
    return 'ataque';
  }
  if (lower.includes('goleir')) return 'goleiro';
  if (lower.includes('fixo') || lower.includes('zagueir') || lower.includes('defes')) return 'defesa';
  if (lower.includes('ala') || lower.includes('meia')) return 'meio';
  return 'ataque';
}

export function normalizeParticipantPositionForModality(
  currentPosition: string | undefined,
  modality?: string,
  modalityOrClass?: string
): string {
  const profile = getParticipantModalityProfile(modality, modalityOrClass);
  const pos = (currentPosition || '').trim();
  if (!pos || pos.toLowerCase() === 'atleta') {
    return profile.defaultPosition;
  }
  const lower = pos.toLowerCase();
  if (profile.modalityKey === 'voleibol') {
    const futsalOnly = ['ala', 'fixo', 'pivô', 'pivo', 'goleiro', 'goleira', 'zagueiro', 'centroavante', 'volante', 'meia', 'lateral'];
    if (futsalOnly.some((f) => lower === f)) {
      return profile.defaultPosition;
    }
    if (lower === 'ponteira' || lower === 'ponteiro') return 'Ponteiro(a)';
    if (lower === 'levantadora' || lower === 'levantador') return 'Levantador(a)';
    if (lower === 'oposta' || lower === 'oposto') return 'Oposto(a)';
    if (lower === 'libero') return 'Líbero';
    return pos;
  } else {
    const volleyOnly = ['ponteira', 'ponteiro', 'ponteiro(a)', 'levantador', 'levantadora', 'levantador(a)', 'central', 'oposto', 'oposta', 'oposto(a)', 'líbero', 'libero'];
    if (volleyOnly.some((v) => lower === v)) {
      return profile.defaultPosition;
    }
    return pos;
  }
}

export function syncProjectSpotsAndTeams(project: VitalizarProject): VitalizarProject {
  const rawParticipants = Array.isArray(project.participants) ? project.participants : [];
  const rawTeams = Array.isArray(project.teams) ? project.teams : [];

  // Synchronize each participant with their enrolled Team/Turma and Modality
  const participants: ProjectParticipant[] = rawParticipants.map((p) => {
    const matchedTeam =
      rawTeams.find((t) => t.id === p.teamId) ||
      rawTeams.find(
        (t) =>
          p.modalityOrClass &&
          p.modalityOrClass.toLowerCase().includes(t.name.toLowerCase())
      ) ||
      (p.modality
        ? rawTeams.find((t) => t.modality.toLowerCase() === p.modality!.toLowerCase())
        : undefined);

    const effectiveModality = matchedTeam?.modality || p.modality || 'Voleibol';
    const effectiveModalityOrClass = matchedTeam
      ? `${matchedTeam.name} (${matchedTeam.modality} · ${matchedTeam.polo})`
      : p.modalityOrClass || project.name;
    const effectiveCategory = matchedTeam?.category || p.category || 'Sub-16';
    const normalizedPosition = normalizeParticipantPositionForModality(
      p.position,
      effectiveModality,
      effectiveModalityOrClass
    );
    const positionGroup = derivePositionGroup(
      normalizedPosition,
      effectiveModality,
      effectiveModalityOrClass
    );

    return {
      ...p,
      teamId: matchedTeam?.id || p.teamId,
      modality: effectiveModality,
      modalityOrClass: effectiveModalityOrClass,
      category: effectiveCategory,
      position: normalizedPosition,
      positionGroup,
    };
  });

  const syncedTeams: ProjectTeamClass[] = rawTeams.map((team) => {
    const teamTotal = Math.max(0, Number(team.totalSpots) || 0);
    const teamFilled = participants.filter(
      (p) =>
        (p.enrollmentStatus || 'ativo') !== 'inativo' &&
        (p.teamId === team.id || (!p.teamId && p.modalityOrClass === team.name))
    ).length;
    return {
      ...team,
      totalSpots: teamTotal,
      filledSpots: teamFilled,
      availableSpots: Math.max(0, teamTotal - teamFilled),
    };
  });

  const derivedModalities = Array.from(
    new Set([
      ...(Array.isArray(project.modalities) ? project.modalities : []),
      ...syncedTeams.map((t) => t.modality).filter(Boolean),
    ])
  );

  const totalSpots =
    syncedTeams.length > 0
      ? syncedTeams.reduce((sum, t) => sum + t.totalSpots, 0)
      : typeof project.totalSpots === 'number' && !Number.isNaN(project.totalSpots)
      ? project.totalSpots
      : 60;

  const filledSpots = participants.filter(
    (p) => (p.enrollmentStatus || 'ativo') !== 'inativo'
  ).length;
  const availableSpots = Math.max(0, totalSpots - filledSpots);

  return {
    ...project,
    modalities: derivedModalities,
    teams: syncedTeams,
    participants,
    totalSpots,
    filledSpots,
    availableSpots,
  };
}

export interface VideoShowcase {
  id: string;
  title: string;
  duration: string;
  category: string;
  youtubeId: string;
  thumbnail: string;
}

export interface FacilityPolo {
  id: string;
  name: string;
  type: 'polo_principal' | 'quadra_poliesportiva' | 'sala_atividades' | 'espaco_saude';
  capacity: string;
  maxGuests: number;
  address: string;
  description: string;
  includedItems: string[];
  imageUrl: string;
  rules: string[];
}

export interface TransparencyDocument {
  id: string;
  title: string;
  category:
    | 'estatuto'
    | 'cnpj'
    | 'governanca'
    | 'emendas'
    | 'fomento'
    | 'prestacao_contas'
    | 'certidoes';
  date: string;
  description: string;
  fileType: string;
  badge: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileDataUrl?: string;
  period?: string;
  protocolNumber?: string;
  responsible?: string;
  financialValue?: string;
  summaryPoints?: string[];
}

export interface SocioTorcedorTier {
  id: string;
  name: string;
  count: number;
  monthlyContribution: string;
  benefitSummary: string;
}

export interface TransparencyDashboardConfig {
  socioTorcedoresTotal: number;
  socioTorcedoresGoal: number;
  socioTorcedoresNewMonth: number;
  socioTorcedoresRetentionRate: string;
  socioTorcedoresTiers: SocioTorcedorTier[];
  socioTorcedoresMonthlyGrowth: { month: string; count: number }[];
  fiscalYear: string;
  totalRevenue: number;
  totalInvested: number;
  directBeneficiaries: number;
  auditStatus: string;
  lastAuditDate: string;
  allocationBreakdown: {
    label: string;
    percentage: number;
    amount: number;
    description: string;
  }[];
  revenueSources: {
    label: string;
    percentage: number;
    amount: number;
  }[];
}

export interface ComputedTransparencyDashboard extends TransparencyDashboardConfig {
  activeParticipantsCount: number;
  totalProjectSpotsCount: number;
  totalTeamsCount: number;
  confirmedPixCount: number;
  confirmedPixAmount: number;
  tiersMembersCount: number;
}

export function computeTransparencyDashboard(
  rawDash: Partial<TransparencyDashboardConfig> | undefined,
  projects: VitalizarProject[] = [],
  donationPledges: DonationPledgeRecord[] = []
): ComputedTransparencyDashboard {
  const syncedProjects = (projects || []).map((p) => syncProjectSpotsAndTeams(p));
  const totalProjectSpotsCount = syncedProjects.reduce((s, p) => s + (p.totalSpots || 0), 0);
  const activeParticipantsCount = syncedProjects.reduce(
    (s, p) => s + (p.participants || []).filter((pt) => pt.enrollmentStatus !== 'inativo').length,
    0
  );
  const totalTeamsCount = syncedProjects.reduce((s, p) => s + (p.teams?.length || 0), 0);

  const confirmedPix = (donationPledges || []).filter((d) => d && d.status === 'confirmado');
  const confirmedPixCount = confirmedPix.length;
  const confirmedPixAmount = confirmedPix.reduce(
    (s, d) => s + Math.max(0, Number(d.amount) || 0),
    0
  );

  const baseTiers: SocioTorcedorTier[] =
    Array.isArray(rawDash?.socioTorcedoresTiers) && rawDash!.socioTorcedoresTiers.length > 0
      ? rawDash!.socioTorcedoresTiers.map((t, i) => ({
          id: t?.id || `tier-${i}`,
          name: t?.name || 'Sócio Contribuinte',
          count: Math.max(0, Math.floor(Number(t?.count)) || 0),
          monthlyContribution: t?.monthlyContribution || 'R$ 25,00 / mês',
          benefitSummary: t?.benefitSummary || '',
        }))
      : [];

  const tiersMembersCount = baseTiers.reduce((s, t) => s + t.count, 0);
  const socioTorcedoresTotal = tiersMembersCount + confirmedPixCount;
  const socioTorcedoresGoal = Math.max(1, Number(rawDash?.socioTorcedoresGoal) || 100);

  const rawGrowth =
    Array.isArray(rawDash?.socioTorcedoresMonthlyGrowth) &&
    rawDash!.socioTorcedoresMonthlyGrowth.length > 0
      ? rawDash!.socioTorcedoresMonthlyGrowth.map((m, i) => ({
          month: m?.month || `M${i + 1}`,
          count: Math.max(0, Math.floor(Number(m?.count)) || 0),
        }))
      : [{ month: 'Atual', count: socioTorcedoresTotal }];

  const socioTorcedoresMonthlyGrowth = rawGrowth.map((item, idx) =>
    idx === rawGrowth.length - 1 ? { ...item, count: socioTorcedoresTotal } : item
  );

  const prevMonthCount =
    socioTorcedoresMonthlyGrowth.length >= 2
      ? socioTorcedoresMonthlyGrowth[socioTorcedoresMonthlyGrowth.length - 2].count
      : 0;
  const socioTorcedoresNewMonth = Math.max(
    confirmedPixCount,
    Math.max(0, socioTorcedoresTotal - prevMonthCount)
  );

  // Manual revenue sources (excluding auto-generated PIX row so it is never double-counted)
  const manualSources = (rawDash?.revenueSources || [])
    .filter((r) => r && !String(r.label || '').startsWith('Doações PIX Confirmadas'))
    .map((r) => ({
      label: r.label || 'Fonte de Custeio',
      amount: Math.max(0, Number(r.amount) || 0),
      percentage: 0,
    }));

  const combinedSources = [
    ...manualSources,
    {
      label: `Doações PIX Confirmadas (${confirmedPixCount} apoio${confirmedPixCount === 1 ? '' : 's'})`,
      amount: confirmedPixAmount,
      percentage: 0,
    },
  ];

  const totalRevenue = combinedSources.reduce((s, r) => s + r.amount, 0);
  const revenueSources = combinedSources.map((r) => ({
    ...r,
    percentage: totalRevenue > 0 ? Math.round((r.amount / totalRevenue) * 100) : 0,
  }));

  const rawAllocations = (rawDash?.allocationBreakdown || []).map((a) => ({
    label: a?.label || 'Área Estatutária',
    description: a?.description || '',
    amount: Math.max(0, Number(a?.amount) || 0),
    percentage: 0,
  }));

  const totalInvested = rawAllocations.reduce((s, a) => s + a.amount, 0);
  const allocationBreakdown = rawAllocations.map((a) => ({
    ...a,
    percentage: totalInvested > 0 ? Math.round((a.amount / totalInvested) * 100) : 0,
  }));

  return {
    fiscalYear: rawDash?.fiscalYear || String(new Date().getFullYear()),
    auditStatus:
      rawDash?.auditStatus || 'Contabilidade em Conformidade · Lei Federal nº 13.019/2014 (MROSC)',
    lastAuditDate: rawDash?.lastAuditDate || new Date().toLocaleDateString('pt-BR'),
    socioTorcedoresRetentionRate:
      socioTorcedoresTotal > 0 ? rawDash?.socioTorcedoresRetentionRate || '100%' : '—',
    socioTorcedoresTotal,
    socioTorcedoresGoal,
    socioTorcedoresNewMonth,
    socioTorcedoresTiers: baseTiers,
    socioTorcedoresMonthlyGrowth,
    totalRevenue,
    totalInvested,
    directBeneficiaries: totalProjectSpotsCount,
    allocationBreakdown,
    revenueSources,
    activeParticipantsCount,
    totalProjectSpotsCount,
    totalTeamsCount,
    confirmedPixCount,
    confirmedPixAmount,
    tiersMembersCount,
  };
}

// Self-check for transparency dashboard source calculation
{
  const check = computeTransparencyDashboard(
    {
      socioTorcedoresGoal: 100,
      socioTorcedoresTiers: [
        { id: 't1', name: 'Raiz', count: 2, monthlyContribution: 'R$ 25', benefitSummary: '' },
      ],
      revenueSources: [{ label: 'Fomento', amount: 1000, percentage: 0 }],
      allocationBreakdown: [{ label: 'Materiais', amount: 400, percentage: 0, description: '' }],
    },
    [],
    [
      {
        id: 'p1',
        protocol: 'PIX-1',
        donorName: 'Doador',
        amount: 250,
        purpose: 'Apoio',
        date: '2026',
        status: 'confirmado',
      },
    ]
  );
  if (check.socioTorcedoresTotal !== 3 || check.totalRevenue !== 1250 || check.totalInvested !== 400) {
    throw new Error('computeTransparencyDashboard self-check failed');
  }
}

export type EventCategory = 'clinica_esportiva' | 'oficina_comunitaria' | 'reuniao_associacao';

export interface VitalizarEvent {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  dayNumber: string;
  monthShort: string;
  time: string;
  location: string;
  address: string;
  targetAudience: string;
  coordinator: string;
  capacity: number;
  availableSpots: number;
  isFree: boolean;
  description: string;
  prerequisites?: string[];
  scheduleHighlights?: string[];
  status: 'confirmado' | 'inscricoes_abertas' | 'vagas_limitadas' | 'em_breve';
  attachments?: AttachedFile[];
}

export function syncEventSpots(
  event: VitalizarEvent,
  rsvps: { eventId?: string; spots?: number; enrollmentStatus?: string }[]
): VitalizarEvent {
  const capacity = Math.max(1, Number(event.capacity) || 30);
  const occupied = (rsvps || [])
    .filter((r) => r && r.eventId === event.id && r.enrollmentStatus !== 'recusada')
    .reduce((sum, r) => sum + Math.max(1, Math.floor(Number(r.spots)) || 1), 0);
  const availableSpots = Math.max(0, capacity - occupied);
  const status: VitalizarEvent['status'] =
    event.status === 'confirmado' || event.status === 'em_breve'
      ? event.status
      : availableSpots === 0
      ? 'em_breve'
      : availableSpots <= 5
      ? 'vagas_limitadas'
      : 'inscricoes_abertas';
  return {
    ...event,
    capacity,
    availableSpots,
    status,
  };
}

export function syncEventsWithRsvps(
  events: VitalizarEvent[],
  rsvps: { eventId?: string; spots?: number; enrollmentStatus?: string }[]
): VitalizarEvent[] {
  return (events || []).map((ev) => syncEventSpots(ev, rsvps));
}

// Self-check for event spot calculation
{
  const sample = syncEventSpots(
    {
      id: 'evt-check',
      title: 'Teste',
      category: 'clinica_esportiva',
      categoryLabel: 'Clínica Esportiva',
      date: '2026-10-24',
      formattedDate: '24/10/2026',
      dayNumber: '24',
      monthShort: 'OUT',
      time: '08:00',
      location: 'Polo',
      address: 'Rua',
      targetAudience: 'Todos',
      coordinator: 'Coord',
      capacity: 40,
      availableSpots: 14,
      isFree: true,
      description: '',
      status: 'inscricoes_abertas',
    },
    [
      { eventId: 'evt-check', spots: 3 },
      { eventId: 'evt-check', spots: 2, enrollmentStatus: 'recusada' },
    ]
  );
  if (sample.availableSpots !== 37) {
    throw new Error(`syncEventSpots self-check failed: expected 37, got ${sample.availableSpots}`);
  }
}

export type SponsorTier = 'master' | 'ouro' | 'prata' | 'bronze' | 'apoio';

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  tierLabel: string;
  logoUrl: string;
  websiteUrl?: string;
  description: string;
  category: string;
  active: boolean;
  order: number;
}

export interface HeroSlideConfig {
  id: string;
  kicker: string;
  headline: string;
  description: string;
  image: string;
  caption: string;
  schedule: string;
  primaryActionLabel: string;
  secondaryLabel: string;
  secondaryTarget: string;
}

export interface ScoutInquiryRecord {
  id: string;
  protocol: string;
  scoutName: string;
  organization: string;
  role: string;
  credentialsId?: string;
  phone: string;
  email: string;
  inquiryType: 'avaliacao_clube' | 'visita_treino' | 'relatorio_atleta' | 'parceria_base';
  targetPlayerName?: string;
  targetCategory: string;
  preferredDate?: string;
  message: string;
  projectName: string;
  createdAt: string;
  status: 'nova' | 'em_analise' | 'agendada' | 'concluida';
}


export interface PixDonationConfig {
  pixKey: string;
  pixKeyFormatted: string;
  keyType: 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  beneficiaryName: string;
  city: string;
  bankName: string;
  suggestedAmounts: {
    amount: number;
    label: string;
    impactDescription: string;
  }[];
}

export interface DonationPledgeRecord {
  id: string;
  protocol: string;
  donorName: string;
  donorEmail?: string;
  userId?: string;
  amount: number;
  purpose: string;
  date: string;
  message?: string;
  status: 'registrado' | 'confirmado';
}

export interface MatchResultRecord {
  id: string;
  competition: string;
  category: string;
  date: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'encerrado' | 'agendado';
  scorers?: string[];
  mvpPlayerName?: string;
  projectId?: string;
}

export interface ClubTrophyRecord {
  id: string;
  title: string;
  competition: string;
  year: string;
  category: string;
  placement:
    | '1º Lugar - Campeão'
    | '2º Lugar - Vice-Campeão'
    | '3º Lugar - Destaque'
    | 'Troféu Fair Play / Impacto Social';
  description: string;
}

export interface VolunteerApplicationRecord {
  id: string;
  protocol: string;
  name: string;
  area:
    | 'Educação Física & Esporte'
    | 'Saúde, Fisio & Nutrição'
    | 'Psicologia & Serviço Social'
    | 'Comunicação, Foto & Mídia'
    | 'Apoio em Eventos & Logística'
    | 'Mentoria & Educação';
  availability: string;
  experience: string;
  contactInfo: string;
  motivation: string;
  createdAt: string;
  status: 'novo' | 'em_analise' | 'ativo';
}

export interface SiteSettings {
  newsCategories: string[];
  eventCategories: string[];
  projectCategories: string[];
  galleryCategories: string[];
  sponsorCategories: string[];
  contactSubjects: string[];
  siteTags: string[];
  searchSuggestions: string[];
  announcementBanner: {
    enabled: boolean;
    text: string;
    linkLabel: string;
    linkTarget: string;
  };
  seoTitle: string;
  seoDescription: string;
  whatsappNumber: string;
  enableRegistrations: boolean;
  enableSponsorsSection: boolean;
  enableFloatingWhatsapp: boolean;
  enableSearch: boolean;
  enableRsvpModal: boolean;
  transparencyDashboard?: TransparencyDashboardConfig;
  heroSlides?: HeroSlideConfig[];
  pixConfig?: PixDonationConfig;
  donationPledges?: DonationPledgeRecord[];
  matchResults?: MatchResultRecord[];
  clubTrophies?: ClubTrophyRecord[];
  volunteers?: VolunteerApplicationRecord[];
}
