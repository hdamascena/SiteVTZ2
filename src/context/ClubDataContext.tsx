import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  CLUB_INFO,
  NEWS_ARTICLES,
  VITALIZAR_EVENTS,
  VITALIZAR_PROJECTS,
  TRANSPARENCY_DOCUMENTS,
  DEFAULT_SITE_SETTINGS,
  FACILITY_POLOS,
} from '../data/clubeData.ts';
import { INITIAL_SPONSORS } from '../data/sponsorsData.ts';
import type {
  NewsArticle,
  VitalizarEvent,
  VitalizarProject,
  TransparencyDocument,
  PastEventPhoto,
  Sponsor,
  SiteSettings,
  FacilityPolo,
  ScoutInquiryRecord,
  DonationPledgeRecord,
  VolunteerApplicationRecord,
  AttendanceSessionRecord,
} from '../types/index.ts';
import {
  createAuditLogEntry,
  validateBackupSchema,
} from '../utils/adminAuth.ts';
import type { AuditLogEntry } from '../utils/adminAuth.ts';
import { db, auth } from '../firebase.ts';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type {
  AdminUserProfile,
  ParticipantPrivateRecord,
  ProjectEnrollmentStatus,
} from '../admin/types.ts';
import {
  canRoleWriteCollection,
  filterPrivateCollectionsForUser,
  getReadablePrivateCollections,
  splitParticipantPublicAndPrivate,
} from '../admin/permissions.ts';
import {
  promoteVisitorToSupporter,
  verifyFirebaseAdminAccess,
} from '../services/firebaseService.ts';

export const INITIAL_GALLERY_ALBUMS: PastEventPhoto[] = [
  {
    id: 'gal-1',
    title: 'Festival Esportivo Comunitário de Rio Marinho',
    category: 'Festivais Esportivos',
    date: 'Agosto 2026',
    location: 'Quadra Poliesportiva de Rio Marinho · Cariacica/ES',
    coverUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80',
    caption:
      'Mais de 250 crianças e adolescentes participaram dos torneios de integração em Rio Marinho.',
    albumPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
        caption: 'Abertura oficial do Festival Esportivo Comunitário com as turmas Sub-11 e Sub-15.',
      },
      {
        url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
        caption: 'Partidas decisivas de futsal e basquete educacional com presença das famílias.',
      },
      {
        url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80',
        caption: 'Entrega de medalhas de participação e troféu Fair Play.',
      },
    ],
  },
  {
    id: 'gal-2',
    title: 'Copa Vitalizar de Futsal e Voleibol de Base',
    category: 'Categorias de Base',
    date: 'Julho 2026',
    location: 'Ginásio Poliesportivo · Cariacica/ES',
    coverUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1000&q=80',
    caption: 'Equipes femininas e masculinas Sub-14 e Sub-17 em competição pedagógica.',
    albumPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
        caption: 'Equipe feminina de voleibol Sub-15 durante a final municipal.',
      },
      {
        url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
        caption: 'Aquecimento coletivo orientado pelos professores de educação física da Vitalizar.',
      },
      {
        url: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=1200&q=80',
        caption: 'Roda de conversa sobre disciplina esportiva e rendimento escolar.',
      },
    ],
  },
  {
    id: 'gal-3',
    title: 'Circuito Saúde & Movimento – Vida Ativa',
    category: 'Saúde & Vida Ativa',
    date: 'Junho 2026',
    location: 'Praça Principal de Rio Marinho · Cariacica/ES',
    coverUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&q=80',
    caption: 'Aulão funcional, alongamento e acompanhamento preventivo para adultos e idosos.',
    albumPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
        caption: 'Grupo da terceira idade em atividade de mobilidade articular e prevenção de quedas.',
      },
      {
        url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
        caption: 'Aula coletiva de ginástica funcional ao ar livre.',
      },
    ],
  },
  {
    id: 'gal-4',
    title: 'Colônia de Férias Campeões da Cidadania',
    category: 'Inclusão & Comunidade',
    date: 'Janeiro 2026',
    location: 'Polo Rio Marinho · Cariacica/ES',
    coverUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1000&q=80',
    caption: 'Semana recreativa com gincanas, oficinas culturais, capoeira e esporte adaptado.',
    albumPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=80',
        caption: 'Atividades recreativas integradas para crianças da comunidade.',
      },
      {
        url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
        caption: 'Brincadeiras cooperativas e circuitos psicomotores.',
      },
      {
        url: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=1200&q=80',
        caption: 'Encerramento com apresentação cultural e integração comunitária.',
      },
    ],
  },
];

export interface EventRsvpRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  spots: number;
  date: string;
  confirmationCode: string;
  projectId?: string;
  enrollmentStatus?: ProjectEnrollmentStatus;
  studentName?: string;
  studentAge?: number;
  responsibleName?: string;
  modalityOrClass?: string;
  userId?: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ClubDataContextType {
  currentUserProfile: AdminUserProfile | null;
  authLoading: boolean;
  refreshUserProfile: () => Promise<void>;
  clubInfo: typeof CLUB_INFO;
  siteSettings: SiteSettings;
  addDonationPledge: (pledge: DonationPledgeRecord) => void;
  addVolunteerApplication: (application: VolunteerApplicationRecord) => void;
  newsArticles: NewsArticle[];
  events: VitalizarEvent[];
  rsvps: EventRsvpRecord[];
  addRsvp: (rsvp: Omit<EventRsvpRecord, 'id' | 'confirmationCode' | 'date'>) => string;
  projects: VitalizarProject[];
  participantPrivateMap: Record<string, ParticipantPrivateRecord>;
  saveParticipantPrivate: (record: ParticipantPrivateRecord) => Promise<void>;
  galleryAlbums: PastEventPhoto[];
  transparencyDocs: TransparencyDocument[];
  sponsors: Sponsor[];
  facilityPolos: FacilityPolo[];
  scoutInquiries: ScoutInquiryRecord[];
  addScoutInquiry: (inquiry: Omit<ScoutInquiryRecord, 'id' | 'protocol' | 'createdAt' | 'status'>) => string;
  contactMessages: ContactMessageRecord[];
  addContactMessage: (msg: Omit<ContactMessageRecord, 'id' | 'date' | 'read'>) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (action: string, details?: string, adminEmail?: string) => void;
  recordAuditEvent: (params: {
    action: string;
    collection: string;
    itemId: string;
    beforeSummary?: string;
    afterSummary?: string;
    details?: string;
    role?: string;
  }) => void;
  clearAuditLogs: () => void;
  resetAllToDefaults: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => { success: boolean; message: string };
  saveAdminChanges: (payload: {
    clubInfo?: typeof CLUB_INFO;
    siteSettings?: SiteSettings;
    newsArticles?: NewsArticle[];
    sponsors?: Sponsor[];
    events?: VitalizarEvent[];
    projects?: VitalizarProject[];
    galleryAlbums?: PastEventPhoto[];
    transparencyDocs?: TransparencyDocument[];
    facilityPolos?: FacilityPolo[];
    scoutInquiries?: ScoutInquiryRecord[];
    rsvps?: EventRsvpRecord[];
    contactMessages?: ContactMessageRecord[];
    logDetails?: string;
    toastMessage?: string;
  }, logMessage?: string) => boolean;
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  isFirebaseActive: boolean;
}

const STORAGE_KEYS = {
  CLUB_INFO: 'vitalizar_db_club_info',
  SITE_SETTINGS: 'vitalizar_db_site_settings',
  NEWS: 'vitalizar_db_news',
  SPONSORS: 'vitalizar_db_sponsors',
  EVENTS: 'vitalizar_db_events',
  PROJECTS: 'vitalizar_db_projects',
  PARTICIPANT_PRIVATE: 'vitalizar_db_participant_private',
  GALLERY: 'vitalizar_db_gallery',
  TRANSPARENCY: 'vitalizar_db_transparency',
  POLOS: 'vitalizar_db_polos',
  SCOUT_INQUIRIES: 'vitalizar_db_scout_inquiries',
  RSVPS: 'vitalizar_db_rsvps',
  MESSAGES: 'vitalizar_db_messages',
  LOGS: 'vitalizar_db_logs',
};

function normalizeClubInfo(raw?: Partial<typeof CLUB_INFO> | null): typeof CLUB_INFO {
  if (!raw || typeof raw !== 'object') {
    return CLUB_INFO;
  }
  return {
    ...CLUB_INFO,
    ...raw,
    phones:
      Array.isArray(raw.phones) && raw.phones.length > 0
        ? raw.phones.map((p) => String(p || ''))
        : CLUB_INFO.phones,
    secondaryActivities:
      Array.isArray(raw.secondaryActivities) && raw.secondaryActivities.length > 0
        ? raw.secondaryActivities
        : CLUB_INFO.secondaryActivities,
    hours: {
      ...CLUB_INFO.hours,
      ...(raw.hours && typeof raw.hours === 'object' ? raw.hours : {}),
    },
    socials: {
      ...CLUB_INFO.socials,
      ...(raw.socials && typeof raw.socials === 'object' ? raw.socials : {}),
    },
  };
}

function normalizeSiteSettings(raw?: Partial<SiteSettings> | null): SiteSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SITE_SETTINGS;
  }
  const defaultDash = DEFAULT_SITE_SETTINGS.transparencyDashboard!;
  const rawDash =
    raw.transparencyDashboard && typeof raw.transparencyDashboard === 'object'
      ? raw.transparencyDashboard
      : ({} as Partial<typeof defaultDash>);

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...raw,
    newsCategories:
      Array.isArray(raw.newsCategories) && raw.newsCategories.length > 0
        ? raw.newsCategories
        : DEFAULT_SITE_SETTINGS.newsCategories,
    eventCategories:
      Array.isArray(raw.eventCategories) && raw.eventCategories.length > 0
        ? raw.eventCategories
        : DEFAULT_SITE_SETTINGS.eventCategories,
    projectCategories:
      Array.isArray(raw.projectCategories) && raw.projectCategories.length > 0
        ? raw.projectCategories
            .map((item: any) =>
              typeof item === 'string' ? item : item?.label || item?.id || ''
            )
            .filter(Boolean)
        : DEFAULT_SITE_SETTINGS.projectCategories,
    galleryCategories:
      Array.isArray(raw.galleryCategories) && raw.galleryCategories.length > 0
        ? raw.galleryCategories
        : DEFAULT_SITE_SETTINGS.galleryCategories,
    sponsorCategories:
      Array.isArray(raw.sponsorCategories) && raw.sponsorCategories.length > 0
        ? raw.sponsorCategories
        : DEFAULT_SITE_SETTINGS.sponsorCategories,
    contactSubjects:
      Array.isArray(raw.contactSubjects) && raw.contactSubjects.length > 0
        ? raw.contactSubjects
        : DEFAULT_SITE_SETTINGS.contactSubjects,
    siteTags:
      Array.isArray(raw.siteTags) && raw.siteTags.length > 0
        ? raw.siteTags
        : DEFAULT_SITE_SETTINGS.siteTags,
    searchSuggestions:
      Array.isArray(raw.searchSuggestions) && raw.searchSuggestions.length > 0
        ? raw.searchSuggestions
        : DEFAULT_SITE_SETTINGS.searchSuggestions,
    announcementBanner: {
      ...DEFAULT_SITE_SETTINGS.announcementBanner,
      ...(raw.announcementBanner && typeof raw.announcementBanner === 'object'
        ? raw.announcementBanner
        : {}),
    },
    transparencyDashboard: {
      ...defaultDash,
      ...rawDash,
      fiscalYear: rawDash.fiscalYear || defaultDash.fiscalYear,
      lastAuditDate: rawDash.lastAuditDate || defaultDash.lastAuditDate,
      auditStatus: rawDash.auditStatus || defaultDash.auditStatus,
      socioTorcedoresTotal:
        typeof rawDash.socioTorcedoresTotal === 'number' && !Number.isNaN(rawDash.socioTorcedoresTotal)
          ? rawDash.socioTorcedoresTotal
          : defaultDash.socioTorcedoresTotal,
      socioTorcedoresGoal:
        typeof rawDash.socioTorcedoresGoal === 'number' && !Number.isNaN(rawDash.socioTorcedoresGoal)
          ? rawDash.socioTorcedoresGoal
          : defaultDash.socioTorcedoresGoal,
      socioTorcedoresNewMonth:
        typeof rawDash.socioTorcedoresNewMonth === 'number' &&
        !Number.isNaN(rawDash.socioTorcedoresNewMonth)
          ? rawDash.socioTorcedoresNewMonth
          : defaultDash.socioTorcedoresNewMonth,
      socioTorcedoresRetentionRate:
        rawDash.socioTorcedoresRetentionRate || defaultDash.socioTorcedoresRetentionRate,
      totalRevenue:
        typeof rawDash.totalRevenue === 'number' && !Number.isNaN(rawDash.totalRevenue)
          ? rawDash.totalRevenue
          : defaultDash.totalRevenue,
      totalInvested:
        typeof rawDash.totalInvested === 'number' && !Number.isNaN(rawDash.totalInvested)
          ? rawDash.totalInvested
          : defaultDash.totalInvested,
      directBeneficiaries:
        typeof rawDash.directBeneficiaries === 'number' && !Number.isNaN(rawDash.directBeneficiaries)
          ? rawDash.directBeneficiaries
          : defaultDash.directBeneficiaries,
      socioTorcedoresTiers:
        Array.isArray(rawDash.socioTorcedoresTiers) && rawDash.socioTorcedoresTiers.length > 0
          ? rawDash.socioTorcedoresTiers.map((t, i) => ({
              id: t?.id || `tier-${i}`,
              name: t?.name || 'Sócio Contribuinte',
              monthlyContribution: t?.monthlyContribution || 'R$ 25,00/mês',
              count: typeof t?.count === 'number' && !Number.isNaN(t.count) ? t.count : 0,
              benefitSummary: t?.benefitSummary || '',
            }))
          : defaultDash.socioTorcedoresTiers,
      socioTorcedoresMonthlyGrowth:
        Array.isArray(rawDash.socioTorcedoresMonthlyGrowth) &&
        rawDash.socioTorcedoresMonthlyGrowth.length > 0
          ? rawDash.socioTorcedoresMonthlyGrowth.map((m, i) => ({
              month: m?.month || `M${i + 1}`,
              count: typeof m?.count === 'number' && !Number.isNaN(m.count) ? m.count : 0,
            }))
          : defaultDash.socioTorcedoresMonthlyGrowth,
      allocationBreakdown:
        Array.isArray(rawDash.allocationBreakdown) && rawDash.allocationBreakdown.length > 0
          ? rawDash.allocationBreakdown.map((a) => ({
              label: a?.label || 'Área Estatutária',
              percentage:
                typeof a?.percentage === 'number' && !Number.isNaN(a.percentage) ? a.percentage : 0,
              amount: typeof a?.amount === 'number' && !Number.isNaN(a.amount) ? a.amount : 0,
              description: a?.description || '',
            }))
          : defaultDash.allocationBreakdown,
      revenueSources:
        Array.isArray(rawDash.revenueSources) && rawDash.revenueSources.length > 0
          ? rawDash.revenueSources.map((r) => ({
              label: r?.label || 'Fonte de Custeio',
              percentage:
                typeof r?.percentage === 'number' && !Number.isNaN(r.percentage) ? r.percentage : 0,
              amount: typeof r?.amount === 'number' && !Number.isNaN(r.amount) ? r.amount : 0,
            }))
          : defaultDash.revenueSources,
    },
    heroSlides:
      Array.isArray(raw.heroSlides) && raw.heroSlides.length > 0
        ? raw.heroSlides
        : DEFAULT_SITE_SETTINGS.heroSlides,
    pixConfig: {
      ...DEFAULT_SITE_SETTINGS.pixConfig!,
      ...(raw.pixConfig && typeof raw.pixConfig === 'object' ? raw.pixConfig : {}),
      suggestedAmounts:
        Array.isArray(raw.pixConfig?.suggestedAmounts) &&
        raw.pixConfig!.suggestedAmounts.length > 0
          ? raw.pixConfig!.suggestedAmounts
          : DEFAULT_SITE_SETTINGS.pixConfig!.suggestedAmounts,
    },
    donationPledges: Array.isArray(raw.donationPledges)
      ? raw.donationPledges
      : DEFAULT_SITE_SETTINGS.donationPledges || [],
    matchResults:
      Array.isArray(raw.matchResults) && raw.matchResults.length > 0
        ? raw.matchResults
        : DEFAULT_SITE_SETTINGS.matchResults || [],
    clubTrophies:
      Array.isArray(raw.clubTrophies) && raw.clubTrophies.length > 0
        ? raw.clubTrophies
        : DEFAULT_SITE_SETTINGS.clubTrophies || [],
    volunteers: Array.isArray(raw.volunteers)
      ? raw.volunteers
      : DEFAULT_SITE_SETTINGS.volunteers || [],
    attendanceSessions: Array.isArray(raw.attendanceSessions)
      ? raw.attendanceSessions
      : DEFAULT_SITE_SETTINGS.attendanceSessions || [],
  };
}


function normalizeTransparencyDocs(raw?: TransparencyDocument[] | null): TransparencyDocument[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return TRANSPARENCY_DOCUMENTS;
  }
  const defaultMap = new Map(TRANSPARENCY_DOCUMENTS.map((d) => [d.id, d]));
  const seenIds = new Set<string>();
  const merged: TransparencyDocument[] = [];

  for (let i = 0; i < raw.length; i++) {
    const docItem = raw[i];
    if (!docItem || typeof docItem !== 'object') continue;
    const id = docItem.id || `doc-${i + 1}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const def = defaultMap.get(id);
    merged.push({
      ...(def || {}),
      ...docItem,
      id,
      title: docItem.title || def?.title || 'Documento Institucional',
      category: docItem.category || def?.category || 'prestacao_contas',
      date: docItem.date || def?.date || '2026',
      description: docItem.description || def?.description || '',
      fileType: docItem.fileType || def?.fileType || 'PDF',
      badge: docItem.badge || def?.badge || 'Vigente',
      fileSize: docItem.fileSize || def?.fileSize,
      period: docItem.period || def?.period,
      protocolNumber: docItem.protocolNumber || def?.protocolNumber,
      responsible: docItem.responsible || def?.responsible,
      financialValue: docItem.financialValue || def?.financialValue,
      summaryPoints:
        Array.isArray(docItem.summaryPoints) && docItem.summaryPoints.length > 0
          ? docItem.summaryPoints
          : def?.summaryPoints || [],
    });
  }

  return merged;
}

function normalizeGalleryAlbums(raw?: PastEventPhoto[] | null): PastEventPhoto[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return INITIAL_GALLERY_ALBUMS;
  }
  const defaultMap = new Map(INITIAL_GALLERY_ALBUMS.map((a) => [a.id, a]));
  return raw
    .filter((a) => a && typeof a === 'object')
    .map((album, idx) => {
      const id = album.id || `album-${idx + 1}`;
      const def = defaultMap.get(id);
      const coverUrl =
        album.coverUrl ||
        def?.coverUrl ||
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80';
      const title = album.title || def?.title || 'Álbum de Fotos Vitalizar';
      const caption = album.caption || def?.caption || title;
      const rawPhotos = Array.isArray(album.albumPhotos)
        ? album.albumPhotos.filter((p) => p && typeof p.url === 'string')
        : [];
      return {
        ...(def || {}),
        ...album,
        id,
        title,
        category: album.category || def?.category || 'Festivais Esportivos',
        date: album.date || def?.date || '2026',
        location: album.location || def?.location || 'Cariacica · ES',
        coverUrl,
        caption,
        albumPhotos:
          rawPhotos.length > 0
            ? rawPhotos
            : def?.albumPhotos && def.albumPhotos.length > 0
            ? def.albumPhotos
            : [{ url: coverUrl, caption }],
      };
    });
}

function normalizeNewsArticles(raw?: NewsArticle[] | null): NewsArticle[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return NEWS_ARTICLES;
  }
  return raw
    .filter((n) => n && typeof n === 'object')
    .map((art, idx) => ({
      ...art,
      id: art.id || `noticia-${idx + 1}`,
      title: art.title || 'Comunicado Vitalizar',
      date: art.date || '2026',
      category: art.category || 'Institucional',
      summary: art.summary || '',
      imageUrl:
        art.imageUrl ||
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80',
      author: art.author || 'Assessoria Vitalizar',
      content: Array.isArray(art.content)
        ? art.content
        : art.summary
        ? [art.summary]
        : [],
      tags: Array.isArray(art.tags) ? art.tags : [],
      attachments: Array.isArray(art.attachments) ? art.attachments : [],
    }));
}

function normalizeEvents(raw?: VitalizarEvent[] | null): VitalizarEvent[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return VITALIZAR_EVENTS;
  }
  return raw
    .filter((ev) => ev && typeof ev === 'object')
    .map((ev, idx) => ({
      ...ev,
      id: ev.id || `evento-${idx + 1}`,
      title: ev.title || 'Evento Esportivo Vitalizar',
      category: ev.category || 'clinica_esportiva',
      categoryLabel: ev.categoryLabel || 'Clínica Esportiva',
      date: ev.date || '2026-11-15',
      formattedDate: ev.formattedDate || ev.date || '2026',
      dayNumber: ev.dayNumber || '15',
      monthShort: ev.monthShort || 'NOV',
      time: ev.time || '08:00 às 12:00',
      location: ev.location || 'Polo Rio Marinho',
      address: ev.address || 'Rua Quatro, 173, Rio Marinho, Cariacica - ES',
      targetAudience: ev.targetAudience || 'Comunidade em geral',
      coordinator: ev.coordinator || 'Coordenação Esportiva',
      capacity: typeof ev.capacity === 'number' && ev.capacity > 0 ? ev.capacity : 30,
      availableSpots:
        typeof ev.availableSpots === 'number' && ev.availableSpots >= 0 ? ev.availableSpots : 30,
      isFree: ev.isFree !== false,
      description: ev.description || '',
      status: ev.status || 'inscricoes_abertas',
      scheduleHighlights: Array.isArray(ev.scheduleHighlights) ? ev.scheduleHighlights : [],
      prerequisites: Array.isArray(ev.prerequisites) ? ev.prerequisites : [],
      attachments: Array.isArray(ev.attachments) ? ev.attachments : [],
    }));
}

function normalizeProjects(raw?: VitalizarProject[] | null): VitalizarProject[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return VITALIZAR_PROJECTS;
  }
  const defaultMap = new Map(VITALIZAR_PROJECTS.map((p) => [p.id, p]));
  return raw
    .filter((p) => p && typeof p === 'object')
    .map((proj, idx) => {
      const id = proj.id || `projeto-${idx + 1}`;
      const def = defaultMap.get(id);
      return {
        ...(def || {}),
        ...proj,
        id,
        name: proj.name || def?.name || 'Projeto Socioesportivo Vitalizar',
        category: proj.category || def?.category || 'esporte_educacional',
        targetAudience: proj.targetAudience || def?.targetAudience || 'Comunidade de Cariacica',
        description: proj.description || def?.description || '',
        schedule: proj.schedule || def?.schedule || 'Terças e Quintas',
        location: proj.location || def?.location || 'Polo Rio Marinho',
        coordinator: proj.coordinator || def?.coordinator || 'Equipe Técnica Vitalizar',
        fundingSource: proj.fundingSource || def?.fundingSource || 'Recursos Próprios & Fomento',
        imageUrl:
          proj.imageUrl ||
          def?.imageUrl ||
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80',
        shieldUrl: proj.shieldUrl || def?.shieldUrl,
        motto: proj.motto || def?.motto,
        totalSpots:
          typeof proj.totalSpots === 'number' && !Number.isNaN(proj.totalSpots)
            ? proj.totalSpots
            : def?.totalSpots || 60,
        filledSpots:
          typeof proj.filledSpots === 'number' && !Number.isNaN(proj.filledSpots)
            ? proj.filledSpots
            : def?.filledSpots || 45,
        availableSpots:
          typeof proj.availableSpots === 'number' && !Number.isNaN(proj.availableSpots)
            ? proj.availableSpots
            : def?.availableSpots || 15,
        functioning:
          proj.functioning && typeof proj.functioning === 'object'
            ? {
                ...def?.functioning,
                ...proj.functioning,
                overview: proj.functioning.overview ?? def?.functioning?.overview ?? '',
                methodology: proj.functioning.methodology ?? def?.functioning?.methodology ?? '',
                requirements: Array.isArray(proj.functioning.requirements)
                  ? proj.functioning.requirements
                  : def?.functioning?.requirements || [],
                scheduleDetails: Array.isArray(proj.functioning.scheduleDetails)
                  ? proj.functioning.scheduleDetails
                  : def?.functioning?.scheduleDetails || [],
                benefits: Array.isArray(proj.functioning.benefits)
                  ? proj.functioning.benefits
                  : def?.functioning?.benefits || [],
              }
            : def?.functioning,
        staff: Array.isArray(proj.staff) ? proj.staff : def?.staff || [],
        participants: Array.isArray(proj.participants)
          ? proj.participants
          : def?.participants || [],
        tags: Array.isArray(proj.tags) ? proj.tags : def?.tags || [],
        attachments: Array.isArray(proj.attachments) ? proj.attachments : def?.attachments || [],
      };
    });
}

function normalizeFacilityPolos(raw?: FacilityPolo[] | null): FacilityPolo[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return FACILITY_POLOS;
  }
  return raw
    .filter((p) => p && typeof p === 'object')
    .map((polo, idx) => ({
      ...polo,
      id: polo.id || `polo-${idx + 1}`,
      name: polo.name || 'Polo Esportivo Vitalizar',
      type: polo.type || 'polo_principal',
      capacity: polo.capacity || 'Atendimento comunitário',
      maxGuests: typeof polo.maxGuests === 'number' && polo.maxGuests > 0 ? polo.maxGuests : 50,
      address: polo.address || 'Cariacica - ES',
      description: polo.description || '',
      includedItems: Array.isArray(polo.includedItems) ? polo.includedItems : [],
      imageUrl:
        polo.imageUrl ||
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
      rules: Array.isArray(polo.rules) ? polo.rules : [],
    }));
}

function normalizeSponsors(raw?: Sponsor[] | null): Sponsor[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return INITIAL_SPONSORS;
  }
  return raw
    .filter((s) => s && typeof s === 'object')
    .map((spon, idx) => ({
      ...spon,
      id: spon.id || `patrocinador-${idx + 1}`,
      name: spon.name || 'Parceiro Institucional',
      tier: spon.tier || 'apoio',
      tierLabel: spon.tierLabel || 'Apoio Institucional',
      logoUrl:
        spon.logoUrl ||
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80',
      description: spon.description || '',
      category: spon.category || 'Parceiro',
      active: spon.active !== false,
      order: typeof spon.order === 'number' ? spon.order : idx + 1,
    }));
}


function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Site settings lists with personal data: stored in admin-only collections, never in the public site_settings doc
const PRIVATE_SETTINGS_COLLECTIONS = {
  donationPledges: 'donation_pledges',
  volunteers: 'volunteer_applications',
  attendanceSessions: 'attendance_sessions',
} as const;

function toPublicSiteSettings(settings: SiteSettings): SiteSettings {
  const { donationPledges, attendanceSessions, volunteers, ...publicSettings } = settings;
  return {
    ...publicSettings,
    // The site only lists active volunteers, without their contact or motivation
    volunteers: (volunteers || [])
      .filter((v) => v.status === 'ativo')
      .map((v) => ({ ...v, contactInfo: '', motivation: '' })),
  };
}

// Remote records win; records that only exist in this browser are kept after them
function mergeRemoteFirst<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const remoteIds = new Set(remote.map((item) => item.id));
  return [...remote.reverse(), ...local.filter((item) => !remoteIds.has(item.id))];
}

const ClubDataContext = createContext<ClubDataContextType | null>(null);

export const ClubDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Club Info
  const [clubInfo, setClubInfoState] = useState<typeof CLUB_INFO>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLUB_INFO);
      return saved ? normalizeClubInfo(JSON.parse(saved)) : CLUB_INFO;
    } catch {
      return CLUB_INFO;
    }
  });

  // 1b. Site Settings
  const [siteSettings, setSiteSettingsState] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SITE_SETTINGS);
      return saved ? normalizeSiteSettings(JSON.parse(saved)) : DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  // 2. News
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEWS);
      return saved ? normalizeNewsArticles(JSON.parse(saved)) : NEWS_ARTICLES;
    } catch {
      return NEWS_ARTICLES;
    }
  });

  // 3. Events
  const [events, setEvents] = useState<VitalizarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? normalizeEvents(JSON.parse(saved)) : VITALIZAR_EVENTS;
    } catch {
      return VITALIZAR_EVENTS;
    }
  });

  // 4. Projects
  const [projects, setProjects] = useState<VitalizarProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? normalizeProjects(JSON.parse(saved)) : VITALIZAR_PROJECTS;
    } catch {
      return VITALIZAR_PROJECTS;
    }
  });

  // 4b. Gallery Albums
  const [galleryAlbums, setGalleryAlbums] = useState<PastEventPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
      return saved ? normalizeGalleryAlbums(JSON.parse(saved)) : INITIAL_GALLERY_ALBUMS;
    } catch {
      return INITIAL_GALLERY_ALBUMS;
    }
  });

  // 5. Transparency Docs
  const [transparencyDocs, setTransparencyDocs] = useState<TransparencyDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSPARENCY);
      return saved ? normalizeTransparencyDocs(JSON.parse(saved)) : TRANSPARENCY_DOCUMENTS;
    } catch {
      return TRANSPARENCY_DOCUMENTS;
    }
  });

  // 5b. Sponsors & Partners
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPONSORS);
      return saved ? normalizeSponsors(JSON.parse(saved)) : INITIAL_SPONSORS;
    } catch {
      return INITIAL_SPONSORS;
    }
  });

  // 5c. Facility Polos & Spaces
  const [facilityPolos, setFacilityPolos] = useState<FacilityPolo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POLOS);
      return saved ? normalizeFacilityPolos(JSON.parse(saved)) : FACILITY_POLOS;
    } catch {
      return FACILITY_POLOS;
    }
  });

  // 5d. Scout Inquiries (Captação & Olheiros) - hydrated only for authorized roles
  const [scoutInquiries, setScoutInquiries] = useState<ScoutInquiryRecord[]>([]);

  // 6. RSVPs - hydrated only for authorized roles
  const [rsvps, setRsvps] = useState<EventRsvpRecord[]>([]);

  // 7. Contact Messages - hydrated only for authorized roles
  const [contactMessages, setContactMessages] = useState<ContactMessageRecord[]>([]);

  // 8. Audit Logs - hydrated only for admin/super_admin
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [participantPrivateMap, setParticipantPrivateMap] = useState<
    Record<string, ParticipantPrivateRecord>
  >({});

  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(true);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<AdminUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  // Set once an admin has loaded the private settings lists, so the public doc never overwrites them
  const privateSettingsLoaded = useRef(false);
  const authTokenRef = useRef<string | null>(null);

  const clearPrivateStateOnLogout = () => {
    privateSettingsLoaded.current = false;
    setRsvps([]);
    setContactMessages([]);
    setScoutInquiries([]);
    setAuditLogs([]);
    setParticipantPrivateMap({});
    setSiteSettingsState((prev) => toPublicSiteSettings(prev));
    try {
      localStorage.removeItem(STORAGE_KEYS.RSVPS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.SCOUT_INQUIRIES);
      localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_PRIVATE);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    } catch {
      // ignore
    }
  };

  const syncUserWithSqlBackend = async (
    token: string,
    profile?: AdminUserProfile | null
  ): Promise<AdminUserProfile | null> => {
    try {
      const r = await fetch('/api/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile?.nome,
        }),
      });
      if (!r.ok) return null;
      return (await r.json()) as AdminUserProfile;
    } catch {
      return null;
    }
  };

  const refreshUserProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      authTokenRef.current = null;
      setCurrentUserProfile(null);
      setAuthLoading(false);
      clearPrivateStateOnLogout();
      return;
    }
    const token = await user.getIdToken();
    authTokenRef.current = token;
    const res = await verifyFirebaseAdminAccess(user);
    const sqlProfile = await syncUserWithSqlBackend(token, res.profile);
    const resolvedProfile =
      res.profile?.role === 'visitante' &&
      sqlProfile &&
      sqlProfile.role !== 'visitante'
        ? sqlProfile
        : res.profile || sqlProfile || null;
    setCurrentUserProfile(resolvedProfile);
    setAuthLoading(false);
  };

  // Sync initial data from Cloud SQL (/api/bootstrap) and Firestore if available
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromRemote() {
      try {
        const [
          sqlRes,
          clubRes,
          settingsRes,
          newsRes,
          sponsorsRes,
          eventsRes,
          projectsRes,
          galleryRes,
          docsRes,
          polosRes,
        ] = await Promise.allSettled([
          fetch('/api/bootstrap').then((r) => (r.ok ? r.json() : null)),
          getDoc(doc(db, 'club_info', 'main')),
          getDoc(doc(db, 'site_settings', 'main')),
          getDocs(collection(db, 'news_articles')),
          getDocs(collection(db, 'sponsors')),
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'gallery_albums')),
          getDocs(collection(db, 'transparency_docs')),
          getDocs(collection(db, 'facility_polos')),
        ]);

        if (!isMounted) return;

        const sqlCols: Record<string, any[]> =
          sqlRes.status === 'fulfilled' && sqlRes.value?.collections
            ? sqlRes.value.collections
            : {};

        const rawClub =
          Array.isArray(sqlCols.club_info) && sqlCols.club_info.length > 0
            ? sqlCols.club_info[0]
            : clubRes.status === 'fulfilled' && clubRes.value.exists()
            ? clubRes.value.data()
            : null;
        if (rawClub) {
          const remoteData = normalizeClubInfo(rawClub as Partial<typeof CLUB_INFO>);
          setClubInfoState(remoteData);
          localStorage.setItem(STORAGE_KEYS.CLUB_INFO, JSON.stringify(remoteData));
        }

        const rawSettings =
          Array.isArray(sqlCols.site_settings) && sqlCols.site_settings.length > 0
            ? sqlCols.site_settings[0]
            : settingsRes.status === 'fulfilled' && settingsRes.value.exists()
            ? settingsRes.value.data()
            : null;
        if (rawSettings) {
          const remoteSettings = normalizeSiteSettings(rawSettings as Partial<SiteSettings>);
          setSiteSettingsState((prev) => {
            const merged = privateSettingsLoaded.current
              ? {
                  ...remoteSettings,
                  donationPledges: prev.donationPledges,
                  volunteers: prev.volunteers,
                  attendanceSessions: prev.attendanceSessions,
                }
              : remoteSettings;
            localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(merged));
            return merged;
          });
        }

        const rawNews =
          Array.isArray(sqlCols.news_articles) && sqlCols.news_articles.length > 0
            ? sqlCols.news_articles
            : newsRes.status === 'fulfilled' && !newsRes.value.empty
            ? newsRes.value.docs.map((d) => d.data())
            : null;
        if (rawNews) {
          const remoteNews = normalizeNewsArticles(rawNews as NewsArticle[]);
          setNewsArticles(remoteNews);
          localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(remoteNews));
        }

        const rawSponsors =
          Array.isArray(sqlCols.sponsors) && sqlCols.sponsors.length > 0
            ? sqlCols.sponsors
            : sponsorsRes.status === 'fulfilled' && !sponsorsRes.value.empty
            ? sponsorsRes.value.docs.map((d) => d.data())
            : null;
        if (rawSponsors) {
          const remoteSponsors = normalizeSponsors(rawSponsors as Sponsor[]);
          remoteSponsors.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSponsors(remoteSponsors);
          localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(remoteSponsors));
        }

        const rawEvents =
          Array.isArray(sqlCols.events) && sqlCols.events.length > 0
            ? sqlCols.events
            : eventsRes.status === 'fulfilled' && !eventsRes.value.empty
            ? eventsRes.value.docs.map((d) => d.data())
            : null;
        if (rawEvents) {
          const remoteEvents = normalizeEvents(rawEvents as VitalizarEvent[]);
          setEvents(remoteEvents);
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(remoteEvents));
        }

        const rawProjects =
          Array.isArray(sqlCols.projects) && sqlCols.projects.length > 0
            ? sqlCols.projects
            : projectsRes.status === 'fulfilled' && !projectsRes.value.empty
            ? projectsRes.value.docs.map((d) => d.data())
            : null;
        if (rawProjects) {
          const remoteProjects = normalizeProjects(rawProjects as VitalizarProject[]);
          setProjects(remoteProjects);
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(remoteProjects));
        }

        const rawGallery =
          Array.isArray(sqlCols.gallery_albums) && sqlCols.gallery_albums.length > 0
            ? sqlCols.gallery_albums
            : galleryRes.status === 'fulfilled' && !galleryRes.value.empty
            ? galleryRes.value.docs.map((d) => d.data())
            : null;
        if (rawGallery) {
          const remoteAlbums = normalizeGalleryAlbums(rawGallery as PastEventPhoto[]);
          setGalleryAlbums(remoteAlbums);
          localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(remoteAlbums));
        }

        const rawDocs =
          Array.isArray(sqlCols.transparency_docs) && sqlCols.transparency_docs.length > 0
            ? sqlCols.transparency_docs
            : docsRes.status === 'fulfilled' && !docsRes.value.empty
            ? docsRes.value.docs.map((d) => d.data())
            : null;
        if (rawDocs) {
          const remoteDocs = normalizeTransparencyDocs(rawDocs as TransparencyDocument[]);
          setTransparencyDocs(remoteDocs);
          localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(remoteDocs));
        }

        const rawPolos =
          Array.isArray(sqlCols.facility_polos) && sqlCols.facility_polos.length > 0
            ? sqlCols.facility_polos
            : polosRes.status === 'fulfilled' && !polosRes.value.empty
            ? polosRes.value.docs.map((d) => d.data())
            : null;
        if (rawPolos) {
          const remotePolos = normalizeFacilityPolos(rawPolos as FacilityPolo[]);
          setFacilityPolos(remotePolos);
          localStorage.setItem(STORAGE_KEYS.POLOS, JSON.stringify(remotePolos));
        }

        setIsFirebaseActive(true);
      } catch (err) {
        console.info('Banco remoto offline ou em fallback local:', err);
      }
    }
    hydrateFromRemote();
    return () => {
      isMounted = false;
    };
  }, []);

  // Role-scoped private records: hydrated from Cloud SQL and Firestore strictly according to user role
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        authTokenRef.current = null;
        setCurrentUserProfile(null);
        setAuthLoading(false);
        clearPrivateStateOnLogout();
        return;
      }
      setAuthLoading(true);
      const token = await user.getIdToken().catch(() => null);
      authTokenRef.current = token;
      const [accessRes, sqlProfile] = await Promise.all([
        verifyFirebaseAdminAccess(user),
        token ? syncUserWithSqlBackend(token, null) : Promise.resolve(null),
      ]);
      const activeProfile =
        accessRes.profile?.role === 'visitante' &&
        sqlProfile &&
        sqlProfile.role !== 'visitante'
          ? sqlProfile
          : accessRes.profile || sqlProfile || null;

      setCurrentUserProfile(activeProfile);
      setAuthLoading(false);

      if (!activeProfile || !activeProfile.ativo) {
        clearPrivateStateOnLogout();
        return;
      }

      const role = activeProfile.role;
      const readableCols = new Set(getReadablePrivateCollections(role));
      const profProjectIds = (activeProfile.projectIds || []).slice(0, 30);

      const queryFsCollection = (colName: string) => {
        if (!readableCols.has(colName)) return Promise.resolve(null);
        if (role === 'professor') {
          if (profProjectIds.length === 0) return Promise.resolve(null);
          return getDocs(
            query(collection(db, colName), where('projectId', 'in', profProjectIds))
          );
        }
        if (role === 'visitante' || role === 'apoiador') {
          return getDocs(
            query(collection(db, colName), where('userId', '==', user.uid))
          );
        }
        return getDocs(collection(db, colName));
      };

      const [
        sqlAdminRes,
        rsvpRes,
        msgRes,
        scoutRes,
        pledgeRes,
        volRes,
        attendanceRes,
        partPrivRes,
        logsRes,
      ] = await Promise.allSettled([
        token
          ? fetch('/api/admin/bootstrap', {
              headers: { Authorization: `Bearer ${token}` },
            }).then((r) => (r.ok ? r.json() : null))
          : Promise.resolve(null),
        queryFsCollection('rsvps'),
        queryFsCollection('contact_messages'),
        queryFsCollection('scout_inquiries'),
        queryFsCollection(PRIVATE_SETTINGS_COLLECTIONS.donationPledges),
        queryFsCollection(PRIVATE_SETTINGS_COLLECTIONS.volunteers),
        queryFsCollection(PRIVATE_SETTINGS_COLLECTIONS.attendanceSessions),
        queryFsCollection('participant_private'),
        queryFsCollection('audit_logs'),
      ]);

      const sqlAdminCols: Record<string, any[]> =
        sqlAdminRes.status === 'fulfilled' && sqlAdminRes.value?.collections
          ? sqlAdminRes.value.collections
          : {};

      const extractDocs = <T,>(
        res: PromiseSettledResult<Awaited<ReturnType<typeof getDocs>> | null>
      ): T[] =>
        res.status === 'fulfilled' && res.value
          ? res.value.docs.map((d) => ({ ...(d.data() as T), id: (d.data() as any).id || d.id }))
          : [];

      const rawCombined = {
        rsvps: mergeRemoteFirst(
          (sqlAdminCols.rsvps || []) as EventRsvpRecord[],
          extractDocs<EventRsvpRecord>(rsvpRes)
        ),
        contact_messages: mergeRemoteFirst(
          (sqlAdminCols.contact_messages || []) as ContactMessageRecord[],
          extractDocs<ContactMessageRecord>(msgRes)
        ),
        scout_inquiries: mergeRemoteFirst(
          (sqlAdminCols.scout_inquiries || []) as ScoutInquiryRecord[],
          extractDocs<ScoutInquiryRecord>(scoutRes)
        ),
        donation_pledges: mergeRemoteFirst(
          (sqlAdminCols.donation_pledges || []) as DonationPledgeRecord[],
          extractDocs<DonationPledgeRecord>(pledgeRes)
        ),
        volunteer_applications: mergeRemoteFirst(
          (sqlAdminCols.volunteer_applications || []) as VolunteerApplicationRecord[],
          extractDocs<VolunteerApplicationRecord>(volRes)
        ),
        attendance_sessions: mergeRemoteFirst(
          (sqlAdminCols.attendance_sessions || []) as AttendanceSessionRecord[],
          extractDocs<AttendanceSessionRecord>(attendanceRes)
        ),
        participant_private: mergeRemoteFirst(
          (sqlAdminCols.participant_private || []) as ParticipantPrivateRecord[],
          extractDocs<ParticipantPrivateRecord>(partPrivRes)
        ),
        audit_logs: mergeRemoteFirst(
          (sqlAdminCols.audit_logs || []) as AuditLogEntry[],
          extractDocs<AuditLogEntry>(logsRes)
        ),
      };

      const filtered = filterPrivateCollectionsForUser(
        rawCombined,
        activeProfile,
        projects
      );

      setRsvps(filtered.rsvps as EventRsvpRecord[]);
      setContactMessages(filtered.contact_messages as ContactMessageRecord[]);
      setScoutInquiries(filtered.scout_inquiries as ScoutInquiryRecord[]);

      const privMap: Record<string, ParticipantPrivateRecord> = {};
      if (role === 'super_admin' || role === 'admin' || role === 'professor') {
        const allowedProjSet =
          role === 'professor' ? new Set(activeProfile.projectIds || []) : null;
        VITALIZAR_PROJECTS.forEach((pr) => {
          if (allowedProjSet && !allowedProjSet.has(pr.id)) return;
          (pr.participants || []).forEach((pt) => {
            const { privateRecord } = splitParticipantPublicAndPrivate(pt, pr.id);
            privMap[pt.id] = privateRecord;
          });
        });
      }
      (filtered.participant_private as ParticipantPrivateRecord[]).forEach((rec) => {
        if (rec?.id) privMap[rec.id] = rec;
      });
      setParticipantPrivateMap(privMap);

      const nextLogs = (filtered.audit_logs as AuditLogEntry[]).sort((a, b) =>
        (b.timestamp || '').localeCompare(a.timestamp || '')
      );
      setAuditLogs(nextLogs.slice(0, 200));

      privateSettingsLoaded.current = true;
      setSiteSettingsState((prev) => ({
        ...prev,
        donationPledges: filtered.donation_pledges as DonationPledgeRecord[],
        volunteers:
          role === 'super_admin' || role === 'admin'
            ? (filtered.volunteer_applications as VolunteerApplicationRecord[])
            : prev.volunteers,
        attendanceSessions: filtered.attendance_sessions as AttendanceSessionRecord[],
      }));

      // If user is admin/super_admin, ensure empty public collections in Cloud SQL & Firestore are seeded
      if (role === 'super_admin' || role === 'admin') {
        try {
          const seedSql = (collectionName: string, itemId: string, payload: unknown) => {
            if (!token) return Promise.resolve();
            return fetch(`/api/collections/${encodeURIComponent(collectionName)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ itemId, payload }),
            }).catch(() => {});
          };

          const [
            sqlBootRes,
            pubClub,
            pubSettings,
            pubSponsors,
            pubNews,
            pubEvents,
            pubProjects,
            pubGallery,
            pubDocs,
            pubPolos,
          ] = await Promise.allSettled([
            fetch('/api/bootstrap').then((r) => (r.ok ? r.json() : null)),
            getDoc(doc(db, 'club_info', 'main')),
            getDoc(doc(db, 'site_settings', 'main')),
            getDocs(collection(db, 'sponsors')),
            getDocs(collection(db, 'news_articles')),
            getDocs(collection(db, 'events')),
            getDocs(collection(db, 'projects')),
            getDocs(collection(db, 'gallery_albums')),
            getDocs(collection(db, 'transparency_docs')),
            getDocs(collection(db, 'facility_polos')),
          ]);

          const sqlPublicCols: Record<string, any[]> =
            sqlBootRes.status === 'fulfilled' && sqlBootRes.value?.collections
              ? sqlBootRes.value.collections
              : {};

          const seedWrites: Promise<unknown>[] = [];
          const cleanClub = sanitizeForFirestore(normalizeClubInfo(CLUB_INFO));
          if (pubClub.status === 'fulfilled' && !pubClub.value.exists()) {
            seedWrites.push(setDoc(doc(db, 'club_info', 'main'), cleanClub));
          }
          if (!sqlPublicCols.club_info?.length) {
            seedWrites.push(seedSql('club_info', 'main', cleanClub));
          }

          const cleanSettings = sanitizeForFirestore(
            toPublicSiteSettings(normalizeSiteSettings(DEFAULT_SITE_SETTINGS))
          );
          if (pubSettings.status === 'fulfilled' && !pubSettings.value.exists()) {
            seedWrites.push(setDoc(doc(db, 'site_settings', 'main'), cleanSettings));
          }
          if (!sqlPublicCols.site_settings?.length) {
            seedWrites.push(seedSql('site_settings', 'main', cleanSettings));
          }

          if (pubSponsors.status === 'fulfilled' && pubSponsors.value.empty) {
            normalizeSponsors(INITIAL_SPONSORS).forEach((s) => {
              seedWrites.push(setDoc(doc(db, 'sponsors', s.id), sanitizeForFirestore(s)));
            });
          }
          if (!sqlPublicCols.sponsors?.length) {
            normalizeSponsors(INITIAL_SPONSORS).forEach((s) => {
              seedWrites.push(seedSql('sponsors', s.id, sanitizeForFirestore(s)));
            });
          }

          if (pubNews.status === 'fulfilled' && pubNews.value.empty) {
            normalizeNewsArticles(NEWS_ARTICLES).forEach((n) => {
              seedWrites.push(setDoc(doc(db, 'news_articles', n.id), sanitizeForFirestore(n)));
            });
          }
          if (!sqlPublicCols.news_articles?.length) {
            normalizeNewsArticles(NEWS_ARTICLES).forEach((n) => {
              seedWrites.push(seedSql('news_articles', n.id, sanitizeForFirestore(n)));
            });
          }

          if (pubEvents.status === 'fulfilled' && pubEvents.value.empty) {
            normalizeEvents(VITALIZAR_EVENTS).forEach((ev) => {
              seedWrites.push(setDoc(doc(db, 'events', ev.id), sanitizeForFirestore(ev)));
            });
          }
          if (!sqlPublicCols.events?.length) {
            normalizeEvents(VITALIZAR_EVENTS).forEach((ev) => {
              seedWrites.push(seedSql('events', ev.id, sanitizeForFirestore(ev)));
            });
          }

          if (pubProjects.status === 'fulfilled' && pubProjects.value.empty) {
            normalizeProjects(VITALIZAR_PROJECTS).forEach((proj) => {
              const publicParticipants = (proj.participants || []).map(
                (pt) => splitParticipantPublicAndPrivate(pt, proj.id).publicParticipant
              );
              seedWrites.push(
                setDoc(
                  doc(db, 'projects', proj.id),
                  sanitizeForFirestore({ ...proj, participants: publicParticipants })
                )
              );
            });
          }
          if (!sqlPublicCols.projects?.length) {
            normalizeProjects(VITALIZAR_PROJECTS).forEach((proj) => {
              const publicParticipants = (proj.participants || []).map(
                (pt) => splitParticipantPublicAndPrivate(pt, proj.id).publicParticipant
              );
              seedWrites.push(
                seedSql(
                  'projects',
                  proj.id,
                  sanitizeForFirestore({ ...proj, participants: publicParticipants })
                )
              );
            });
          }

          if (pubGallery.status === 'fulfilled' && pubGallery.value.empty) {
            normalizeGalleryAlbums(INITIAL_GALLERY_ALBUMS).forEach((alb) => {
              seedWrites.push(setDoc(doc(db, 'gallery_albums', alb.id), sanitizeForFirestore(alb)));
            });
          }
          if (!sqlPublicCols.gallery_albums?.length) {
            normalizeGalleryAlbums(INITIAL_GALLERY_ALBUMS).forEach((alb) => {
              seedWrites.push(seedSql('gallery_albums', alb.id, sanitizeForFirestore(alb)));
            });
          }

          if (pubDocs.status === 'fulfilled' && pubDocs.value.empty) {
            normalizeTransparencyDocs(TRANSPARENCY_DOCUMENTS).forEach((td) => {
              seedWrites.push(setDoc(doc(db, 'transparency_docs', td.id), sanitizeForFirestore(td)));
            });
          }
          if (!sqlPublicCols.transparency_docs?.length) {
            normalizeTransparencyDocs(TRANSPARENCY_DOCUMENTS).forEach((td) => {
              seedWrites.push(seedSql('transparency_docs', td.id, sanitizeForFirestore(td)));
            });
          }

          if (pubPolos.status === 'fulfilled' && pubPolos.value.empty) {
            normalizeFacilityPolos(FACILITY_POLOS).forEach((pl) => {
              seedWrites.push(setDoc(doc(db, 'facility_polos', pl.id), sanitizeForFirestore(pl)));
            });
          }
          if (!sqlPublicCols.facility_polos?.length) {
            normalizeFacilityPolos(FACILITY_POLOS).forEach((pl) => {
              seedWrites.push(seedSql('facility_polos', pl.id, sanitizeForFirestore(pl)));
            });
          }

          if (seedWrites.length > 0) {
            await Promise.allSettled(seedWrites);
          }
        } catch {
          // Ignore background seeding errors
        }
      }
    });
  }, []);

  // 9. Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const persistAdminRecordToSql = (collectionName: string, itemId: string, payload: unknown) => {
    if (!authTokenRef.current) return Promise.resolve(false);
    return fetch(`/api/collections/${encodeURIComponent(collectionName)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authTokenRef.current}`,
      },
      body: JSON.stringify({ itemId, payload }),
    })
      .then((r) => r.ok)
      .catch(() => false);
  };

  const addAuditLog = (action: string, details?: string, adminEmail?: string) => {
    const email = adminEmail || auth.currentUser?.email || 'sistema@vitalizar.org.br';
    const entry = createAuditLogEntry(action, email, details);
    setAuditLogs((prev) => {
      const updated = [entry, ...prev].slice(0, 200);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
      return updated;
    });
    const sanitized = sanitizeForFirestore(entry);
    if (auth.currentUser) {
      setDoc(doc(db, 'audit_logs', entry.id), sanitized).catch(() => {});
      persistAdminRecordToSql('audit_logs', entry.id, sanitized);
    }
  };

  const recordAuditEvent = (params: {
    action: string;
    collection: string;
    itemId: string;
    beforeSummary?: string;
    afterSummary?: string;
    details?: string;
    role?: string;
  }) => {
    const email = auth.currentUser?.email || 'admin@vitalizar.org.br';
    const entry = createAuditLogEntry(
      params.action,
      email,
      params.details || `${params.collection}/${params.itemId}`,
      new Date().toISOString(),
      {
        role: params.role,
        collection: params.collection,
        itemId: params.itemId,
        beforeSummary: params.beforeSummary,
        afterSummary: params.afterSummary,
      }
    );
    setAuditLogs((prev) => {
      const updated = [entry, ...prev].slice(0, 200);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
      return updated;
    });
    const sanitized = sanitizeForFirestore(entry);
    if (auth.currentUser) {
      setDoc(doc(db, 'audit_logs', entry.id), sanitized).catch(() => {});
      persistAdminRecordToSql('audit_logs', entry.id, sanitized);
    }
  };

  const saveParticipantPrivate = async (record: ParticipantPrivateRecord) => {
    setParticipantPrivateMap((prev) => {
      const next = { ...prev, [record.id]: record };
      localStorage.setItem(STORAGE_KEYS.PARTICIPANT_PRIVATE, JSON.stringify(next));
      return next;
    });
    const sanitized = sanitizeForFirestore(record);
    await Promise.allSettled([
      setDoc(doc(db, 'participant_private', record.id), sanitized),
      persistAdminRecordToSql('participant_private', record.id, sanitized),
    ]);
  };

  // Visitor submissions: the admin only sees them if this write reaches Firestore, so tell the visitor when it fails
  const submitRecord = (collectionName: string, record: { id: string }) => {
    const sanitized = sanitizeForFirestore(record);
    fetch(`/api/submissions/${encodeURIComponent(collectionName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: record.id, payload: sanitized }),
    }).catch(() => {});
    Promise.resolve()
      .then(() => setDoc(doc(db, collectionName, record.id), sanitized))
      .catch((err) => {
        console.warn(`Firestore: envio para ${collectionName} falhou:`, err);
        showToast(
          'Não foi possível enviar seus dados à Associação agora. Tente novamente ou fale conosco pelo WhatsApp.',
          'error'
        );
      });
  };

  const addDonationPledge = (pledge: DonationPledgeRecord) => {
    const enrichedPledge: DonationPledgeRecord = {
      ...pledge,
      ...(auth.currentUser?.uid ? { userId: auth.currentUser.uid } : {}),
      ...(auth.currentUser?.email ? { donorEmail: auth.currentUser.email } : {}),
    };
    setSiteSettingsState((prev) => {
      const updated = {
        ...prev,
        donationPledges: [enrichedPledge, ...(prev.donationPledges || [])],
      };
      localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(updated));
      return updated;
    });
    submitRecord(PRIVATE_SETTINGS_COLLECTIONS.donationPledges, enrichedPledge);
    if (auth.currentUser?.uid) {
      promoteVisitorToSupporter(auth.currentUser.uid).catch(() => {});
    }
  };

  const addVolunteerApplication = (application: VolunteerApplicationRecord) => {
    setSiteSettingsState((prev) => {
      const updated = { ...prev, volunteers: [application, ...(prev.volunteers || [])] };
      localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(updated));
      return updated;
    });
    submitRecord(PRIVATE_SETTINGS_COLLECTIONS.volunteers, application);
  };

  // RSVPs
  const addRsvp = (rsvpData: Omit<EventRsvpRecord, 'id' | 'confirmationCode' | 'date'>): string => {
    const confirmationCode = `VTL-${rsvpData.eventId.toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isProjectEnrollment =
      Boolean(rsvpData.projectId) || rsvpData.eventId.startsWith('inscricao-');
    const newRsvp: EventRsvpRecord = {
      ...rsvpData,
      id: `rsvp-${Date.now()}`,
      confirmationCode,
      date: new Date().toLocaleString('pt-BR'),
      ...(isProjectEnrollment && !rsvpData.enrollmentStatus
        ? { enrollmentStatus: 'pendente' }
        : {}),
      ...(auth.currentUser?.uid && !rsvpData.userId ? { userId: auth.currentUser.uid } : {}),
      ...(auth.currentUser?.email && !rsvpData.email ? { email: auth.currentUser.email } : {}),
    };

    setRsvps((prev) => {
      const updated = [newRsvp, ...prev];
      localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(updated));
      return updated;
    });

    setEvents((prev) => {
      const updated = prev.map((ev) => {
        if (ev.id === rsvpData.eventId) {
          const newSpots = Math.max(0, ev.availableSpots - rsvpData.spots);
          return {
            ...ev,
            availableSpots: newSpots,
            status: newSpots === 0 ? 'em_breve' : newSpots <= 5 ? 'vagas_limitadas' : ev.status,
          };
        }
        return ev;
      });
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      return updated;
    });

    addAuditLog('RSVP_REGISTRADO', `Inscrição de ${rsvpData.name} no evento "${rsvpData.eventTitle}" (${rsvpData.spots} vaga(s)).`);
    submitRecord('rsvps', newRsvp);

    return confirmationCode;
  };

  // Contact Messages
  const addContactMessage = (msgData: Omit<ContactMessageRecord, 'id' | 'date' | 'read'>) => {
    const newMsg: ContactMessageRecord = {
      ...msgData,
      id: `msg-${Date.now()}`,
      date: new Date().toLocaleString('pt-BR'),
      read: false,
    };
    setContactMessages((prev) => {
      const updated = [newMsg, ...prev];
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('MENSAGEM_RECEBIDA', `Contato recebido de ${msgData.name} - Assunto: ${msgData.subject}`);
    submitRecord('contact_messages', newMsg);
  };

  // Scout Inquiries & Space Reservations helpers
  const addScoutInquiry = (
    inquiryData: Omit<ScoutInquiryRecord, 'id' | 'protocol' | 'createdAt' | 'status'>
  ): string => {
    const protocol = `SCT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInquiry: ScoutInquiryRecord = {
      ...inquiryData,
      id: `scout-${Date.now()}`,
      protocol,
      createdAt: new Date().toLocaleString('pt-BR'),
      status: 'nova',
    };
    setScoutInquiries((prev) => {
      const updated = [newInquiry, ...prev];
      localStorage.setItem(STORAGE_KEYS.SCOUT_INQUIRIES, JSON.stringify(updated));
      return updated;
    });
    addAuditLog(
      'SONDAGem_OLHEIRO_RECEBIDA',
      `Proposta de captação (${protocol}) de ${inquiryData.scoutName} (${inquiryData.organization}) para ${inquiryData.targetPlayerName || inquiryData.targetCategory}.`
    );
    submitRecord('scout_inquiries', newInquiry);
    return protocol;
  };

  // Reset to Defaults
  const resetAllToDefaults = () => {
    localStorage.removeItem(STORAGE_KEYS.CLUB_INFO);
    localStorage.removeItem(STORAGE_KEYS.SITE_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.NEWS);
    localStorage.removeItem(STORAGE_KEYS.SPONSORS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.GALLERY);
    localStorage.removeItem(STORAGE_KEYS.TRANSPARENCY);
    localStorage.removeItem(STORAGE_KEYS.POLOS);
    localStorage.removeItem(STORAGE_KEYS.SCOUT_INQUIRIES);
    localStorage.removeItem(STORAGE_KEYS.RSVPS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);

    setClubInfoState(CLUB_INFO);
    setSiteSettingsState(DEFAULT_SITE_SETTINGS);
    setNewsArticles(NEWS_ARTICLES);
    setSponsors(INITIAL_SPONSORS);
    setEvents(VITALIZAR_EVENTS);
    setProjects(VITALIZAR_PROJECTS);
    setGalleryAlbums(INITIAL_GALLERY_ALBUMS);
    setTransparencyDocs(TRANSPARENCY_DOCUMENTS);
    setFacilityPolos(FACILITY_POLOS);
    setScoutInquiries([]);
    setRsvps([]);
    setContactMessages([]);

    addAuditLog('REDEFINICAO_COMPLETA', 'Todos os dados foram redefinidos para os padrões da Associação Vitalizar.');
    showToast('Dados restaurados para os padrões originais com sucesso!', 'info');
  };

  // Export / Import
  const exportDatabaseJson = (): string => {
    const payload = {
      version: '1.4',
      exportDate: new Date().toISOString(),
      clubInfo,
      siteSettings,
      newsArticles,
      sponsors,
      events,
      projects,
      galleryAlbums,
      transparencyDocs,
      facilityPolos,
      scoutInquiries,
      rsvps,
      contactMessages,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDatabaseJson = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      const validation = validateBackupSchema(parsed);
      if (!validation.valid) {
        return { success: false, message: `Erro de formato: ${validation.errors.join(', ')}` };
      }

      if (parsed.clubInfo) {
        const normalizedClub = normalizeClubInfo(parsed.clubInfo);
        setClubInfoState(normalizedClub);
        localStorage.setItem(STORAGE_KEYS.CLUB_INFO, JSON.stringify(normalizedClub));
      }
      if (parsed.siteSettings) {
        const mergedSettings = normalizeSiteSettings(parsed.siteSettings);
        setSiteSettingsState(mergedSettings);
        localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(mergedSettings));
      }
      if (Array.isArray(parsed.newsArticles)) {
        const normalizedNews = normalizeNewsArticles(parsed.newsArticles);
        setNewsArticles(normalizedNews);
        localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(normalizedNews));
      }
      if (Array.isArray(parsed.sponsors)) {
        const normalizedSponsors = normalizeSponsors(parsed.sponsors);
        setSponsors(normalizedSponsors);
        localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(normalizedSponsors));
      }
      if (Array.isArray(parsed.events)) {
        const normalizedEvents = normalizeEvents(parsed.events);
        setEvents(normalizedEvents);
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(normalizedEvents));
      }
      if (Array.isArray(parsed.projects)) {
        const normalizedProjects = normalizeProjects(parsed.projects);
        setProjects(normalizedProjects);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(normalizedProjects));
      }
      if (Array.isArray(parsed.galleryAlbums)) {
        const normalizedAlbums = normalizeGalleryAlbums(parsed.galleryAlbums);
        setGalleryAlbums(normalizedAlbums);
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(normalizedAlbums));
      }
      if (Array.isArray(parsed.transparencyDocs)) {
        const normalizedDocs = normalizeTransparencyDocs(parsed.transparencyDocs);
        setTransparencyDocs(normalizedDocs);
        localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(normalizedDocs));
      }
      if (Array.isArray(parsed.facilityPolos)) {
        const normalizedPolos = normalizeFacilityPolos(parsed.facilityPolos);
        setFacilityPolos(normalizedPolos);
        localStorage.setItem(STORAGE_KEYS.POLOS, JSON.stringify(normalizedPolos));
      }
      if (Array.isArray(parsed.scoutInquiries)) {
        setScoutInquiries(parsed.scoutInquiries);
        localStorage.setItem(STORAGE_KEYS.SCOUT_INQUIRIES, JSON.stringify(parsed.scoutInquiries));
      }
      if (Array.isArray(parsed.rsvps)) {
        setRsvps(parsed.rsvps);
        localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(parsed.rsvps));
      }
      if (Array.isArray(parsed.contactMessages)) {
        setContactMessages(parsed.contactMessages);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(parsed.contactMessages));
      }

      addAuditLog('BACKUP_RESTAURADO', 'Backup importado com sucesso.');
      showToast('Backup importado com sucesso!');
      return { success: true, message: 'Banco de dados restaurado com sucesso!' };
    } catch {
      return { success: false, message: 'Arquivo JSON inválido, corrompido ou excede o limite de memória do navegador.' };
    }
  };

  const clearAuditLogs = () => {
    const initial = [
      createAuditLogEntry(
        'LOGS_LIMPOS',
        'admin@vitalizar.org.br',
        'Histórico de auditoria reiniciado pelo administrador.'
      ),
    ];
    setAuditLogs(initial);
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(initial));
    } catch {
      // ignore quota error
    }
    showToast('Histórico de auditoria limpo com sucesso!', 'info');
  };

  const saveAdminChanges = (payload: {
    clubInfo?: typeof CLUB_INFO;
    siteSettings?: SiteSettings;
    newsArticles?: NewsArticle[];
    sponsors?: Sponsor[];
    events?: VitalizarEvent[];
    projects?: VitalizarProject[];
    galleryAlbums?: PastEventPhoto[];
    transparencyDocs?: TransparencyDocument[];
    facilityPolos?: FacilityPolo[];
    scoutInquiries?: ScoutInquiryRecord[];
    rsvps?: EventRsvpRecord[];
    contactMessages?: ContactMessageRecord[];
    logDetails?: string;
    toastMessage?: string;
  }, logMessage?: string): boolean => {
    try {
      if (payload.clubInfo !== undefined) {
        const safeClub = normalizeClubInfo(payload.clubInfo);
        localStorage.setItem(STORAGE_KEYS.CLUB_INFO, JSON.stringify(safeClub));
        setClubInfoState(safeClub);
      }
      if (payload.siteSettings !== undefined) {
        const safeSettings = normalizeSiteSettings(payload.siteSettings);
        localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(safeSettings));
        setSiteSettingsState(safeSettings);
      }
      if (payload.newsArticles !== undefined) {
        const safeNews = normalizeNewsArticles(payload.newsArticles);
        localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(safeNews));
        setNewsArticles(safeNews);
      }
      if (payload.sponsors !== undefined) {
        const safeSponsors = normalizeSponsors(payload.sponsors);
        localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(safeSponsors));
        setSponsors(safeSponsors);
      }
      if (payload.events !== undefined) {
        const safeEvents = normalizeEvents(payload.events);
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(safeEvents));
        setEvents(safeEvents);
      }
      if (payload.projects !== undefined) {
        const safeProjects = normalizeProjects(payload.projects);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(safeProjects));
        setProjects(safeProjects);
      }
      if (payload.galleryAlbums !== undefined) {
        const safeAlbums = normalizeGalleryAlbums(payload.galleryAlbums);
        localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(safeAlbums));
        setGalleryAlbums(safeAlbums);
      }
      if (payload.transparencyDocs !== undefined) {
        const safeDocs = normalizeTransparencyDocs(payload.transparencyDocs);
        localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(safeDocs));
        setTransparencyDocs(safeDocs);
      }
      if (payload.facilityPolos !== undefined) {
        const safePolos = normalizeFacilityPolos(payload.facilityPolos);
        localStorage.setItem(STORAGE_KEYS.POLOS, JSON.stringify(safePolos));
        setFacilityPolos(safePolos);
      }
      if (payload.scoutInquiries !== undefined) {
        localStorage.setItem(STORAGE_KEYS.SCOUT_INQUIRIES, JSON.stringify(payload.scoutInquiries));
        setScoutInquiries(payload.scoutInquiries);
      }
      if (payload.rsvps !== undefined) {
        localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(payload.rsvps));
        setRsvps(payload.rsvps);
      }
      if (payload.contactMessages !== undefined) {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(payload.contactMessages));
        setContactMessages(payload.contactMessages);
      }

      // Publish to Cloud SQL & Firestore: write each item, delete removed ones, and succeed if either backend succeeds
      const writes: Promise<unknown>[] = [];
      const put = (collectionName: string, id: string, data: unknown) => {
        const sanitized = sanitizeForFirestore(data);
        const fsWrite = Promise.resolve().then(() =>
          setDoc(doc(db, collectionName, id), sanitized)
        );
        const sqlWrite = authTokenRef.current
          ? fetch(`/api/collections/${encodeURIComponent(collectionName)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authTokenRef.current}`,
              },
              body: JSON.stringify({ itemId: id, payload: sanitized }),
            }).then((r) => {
              if (!r.ok) throw new Error(`SQL HTTP ${r.status}`);
              return r.json();
            })
          : Promise.reject(new Error('Sem token para Cloud SQL'));

        writes.push(
          Promise.allSettled([sqlWrite, fsWrite]).then(([sqlRes, fsRes]) => {
            if (sqlRes.status === 'fulfilled' || fsRes.status === 'fulfilled') {
              return true;
            }
            throw fsRes.reason || sqlRes.reason;
          })
        );
      };
      const syncList = <T extends { id: string }>(
        collectionName: string,
        next: T[],
        prev: T[],
        onlyChanged = false
      ) => {
        const prevById = new Map(prev.map((item) => [item.id, JSON.stringify(item)]));
        next.forEach((item) => {
          if (!onlyChanged || prevById.get(item.id) !== JSON.stringify(item)) {
            put(collectionName, item.id, item);
          }
        });
        const nextIds = new Set(next.map((item) => item.id));
        prev.forEach((item) => {
          if (!nextIds.has(item.id)) {
            const fsDel = Promise.resolve().then(() =>
              deleteDoc(doc(db, collectionName, item.id))
            );
            const sqlDel = authTokenRef.current
              ? fetch(
                  `/api/collections/${encodeURIComponent(collectionName)}/${encodeURIComponent(item.id)}`,
                  {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${authTokenRef.current}` },
                  }
                ).then((r) => {
                  if (!r.ok) throw new Error(`SQL HTTP ${r.status}`);
                  return true;
                })
              : Promise.reject(new Error('Sem token para Cloud SQL'));
            writes.push(
              Promise.allSettled([sqlDel, fsDel]).then(([sqlRes, fsRes]) => {
                if (sqlRes.status === 'fulfilled' || fsRes.status === 'fulfilled') {
                  return true;
                }
                throw fsRes.reason || sqlRes.reason;
              })
            );
          }
        });
      };

      const userRole = currentUserProfile?.role || 'visitante';

      if (payload.clubInfo !== undefined && canRoleWriteCollection(userRole, 'club_info')) {
        put('club_info', 'main', normalizeClubInfo(payload.clubInfo));
      }
      if (payload.siteSettings !== undefined) {
        const safeSettings = normalizeSiteSettings(payload.siteSettings);
        const nextPublicSettings = toPublicSiteSettings(safeSettings);
        const prevPublicSettings = toPublicSiteSettings(siteSettings);
        if (
          canRoleWriteCollection(userRole, 'site_settings') &&
          JSON.stringify(nextPublicSettings) !== JSON.stringify(prevPublicSettings)
        ) {
          put('site_settings', 'main', nextPublicSettings);
        }
        (Object.keys(PRIVATE_SETTINGS_COLLECTIONS) as (keyof typeof PRIVATE_SETTINGS_COLLECTIONS)[]).forEach(
          (key) => {
            const colName = PRIVATE_SETTINGS_COLLECTIONS[key];
            if (canRoleWriteCollection(userRole, colName)) {
              syncList(
                colName,
                (safeSettings[key] || []) as { id: string }[],
                (siteSettings[key] || []) as { id: string }[],
                true
              );
            }
          }
        );
      }
      if (payload.newsArticles !== undefined && canRoleWriteCollection(userRole, 'news_articles')) {
        syncList('news_articles', normalizeNewsArticles(payload.newsArticles), newsArticles);
      }
      if (payload.sponsors !== undefined && canRoleWriteCollection(userRole, 'sponsors')) {
        syncList('sponsors', normalizeSponsors(payload.sponsors), sponsors);
      }
      if (payload.events !== undefined && canRoleWriteCollection(userRole, 'events')) {
        syncList('events', normalizeEvents(payload.events), events);
      }
      if (payload.projects !== undefined && canRoleWriteCollection(userRole, 'projects')) {
        const normalized = normalizeProjects(payload.projects);
        const nextPrivateMap: Record<string, ParticipantPrivateRecord> = {
          ...participantPrivateMap,
        };
        const publicProjects = normalized.map((proj) => {
          const publicParticipants = (proj.participants || []).map((pt) => {
            const { publicParticipant, privateRecord } = splitParticipantPublicAndPrivate(
              pt,
              proj.id
            );
            const hasSensitive =
              Boolean(pt.birthDate) ||
              Boolean(pt.weight) ||
              Boolean(pt.height) ||
              Boolean(pt.bmi) ||
              Boolean(pt.nextfitCode) ||
              Boolean(pt.schoolInfo?.schoolName);
            if (hasSensitive) {
              nextPrivateMap[pt.id] = privateRecord;
              put('participant_private', pt.id, privateRecord);
            }
            return publicParticipant;
          });
          return { ...proj, participants: publicParticipants };
        });
        setParticipantPrivateMap(nextPrivateMap);
        syncList('projects', publicProjects, projects, true);
      }
      if (payload.galleryAlbums !== undefined && canRoleWriteCollection(userRole, 'gallery_albums')) {
        syncList('gallery_albums', normalizeGalleryAlbums(payload.galleryAlbums), galleryAlbums);
      }
      if (payload.transparencyDocs !== undefined && canRoleWriteCollection(userRole, 'transparency_docs')) {
        syncList('transparency_docs', normalizeTransparencyDocs(payload.transparencyDocs), transparencyDocs);
      }
      if (payload.facilityPolos !== undefined && canRoleWriteCollection(userRole, 'facility_polos')) {
        syncList('facility_polos', normalizeFacilityPolos(payload.facilityPolos), facilityPolos);
      }
      // Visitor submissions: only write what the admin changed, so demo records never get published
      if (payload.scoutInquiries !== undefined) {
        syncList('scout_inquiries', payload.scoutInquiries, scoutInquiries, true);
      }
      if (payload.rsvps !== undefined) {
        syncList('rsvps', payload.rsvps, rsvps, true);
      }
      if (payload.contactMessages !== undefined) {
        syncList('contact_messages', payload.contactMessages, contactMessages, true);
      }

      addAuditLog(
        'ALTERACOES_SALVAS',
        logMessage || payload.logDetails || 'Alterações administrativas salvas no banco de dados e publicadas no site.'
      );
      Promise.allSettled(writes).then((results) => {
        const failed = results.filter(
          (r): r is PromiseRejectedResult => r.status === 'rejected'
        );
        if (failed.length === 0) {
          showToast(payload.toastMessage || logMessage || 'Alterações salvas no banco de dados e publicadas!');
          return;
        }
        console.warn('Falhas ao publicar alterações:', failed.map((f) => f.reason));
        const firstReason = failed[0].reason instanceof Error ? failed[0].reason.message : String(failed[0].reason);
        showToast(
          `Salvo apenas neste navegador: ${failed.length} item(ns) NÃO foram publicados no site (${firstReason}). Entre com a conta Google de administrador e salve novamente.`,
          'error'
        );
      });
      return true;
    } catch {
      showToast(
        'Limite de armazenamento do navegador atingido. Remova anexos muito pesados ou use links externos.',
        'error'
      );
      return false;
    }
  };

  return (
    <ClubDataContext.Provider
      value={{
        currentUserProfile,
        authLoading,
        refreshUserProfile,
        clubInfo,
        siteSettings,
        addDonationPledge,
        addVolunteerApplication,
        newsArticles,
        sponsors,
        events,
        rsvps,
        addRsvp,
        projects,
        participantPrivateMap,
        saveParticipantPrivate,
        galleryAlbums,
        transparencyDocs,
        facilityPolos,
        scoutInquiries,
        addScoutInquiry,
        contactMessages,
        addContactMessage,
        auditLogs,
        addAuditLog,
        recordAuditEvent,
        clearAuditLogs,
        resetAllToDefaults,
        exportDatabaseJson,
        importDatabaseJson,
        saveAdminChanges,
        toasts,
        showToast,
        removeToast,
        isFirebaseActive,
      }}
    >
      {children}

      {/* Floating Global Toasts: the live region stays mounted so screen readers announce each new toast */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto p-4 rounded-xl shadow-2xl text-xs font-semibold flex items-center justify-between gap-3 text-white border transition-all animate-in slide-in-from-bottom-3 duration-200 ${
                toast.type === 'error'
                  ? 'bg-rose-600 border-rose-700'
                  : toast.type === 'info'
                  ? 'bg-[#0a1e36] border-sky-400'
                  : 'bg-emerald-700 border-emerald-600'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                aria-label="Fechar notificação"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ))}
      </div>
    </ClubDataContext.Provider>
  );
};

export const useClubData = () => {
  const context = useContext(ClubDataContext);
  if (!context) {
    throw new Error('useClubData must be used within a ClubDataProvider');
  }
  return context;
};

