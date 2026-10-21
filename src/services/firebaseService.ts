import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from '../firebase.ts';
import type {
  NewsArticle,
  VitalizarEvent,
  VitalizarProject,
  TransparencyDocument,
  PastEventPhoto,
  Sponsor,
  SiteSettings,
} from '../types/index.ts';
import { CLUB_INFO } from '../data/clubeData.ts';
import { EventRsvpRecord, ContactMessageRecord } from '../context/ClubDataContext.tsx';

export const COLLECTIONS = {
  CLUB_INFO: 'club_info',
  SITE_SETTINGS: 'site_settings',
  NEWS: 'news_articles',
  SPONSORS: 'sponsors',
  EVENTS: 'events',
  PROJECTS: 'projects',
  GALLERY: 'gallery_albums',
  TRANSPARENCY: 'transparency_docs',
  RSVPS: 'rsvps',
  MESSAGES: 'contact_messages',
  ADMINS: 'admins',
} as const;

export const PRIMARY_ADMIN_EMAIL = 'higor.rock2011@gmail.com';

// ============================================================================
// 1. DATA FETCHING (Hydration from Firestore)
// ============================================================================

export async function fetchRemoteClubInfo(): Promise<typeof CLUB_INFO | null> {
  try {
    const docRef = doc(db, COLLECTIONS.CLUB_INFO, 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as typeof CLUB_INFO;
    }
    return null;
  } catch (error) {
    console.info('Firestore: usando dados locais de ClubInfo (modo offline/cache).');
    return null;
  }
}

export async function fetchRemoteSiteSettings(): Promise<SiteSettings | null> {
  try {
    const docRef = doc(db, COLLECTIONS.SITE_SETTINGS, 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    }
    return null;
  } catch (error) {
    console.info('Firestore: usando configurações locais do portal.');
    return null;
  }
}


export async function fetchRemoteNews(): Promise<NewsArticle[] | null> {
  try {
    const colRef = collection(db, COLLECTIONS.NEWS);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as NewsArticle);
    }
    return null;
  } catch (error) {
    console.info('Firestore: usando notícias do cache local.');
    return null;
  }
}

export async function fetchRemoteSponsors(): Promise<Sponsor[] | null> {
  try {
    const colRef = collection(db, COLLECTIONS.SPONSORS);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const sponsors = snap.docs.map((d) => d.data() as Sponsor);
      return sponsors.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return null;
  } catch (error) {
    console.info('Firestore: usando patrocinadores do cache local.');
    return null;
  }
}

export async function fetchRemoteEvents(): Promise<VitalizarEvent[] | null> {
  try {
    const colRef = collection(db, COLLECTIONS.EVENTS);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as VitalizarEvent);
    }
    return null;
  } catch (error) {
    console.info('Firestore: usando eventos do cache local.');
    return null;
  }
}

export async function fetchRemoteProjects(): Promise<VitalizarProject[] | null> {
  try {
    const colRef = collection(db, COLLECTIONS.PROJECTS);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as VitalizarProject);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function fetchRemoteGallery(): Promise<PastEventPhoto[] | null> {
  try {
    const colRef = collection(db, COLLECTIONS.GALLERY);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as PastEventPhoto);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function fetchRemoteTransparency(): Promise<TransparencyDocument[] | null> {
  try {
    const colRef = collection(db, COLLECTIONS.TRANSPARENCY);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as TransparencyDocument);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// 2. DATA PERSISTENCE (Syncing Admin Changes to Firestore)
// ============================================================================

export async function syncAdminContentToFirestore(payload: {
  clubInfo?: typeof CLUB_INFO;
  siteSettings?: SiteSettings;
  newsArticles?: NewsArticle[];
  sponsors?: Sponsor[];
  events?: VitalizarEvent[];
  projects?: VitalizarProject[];
  galleryAlbums?: PastEventPhoto[];
  transparencyDocs?: TransparencyDocument[];
}): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = [];

  // 1. Club Info
  if (payload.clubInfo) {
    try {
      await setDoc(doc(db, COLLECTIONS.CLUB_INFO, 'main'), payload.clubInfo);
    } catch (err) {
      errors.push(`ClubInfo: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 1b. Site Settings
  if (payload.siteSettings) {
    try {
      await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'main'), payload.siteSettings);
    } catch (err) {
      errors.push(`SiteSettings: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. News Articles
  if (payload.newsArticles) {
    for (const art of payload.newsArticles) {
      try {
        await setDoc(doc(db, COLLECTIONS.NEWS, art.id), art);
      } catch (err) {
        errors.push(`News (${art.id}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 3. Sponsors
  if (payload.sponsors) {
    for (const spon of payload.sponsors) {
      try {
        await setDoc(doc(db, COLLECTIONS.SPONSORS, spon.id), spon);
      } catch (err) {
        errors.push(`Sponsor (${spon.name}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 4. Events
  if (payload.events) {
    for (const ev of payload.events) {
      try {
        await setDoc(doc(db, COLLECTIONS.EVENTS, ev.id), ev);
      } catch (err) {
        errors.push(`Event (${ev.id}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 5. Projects
  if (payload.projects) {
    for (const proj of payload.projects) {
      try {
        await setDoc(doc(db, COLLECTIONS.PROJECTS, proj.id), proj);
      } catch (err) {
        errors.push(`Project (${proj.id}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 6. Gallery Albums
  if (payload.galleryAlbums) {
    for (const alb of payload.galleryAlbums) {
      try {
        await setDoc(doc(db, COLLECTIONS.GALLERY, alb.id), alb);
      } catch (err) {
        errors.push(`Gallery (${alb.id}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // 7. Transparency Docs
  if (payload.transparencyDocs) {
    for (const docItem of payload.transparencyDocs) {
      try {
        await setDoc(doc(db, COLLECTIONS.TRANSPARENCY, docItem.id), docItem);
      } catch (err) {
        errors.push(`Doc (${docItem.id}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Single deletions
export async function deleteSponsorRemote(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SPONSORS, id));
  } catch (err) {
    console.warn(`Erro ao deletar patrocinador ${id} no Firestore:`, err);
  }
}

export async function deleteNewsRemote(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.NEWS, id));
  } catch (err) {
    console.warn(`Erro ao deletar notícia ${id} no Firestore:`, err);
  }
}

// ============================================================================
// 3. PUBLIC USER SUBMISSIONS (RSVPs and Ombudsman Messages)
// ============================================================================

export async function submitRsvpToFirestore(rsvp: EventRsvpRecord): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.RSVPS, rsvp.id), rsvp);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `rsvps/${rsvp.id}`);
  }
}

export async function submitContactMessageToFirestore(message: ContactMessageRecord): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.MESSAGES, message.id), message);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `contact_messages/${message.id}`);
  }
}

// ============================================================================
// 4. REAL-TIME SUBSCRIPTION HELPERS
// ============================================================================

export function subscribeToSponsors(
  callback: (sponsors: Sponsor[]) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.SPONSORS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => d.data() as Sponsor);
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(list);
      }
    },
    (error) => {
      console.info('Aviso Firestore Snapshot (Sponsors):', error.message);
    }
  );
}

export function subscribeToNews(
  callback: (articles: NewsArticle[]) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.NEWS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d) => d.data() as NewsArticle);
        callback(list);
      }
    },
    (error) => {
      console.info('Aviso Firestore Snapshot (News):', error.message);
    }
  );
}

// ============================================================================
// 5. FIREBASE AUTHENTICATION & ADMIN ROLE VERIFICATION
// ============================================================================

export async function verifyFirebaseAdminAccess(
  user: User | null,
  configuredAdminEmail: string
): Promise<{ authorized: boolean; role: string; reason?: string }> {
  if (!user || !user.email) {
    return {
      authorized: false,
      role: 'guest',
      reason: 'Nenhum usuário autenticado no Firebase.',
    };
  }

  const emailLower = user.email.trim().toLowerCase();
  const configuredLower = configuredAdminEmail.trim().toLowerCase();

  // 1. Primary Owner check (matches firestore.rules)
  if (emailLower === PRIMARY_ADMIN_EMAIL.toLowerCase() && user.emailVerified) {
    return { authorized: true, role: 'super_admin' };
  }

  // 2. Configured institutional admin email check
  if (emailLower === configuredLower || emailLower === 'admin@vitalizar.org.br') {
    return { authorized: true, role: 'admin' };
  }

  // 3. Firestore /admins/{uid} collection check
  try {
    const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
    if (adminDoc.exists()) {
      return { authorized: true, role: adminDoc.data()?.role || 'admin' };
    }
  } catch {
    // Ignore permission error if not in /admins
  }

  return {
    authorized: false,
    role: 'unauthorized',
    reason: `A conta (${user.email}) não possui credenciais administrativas autorizadas na Associação Vitalizar.`,
  };
}

export async function loginWithGoogleAdmin(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }
    console.warn('Aviso na autenticação do Google Firebase:', error?.message || error);
    throw error;
  }
}

export async function loginWithEmailPasswordFirebase(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    // Return null so caller can fallback or handle credential validation
    return null;
  }
}

export async function logoutFirebaseAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Erro ao deslogar do Firebase:', error);
  }
}

export const logoutFirebaseAdmin = logoutFirebaseAuth;

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}


