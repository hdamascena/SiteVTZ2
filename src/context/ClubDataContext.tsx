import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types/index.ts';
import {
  createAuditLogEntry,
  validateBackupSchema,
} from '../utils/adminAuth.ts';
import type { AuditLogEntry } from '../utils/adminAuth.ts';
import { db } from '../firebase.ts';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';

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
  spots: number;
  date: string;
  confirmationCode: string;
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
  clubInfo: typeof CLUB_INFO;
  setClubInfo: (info: typeof CLUB_INFO) => void;
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
  newsArticles: NewsArticle[];
  addNewsArticle: (article: Omit<NewsArticle, 'id'>) => void;
  updateNewsArticle: (article: NewsArticle) => void;
  deleteNewsArticle: (id: string) => void;
  events: VitalizarEvent[];
  addEvent: (event: Omit<VitalizarEvent, 'id'>) => void;
  updateEvent: (event: VitalizarEvent) => void;
  deleteEvent: (id: string) => void;
  rsvps: EventRsvpRecord[];
  addRsvp: (rsvp: Omit<EventRsvpRecord, 'id' | 'confirmationCode' | 'date'>) => string;
  deleteRsvp: (id: string) => void;
  projects: VitalizarProject[];
  addProject: (project: Omit<VitalizarProject, 'id'>) => void;
  updateProject: (project: VitalizarProject) => void;
  deleteProject: (id: string) => void;
  galleryAlbums: PastEventPhoto[];
  addGalleryAlbum: (album: Omit<PastEventPhoto, 'id'>) => void;
  updateGalleryAlbum: (album: PastEventPhoto) => void;
  deleteGalleryAlbum: (id: string) => void;
  transparencyDocs: TransparencyDocument[];
  addTransparencyDoc: (doc: Omit<TransparencyDocument, 'id'>) => void;
  updateTransparencyDoc: (doc: TransparencyDocument) => void;
  deleteTransparencyDoc: (id: string) => void;
  sponsors: Sponsor[];
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => void;
  updateSponsor: (sponsor: Sponsor) => void;
  deleteSponsor: (id: string) => void;
  facilityPolos: FacilityPolo[];
  scoutInquiries: ScoutInquiryRecord[];
  addScoutInquiry: (inquiry: Omit<ScoutInquiryRecord, 'id' | 'protocol' | 'createdAt' | 'status'>) => string;
  deleteScoutInquiry: (id: string) => void;
  contactMessages: ContactMessageRecord[];
  addContactMessage: (msg: Omit<ContactMessageRecord, 'id' | 'date' | 'read'>) => void;
  markContactMessageRead: (id: string) => void;
  deleteContactMessage: (id: string) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (action: string, details?: string, adminEmail?: string) => void;
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
  }) => boolean;
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

  for (const defDoc of TRANSPARENCY_DOCUMENTS) {
    if (!seenIds.has(defDoc.id)) {
      seenIds.add(defDoc.id);
      merged.push(defDoc);
    }
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

  // 5d. Scout Inquiries (Captação & Olheiros)
  const [scoutInquiries, setScoutInquiries] = useState<ScoutInquiryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCOUT_INQUIRIES);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'scout-seed-1',
              protocol: 'SCT-2026-4812',
              scoutName: 'Roberto Avelar',
              organization: 'Departamento de Captação Desportiva Capixaba',
              role: 'Observador Técnico Sub-15/Sub-17',
              credentialsId: 'CREF 014982-G/ES',
              phone: '(27) 99912-8834',
              email: 'captacao.avelar@esportees.com.br',
              inquiryType: 'avaliacao_clube',
              targetPlayerName: 'João Victor "JV10" (Camisa 10)',
              targetCategory: 'Sub-15',
              preferredDate: '2026-11-10',
              message:
                'Acompanhamos o desempenho do atleta João Victor no último festival regional e gostaríamos de agendar uma semana de avaliação monitorada junto à comissão técnica da Vitalizar.',
              projectName: 'Iniciação Esportiva & Cidadania (Futsal e Vôlei)',
              createdAt: '16/10/2026 14:20',
              status: 'nova',
            },
          ];
    } catch {
      return [];
    }
  });


  // 6. RSVPs
  const [rsvps, setRsvps] = useState<EventRsvpRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RSVPS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'rsvp-seed-1',
              eventId: 'clinica-futsal-transicoes',
              eventTitle: 'Clínica de Futsal: Transições Rápidas',
              name: 'Marcos Vinicius Santos',
              phone: '(27) 99823-1144',
              spots: 2,
              date: new Date().toLocaleDateString('pt-BR'),
              confirmationCode: 'VTL-FUTSAL-8921',
            },
            {
              id: 'rsvp-seed-2',
              eventId: 'oficina-primeiros-socorros',
              eventTitle: 'Oficina de Primeiros Socorros & Prevenção no Esporte',
              name: 'Ana Cláudia Ribeiro',
              phone: '(27) 98112-4590',
              spots: 1,
              date: new Date().toLocaleDateString('pt-BR'),
              confirmationCode: 'VTL-SOCORR-3482',
            },
          ];
    } catch {
      return [];
    }
  });

  // 7. Contact Messages
  const [contactMessages, setContactMessages] = useState<ContactMessageRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'msg-seed-1',
              name: 'Carlos Eduardo Lima',
              email: 'carlos.lima@gmail.com',
              phone: '(27) 99765-4321',
              subject: 'Voluntariado',
              message:
                'Gostaria de me candidatar como voluntário para dar aulas de reforço escolar e apoio aos treinos de futsal nos finais de semana.',
              date: '14/10/2026 16:40',
              read: false,
            },
          ];
    } catch {
      return [];
    }
  });

  // 8. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved
        ? JSON.parse(saved)
        : [
            createAuditLogEntry(
              'SISTEMA_INICIALIZADO',
              'sistema@vitalizar.org.br',
              'Base de dados inicial da Associação Vitalizar carregada.'
            ),
          ];
    } catch {
      return [];
    }
  });

  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(true);

  // Sync initial data from Firestore if available (Batched in a single render pass)
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromFirestore() {
      try {
        const [
          clubRes,
          settingsRes,
          newsRes,
          sponsorsRes,
          eventsRes,
          projectsRes,
          galleryRes,
          docsRes,
        ] = await Promise.allSettled([
          getDoc(doc(db, 'club_info', 'main')),
          getDoc(doc(db, 'site_settings', 'main')),
          getDocs(collection(db, 'news_articles')),
          getDocs(collection(db, 'sponsors')),
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'gallery_albums')),
          getDocs(collection(db, 'transparency_docs')),
        ]);

        if (!isMounted) return;

        if (clubRes.status === 'fulfilled' && clubRes.value.exists()) {
          const remoteData = normalizeClubInfo(
            clubRes.value.data() as Partial<typeof CLUB_INFO>
          );
          setClubInfoState(remoteData);
          localStorage.setItem(STORAGE_KEYS.CLUB_INFO, JSON.stringify(remoteData));
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value.exists()) {
          const remoteSettings = normalizeSiteSettings(
            settingsRes.value.data() as Partial<SiteSettings>
          );
          setSiteSettingsState(remoteSettings);
          localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(remoteSettings));
        }

        if (newsRes.status === 'fulfilled' && !newsRes.value.empty) {
          const remoteNews = normalizeNewsArticles(
            newsRes.value.docs.map((d) => d.data() as NewsArticle)
          );
          setNewsArticles(remoteNews);
          localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(remoteNews));
        }

        if (sponsorsRes.status === 'fulfilled' && !sponsorsRes.value.empty) {
          const remoteSponsors = normalizeSponsors(
            sponsorsRes.value.docs.map((d) => d.data() as Sponsor)
          );
          remoteSponsors.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSponsors(remoteSponsors);
          localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(remoteSponsors));
        }

        if (eventsRes.status === 'fulfilled' && !eventsRes.value.empty) {
          const remoteEvents = normalizeEvents(
            eventsRes.value.docs.map((d) => d.data() as VitalizarEvent)
          );
          setEvents(remoteEvents);
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(remoteEvents));
        }

        if (projectsRes.status === 'fulfilled' && !projectsRes.value.empty) {
          const remoteProjects = normalizeProjects(
            projectsRes.value.docs.map((d) => d.data() as VitalizarProject)
          );
          setProjects(remoteProjects);
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(remoteProjects));
        }

        if (galleryRes.status === 'fulfilled' && !galleryRes.value.empty) {
          const remoteAlbums = normalizeGalleryAlbums(
            galleryRes.value.docs.map((d) => d.data() as PastEventPhoto)
          );
          setGalleryAlbums(remoteAlbums);
          localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(remoteAlbums));
        }

        if (docsRes.status === 'fulfilled' && !docsRes.value.empty) {
          const remoteDocs = normalizeTransparencyDocs(
            docsRes.value.docs.map((d) => d.data() as TransparencyDocument)
          );
          setTransparencyDocs(remoteDocs);
          localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(remoteDocs));
        }

        setIsFirebaseActive(true);
      } catch (err) {
        console.info('Firestore offline ou em fallback local:', err);
      }
    }
    hydrateFromFirestore();
    return () => {
      isMounted = false;
    };
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

  // Sync helpers to localStorage
  const setClubInfo = (info: typeof CLUB_INFO) => {
    setClubInfoState(info);
    localStorage.setItem(STORAGE_KEYS.CLUB_INFO, JSON.stringify(info));
    addAuditLog('DADOS_ENTIDADE_ALTERADOS', 'Informações institucionais da Vitalizar atualizadas.');
    showToast('Dados da entidade atualizados com sucesso!');
  };

  const setSiteSettings = (settings: SiteSettings) => {
    setSiteSettingsState(settings);
    localStorage.setItem(STORAGE_KEYS.SITE_SETTINGS, JSON.stringify(settings));
    try {
      setDoc(doc(db, 'site_settings', 'main'), settings).catch(console.warn);
    } catch (err) {
      console.warn('Erro ao salvar site_settings no Firestore:', err);
    }
    addAuditLog('CONFIGURACOES_ALTERADAS', 'Configurações de categorias, tags e parâmetros do portal atualizadas.');
    showToast('Configurações do site atualizadas com sucesso!');
  };

  const addAuditLog = (action: string, details?: string, adminEmail: string = 'admin@vitalizar.org.br') => {
    const entry = createAuditLogEntry(action, adminEmail, details);
    setAuditLogs((prev) => {
      const updated = [entry, ...prev].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
      return updated;
    });
  };

  // News CRUD
  const addNewsArticle = (articleData: Omit<NewsArticle, 'id'>) => {
    const newArticle: NewsArticle = {
      ...articleData,
      id: `noticia-${Date.now()}`,
      views: 1,
    };
    setNewsArticles((prev) => {
      const updated = [newArticle, ...prev];
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('NOTICIA_CRIADA', `Notícia "${newArticle.title}" publicada.`);
    showToast('Nova notícia publicada com sucesso!');
  };

  const updateNewsArticle = (article: NewsArticle) => {
    setNewsArticles((prev) => {
      const updated = prev.map((item) => (item.id === article.id ? article : item));
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('NOTICIA_EDITADA', `Notícia "${article.title}" atualizada.`);
    showToast('Notícia atualizada com sucesso!');
  };

  const deleteNewsArticle = (id: string) => {
    setNewsArticles((prev) => {
      const article = prev.find((a) => a.id === id);
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(updated));
      if (article) {
        addAuditLog('NOTICIA_EXCLUIDA', `Notícia "${article.title}" removida.`);
      }
      return updated;
    });
    showToast('Notícia removida.');
  };

  // Events CRUD
  const addEvent = (eventData: Omit<VitalizarEvent, 'id'>) => {
    const newEvent: VitalizarEvent = {
      ...eventData,
      id: `evento-${Date.now()}`,
    };
    setEvents((prev) => {
      const updated = [newEvent, ...prev];
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('EVENTO_CRIADO', `Atividade "${newEvent.title}" adicionada ao calendário.`);
    showToast('Evento adicionado ao calendário!');
  };

  const updateEvent = (event: VitalizarEvent) => {
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === event.id ? event : e));
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('EVENTO_EDITADO', `Atividade "${event.title}" atualizada.`);
    showToast('Evento atualizado com sucesso!');
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => {
      const ev = prev.find((e) => e.id === id);
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
      if (ev) {
        addAuditLog('EVENTO_EXCLUIDO', `Atividade "${ev.title}" removida do calendário.`);
      }
      return updated;
    });
    showToast('Evento excluído.');
  };

  // RSVPs
  const addRsvp = (rsvpData: Omit<EventRsvpRecord, 'id' | 'confirmationCode' | 'date'>): string => {
    const confirmationCode = `VTL-${rsvpData.eventId.toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRsvp: EventRsvpRecord = {
      ...rsvpData,
      id: `rsvp-${Date.now()}`,
      confirmationCode,
      date: new Date().toLocaleString('pt-BR'),
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
    
    // Asynchronous Firestore sync
    try {
      setDoc(doc(db, 'rsvps', newRsvp.id), newRsvp).catch((err) => {
        console.warn('Aviso: sync Firestore para RSVP falhou:', err);
      });
    } catch (err) {
      console.warn('Erro ao disparar setDoc para RSVP:', err);
    }

    return confirmationCode;
  };

  const deleteRsvp = (id: string) => {
    setRsvps((prev) => {
      const rsvp = prev.find((r) => r.id === id);
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(updated));
      if (rsvp) {
        addAuditLog('RSVP_CANCELADO', `Inscrição de ${rsvp.name} para "${rsvp.eventTitle}" cancelada.`);
      }
      return updated;
    });
    showToast('Inscrição cancelada.');
  };

  // Projects CRUD
  const addProject = (projectData: Omit<VitalizarProject, 'id'>) => {
    const newProj: VitalizarProject = {
      ...projectData,
      id: `projeto-${Date.now()}`,
    };
    setProjects((prev) => {
      const updated = [newProj, ...prev];
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('PROJETO_CRIADO', `Novo projeto esportivo "${newProj.name}" cadastrado.`);
    showToast('Novo projeto esportivo cadastrado!');
  };

  const updateProject = (project: VitalizarProject) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === project.id ? project : p));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('PROJETO_ATUALIZADO', `Projeto esportivo "${project.name}" atualizado.`);
    showToast('Projeto esportivo atualizado!');
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => {
      const proj = prev.find((p) => p.id === id);
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
      if (proj) {
        addAuditLog('PROJETO_EXCLUIDO', `Projeto esportivo "${proj.name}" removido.`);
      }
      return updated;
    });
    showToast('Projeto removido.');
  };

  // Gallery Albums CRUD
  const addGalleryAlbum = (albumData: Omit<PastEventPhoto, 'id'>) => {
    const newAlbum: PastEventPhoto = {
      ...albumData,
      id: `album-${Date.now()}`,
    };
    setGalleryAlbums((prev) => {
      const updated = [newAlbum, ...prev];
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('ALBUM_CRIADO', `Álbum de fotos "${newAlbum.title}" adicionado à galeria.`);
    showToast('Álbum de fotos publicado na galeria!');
  };

  const updateGalleryAlbum = (album: PastEventPhoto) => {
    setGalleryAlbums((prev) => {
      const updated = prev.map((a) => (a.id === album.id ? album : a));
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('ALBUM_EDITADO', `Álbum de fotos "${album.title}" atualizado.`);
    showToast('Álbum de fotos atualizado!');
  };

  const deleteGalleryAlbum = (id: string) => {
    setGalleryAlbums((prev) => {
      const alb = prev.find((a) => a.id === id);
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updated));
      if (alb) {
        addAuditLog('ALBUM_EXCLUIDO', `Álbum de fotos "${alb.title}" removido.`);
      }
      return updated;
    });
    showToast('Álbum removido da galeria.');
  };

  // Transparency Docs CRUD
  const addTransparencyDoc = (docData: Omit<TransparencyDocument, 'id'>) => {
    const newDoc: TransparencyDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
    };
    setTransparencyDocs((prev) => {
      const updated = [newDoc, ...prev];
      localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('DOCUMENTO_TRANSPARENCIA_CRIADO', `Documento MROSC "${newDoc.title}" publicado.`);
    showToast('Documento publicado no Portal da Transparência!');
  };

  const updateTransparencyDoc = (doc: TransparencyDocument) => {
    setTransparencyDocs((prev) => {
      const updated = prev.map((d) => (d.id === doc.id ? doc : d));
      localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('DOCUMENTO_TRANSPARENCIA_EDITADO', `Documento "${doc.title}" atualizado.`);
    showToast('Documento atualizado com sucesso!');
  };

  const deleteTransparencyDoc = (id: string) => {
    setTransparencyDocs((prev) => {
      const doc = prev.find((d) => d.id === id);
      const updated = prev.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, JSON.stringify(updated));
      if (doc) {
        addAuditLog('DOCUMENTO_TRANSPARENCIA_REMOVIDO', `Documento "${doc.title}" removido.`);
      }
      return updated;
    });
    showToast('Documento removido da transparência.');
  };

  // Sponsors CRUD
  const addSponsor = (sponData: Omit<Sponsor, 'id'>) => {
    const newSponsor: Sponsor = {
      ...sponData,
      id: `patrocinador-${Date.now()}`,
    };
    setSponsors((prev) => {
      const updated = [...prev, newSponsor];
      updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('PATROCINADOR_CRIADO', `Patrocinador "${newSponsor.name}" (${newSponsor.tierLabel}) adicionado.`);
    showToast('Patrocinador adicionado com sucesso!');
  };

  const updateSponsor = (sponsor: Sponsor) => {
    setSponsors((prev) => {
      const updated = prev.map((s) => (s.id === sponsor.id ? sponsor : s));
      updated.sort((a, b) => (a.order || 0) - (b.order || 0));
      localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(updated));
      return updated;
    });
    addAuditLog('PATROCINADOR_EDITADO', `Patrocinador "${sponsor.name}" atualizado.`);
    showToast('Patrocinador atualizado com sucesso!');
  };

  const deleteSponsor = (id: string) => {
    setSponsors((prev) => {
      const spon = prev.find((s) => s.id === id);
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SPONSORS, JSON.stringify(updated));
      if (spon) {
        addAuditLog('PATROCINADOR_REMOVIDO', `Patrocinador "${spon.name}" removido.`);
      }
      return updated;
    });
    // Remove from Firestore if online
    deleteDoc(doc(db, 'sponsors', id)).catch(console.warn);
    showToast('Patrocinador removido.');
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

    // Asynchronous Firestore sync
    try {
      setDoc(doc(db, 'contact_messages', newMsg.id), newMsg).catch((err) => {
        console.warn('Aviso: sync Firestore para mensagem falhou:', err);
      });
    } catch (err) {
      console.warn('Erro ao disparar setDoc para mensagem:', err);
    }
  };

  const markContactMessageRead = (id: string) => {
    setContactMessages((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, read: true } : m));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteContactMessage = (id: string) => {
    setContactMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
      return updated;
    });
    showToast('Mensagem excluída.');
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
    try {
      setDoc(doc(db, 'scout_inquiries', newInquiry.id), sanitizeForFirestore(newInquiry)).catch(
        console.warn
      );
    } catch {
      // ignore
    }
    return protocol;
  };

  const deleteScoutInquiry = (id: string) => {
    setScoutInquiries((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.SCOUT_INQUIRIES, JSON.stringify(updated));
      return updated;
    });
    showToast('Registro de captação removido.');
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
  }): boolean => {
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

      // Asynchronous batch-like sync to Firestore (sanitized to strip undefined properties)
      try {
        if (payload.clubInfo) {
          setDoc(doc(db, 'club_info', 'main'), sanitizeForFirestore(normalizeClubInfo(payload.clubInfo))).catch(console.warn);
        }
        if (payload.siteSettings) {
          setDoc(doc(db, 'site_settings', 'main'), sanitizeForFirestore(normalizeSiteSettings(payload.siteSettings))).catch(console.warn);
        }
        if (payload.newsArticles) {
          payload.newsArticles.forEach((art) => {
            setDoc(doc(db, 'news_articles', art.id), sanitizeForFirestore(art)).catch(console.warn);
          });
        }
        if (payload.sponsors) {
          payload.sponsors.forEach((spon) => {
            setDoc(doc(db, 'sponsors', spon.id), sanitizeForFirestore(spon)).catch(console.warn);
          });
        }
        if (payload.events) {
          payload.events.forEach((ev) => {
            setDoc(doc(db, 'events', ev.id), sanitizeForFirestore(ev)).catch(console.warn);
          });
        }
        if (payload.projects) {
          payload.projects.forEach((proj) => {
            setDoc(doc(db, 'projects', proj.id), sanitizeForFirestore(proj)).catch(console.warn);
          });
        }
        if (payload.galleryAlbums) {
          payload.galleryAlbums.forEach((alb) => {
            setDoc(doc(db, 'gallery_albums', alb.id), sanitizeForFirestore(alb)).catch(console.warn);
          });
        }
        if (payload.transparencyDocs) {
          payload.transparencyDocs.forEach((d) => {
            setDoc(doc(db, 'transparency_docs', d.id), sanitizeForFirestore(d)).catch(console.warn);
          });
        }
        if (payload.facilityPolos) {
          payload.facilityPolos.forEach((polo) => {
            setDoc(doc(db, 'facility_polos', polo.id), sanitizeForFirestore(polo)).catch(console.warn);
          });
        }
      } catch (firestoreErr) {
        console.warn('Aviso ao sincronizar com Firestore:', firestoreErr);
      }

      addAuditLog(
        'ALTERACOES_SALVAS',
        payload.logDetails || 'Alterações administrativas salvas no banco de dados e publicadas no site.'
      );
      showToast(payload.toastMessage || 'Alterações salvas no Firestore e publicadas!');
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
        clubInfo,
        setClubInfo,
        siteSettings,
        setSiteSettings,
        newsArticles,
        addNewsArticle,
        updateNewsArticle,
        deleteNewsArticle,
        sponsors,
        addSponsor,
        updateSponsor,
        deleteSponsor,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        rsvps,
        addRsvp,
        deleteRsvp,
        projects,
        addProject,
        updateProject,
        deleteProject,
        galleryAlbums,
        addGalleryAlbum,
        updateGalleryAlbum,
        deleteGalleryAlbum,
        transparencyDocs,
        addTransparencyDoc,
        updateTransparencyDoc,
        deleteTransparencyDoc,
        facilityPolos,
        scoutInquiries,
        addScoutInquiry,
        deleteScoutInquiry,
        contactMessages,
        addContactMessage,
        markContactMessageRead,
        deleteContactMessage,
        auditLogs,
        addAuditLog,
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

      {/* Floating Global Toasts for Instant UX Feedback */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
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
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                aria-label="Fechar notificação"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
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

