import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { db, auth } from '../firebase.ts';
import type { AdminRole, AdminUserProfile, AdminInviteRecord } from '../admin/types.ts';
import { normalizeAdminRole, isRetiredRole } from '../admin/permissions.ts';

export const PRIMARY_ADMIN_EMAIL = 'higor.rock2011@gmail.com';

export function formatFirebaseAuthError(error: any): string {
  const code = String(error?.code || '');
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos, ou esta conta ainda não possui senha cadastrada.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Use "Já tenho conta (Entrar)" ou entre com o Google.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Digite um endereço de e-mail válido.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login do Google. Permita pop-ups para este site ou entre com e-mail e senha.';
    case 'auth/unauthorized-domain':
      return 'Este domínio ainda não foi autorizado no Firebase Authentication, ou use o login com e-mail e senha.';
    case 'auth/operation-not-allowed':
      return 'Este método de login precisa ser ativado em Firebase Console > Authentication > Sign-in method.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.';
    default:
      return error?.message || 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}

export async function verifyFirebaseAdminAccess(
  user: User | null
): Promise<{
  authorized: boolean;
  role: AdminRole | 'guest' | 'unauthorized';
  profile?: AdminUserProfile;
  reason?: string;
}> {
  if (!user || !user.email) {
    return {
      authorized: false,
      role: 'guest',
      reason: 'Nenhum usuário autenticado no Firebase.',
    };
  }

  const emailClean = user.email.trim().toLowerCase();
  const isPrimaryOwner = emailClean === PRIMARY_ADMIN_EMAIL.toLowerCase();

  try {
    const adminRef = doc(db, 'admins', user.uid);
    const adminDoc = await getDoc(adminRef);

    // 1. Check existing /admins/{uid}
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      const isLegacyVisitor = isRetiredRole(data.role);
      const profile: AdminUserProfile = {
        uid: user.uid,
        email: data.email || user.email,
        nome: data.nome || user.displayName || user.email.split('@')[0],
        role: isPrimaryOwner ? 'super_admin' : normalizeAdminRole(data.role),
        projectIds: Array.isArray(data.projectIds) ? data.projectIds : [],
        ativo: isPrimaryOwner ? true : isLegacyVisitor ? false : data.ativo !== false,
        criadoEm: data.criadoEm || new Date().toISOString(),
        criadoPor: data.criadoPor || 'sistema',
      };

      if (isPrimaryOwner && data.role !== 'super_admin') {
        await setDoc(adminRef, {
          ...data,
          email: profile.email,
          nome: profile.nome,
          role: 'super_admin',
          ativo: true,
        }).catch(() => {});
      }

      if (!profile.ativo) {
        return {
          authorized: false,
          role: 'unauthorized',
          profile,
          reason: `Esta conta (${user.email}) não possui acesso ativo ao painel de gestão.`,
        };
      }

      return {
        authorized: true,
        role: profile.role,
        profile,
      };
    }

    // 2. First login for Primary Super Admin -> provision /admins/{uid}
    if (isPrimaryOwner) {
      const ownerProfile: AdminUserProfile = {
        uid: user.uid,
        email: user.email,
        nome: user.displayName || 'Coordenação Geral Vitalizar',
        role: 'super_admin',
        projectIds: [],
        ativo: true,
        criadoEm: new Date().toISOString(),
        criadoPor: user.email,
      };
      await setDoc(adminRef, {
        email: ownerProfile.email,
        nome: ownerProfile.nome,
        role: ownerProfile.role,
        projectIds: ownerProfile.projectIds,
        ativo: ownerProfile.ativo,
        criadoEm: ownerProfile.criadoEm,
        criadoPor: ownerProfile.criadoPor,
      }).catch(() => {});
      return {
        authorized: true,
        role: 'super_admin',
        profile: ownerProfile,
      };
    }

    // 3. Check /admin_invites/{email}
    const inviteRef = doc(db, 'admin_invites', emailClean);
    const inviteSnap = await getDoc(inviteRef).catch(() => null);
    if (inviteSnap && inviteSnap.exists()) {
      const inv = inviteSnap.data() as AdminInviteRecord;
      const invitedProfile: AdminUserProfile = {
        uid: user.uid,
        email: user.email,
        nome: inv.nome || user.displayName || user.email.split('@')[0],
        role: normalizeAdminRole(inv.role),
        projectIds: Array.isArray(inv.projectIds) ? inv.projectIds : [],
        ativo: true,
        criadoEm: new Date().toISOString(),
        criadoPor: inv.criadoPor || 'convite',
      };
      await setDoc(adminRef, {
        email: invitedProfile.email,
        nome: invitedProfile.nome,
        role: invitedProfile.role,
        projectIds: invitedProfile.projectIds,
        ativo: true,
        criadoEm: invitedProfile.criadoEm,
        criadoPor: invitedProfile.criadoPor,
      }).catch(() => {});
      await deleteDoc(inviteRef).catch(() => {});
      return {
        authorized: true,
        role: invitedProfile.role,
        profile: invitedProfile,
      };
    }

    // 4. Uninvited user -> inactive profile (showcase panel is restricted to invited team/partners)
    const inactiveProfile: AdminUserProfile = {
      uid: user.uid,
      email: user.email,
      nome: user.displayName || user.email.split('@')[0],
      role: 'parceiro',
      projectIds: [],
      ativo: false,
      criadoEm: new Date().toISOString(),
      criadoPor: 'nao_autorizado',
    };
    return {
      authorized: false,
      role: 'unauthorized',
      profile: inactiveProfile,
      reason: 'Acesso restrito à equipe institucional e parceiros convidados.',
    };
  } catch {
    if (isPrimaryOwner) {
      return {
        authorized: true,
        role: 'super_admin',
        profile: {
          uid: user.uid,
          email: user.email,
          nome: user.displayName || 'Super Admin',
          role: 'super_admin',
          projectIds: [],
          ativo: true,
          criadoEm: new Date().toISOString(),
          criadoPor: user.email,
        },
      };
    }
    return {
      authorized: false,
      role: 'unauthorized',
      profile: {
        uid: user.uid,
        email: user.email,
        nome: user.displayName || user.email.split('@')[0],
        role: 'parceiro',
        projectIds: [],
        ativo: false,
        criadoEm: new Date().toISOString(),
        criadoPor: 'nao_autorizado',
      },
    };
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken().catch(() => null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAllAdminsAndInvites(): Promise<{
  admins: AdminUserProfile[];
  invites: AdminInviteRecord[];
}> {
  const headers = await getAuthHeader();
  const [sqlRes, adminsRes, invitesRes] = await Promise.allSettled([
    fetch('/api/users', { headers }).then((r) => (r.ok ? r.json() : null)),
    getDocs(collection(db, 'admins')),
    getDocs(collection(db, 'admin_invites')),
  ]);

  const adminMap = new Map<string, AdminUserProfile>();

  if (adminsRes.status === 'fulfilled') {
    adminsRes.value.docs.forEach((d) => {
      const raw = d.data();
      adminMap.set(d.id, {
        uid: d.id,
        email: raw.email || '',
        nome: raw.nome || raw.email || d.id,
        role: normalizeAdminRole(raw.role),
        projectIds: Array.isArray(raw.projectIds) ? raw.projectIds : [],
        ativo: raw.ativo !== false && !isRetiredRole(raw.role),
        criadoEm: raw.criadoEm || '',
        criadoPor: raw.criadoPor || '',
      });
    });
  }

  if (sqlRes.status === 'fulfilled' && sqlRes.value) {
    const sqlAdmins: any[] = Array.isArray(sqlRes.value.admins) ? sqlRes.value.admins : [];
    sqlAdmins.forEach((raw) => {
      if (raw && raw.uid) {
        adminMap.set(raw.uid, {
          uid: String(raw.uid),
          email: String(raw.email || ''),
          nome: String(raw.nome || raw.email || raw.uid),
          role: normalizeAdminRole(raw.role),
          projectIds: Array.isArray(raw.projectIds) ? raw.projectIds : [],
          ativo: raw.ativo !== false && !isRetiredRole(raw.role),
          criadoEm: String(raw.criadoEm || ''),
          criadoPor: String(raw.criadoPor || ''),
        });
      }
    });
  }

  const inviteMap = new Map<string, AdminInviteRecord>();

  if (invitesRes.status === 'fulfilled') {
    invitesRes.value.docs.forEach((d) => {
      const raw = d.data();
      const emailKey = (raw.email || d.id).trim().toLowerCase();
      inviteMap.set(emailKey, {
        email: emailKey,
        nome: raw.nome || emailKey,
        role: normalizeAdminRole(raw.role),
        projectIds: Array.isArray(raw.projectIds) ? raw.projectIds : [],
        criadoEm: raw.criadoEm || '',
        criadoPor: raw.criadoPor || '',
      });
    });
  }

  if (sqlRes.status === 'fulfilled' && sqlRes.value) {
    const sqlInvites: any[] = Array.isArray(sqlRes.value.invites) ? sqlRes.value.invites : [];
    sqlInvites.forEach((raw) => {
      if (raw && raw.email) {
        const emailKey = String(raw.email).trim().toLowerCase();
        inviteMap.set(emailKey, {
          email: emailKey,
          nome: String(raw.nome || emailKey),
          role: normalizeAdminRole(raw.role),
          projectIds: Array.isArray(raw.projectIds) ? raw.projectIds : [],
          criadoEm: String(raw.criadoEm || ''),
          criadoPor: String(raw.criadoPor || ''),
        });
      }
    });
  }

  return {
    admins: Array.from(adminMap.values()),
    invites: Array.from(inviteMap.values()),
  };
}

export async function saveAdminProfile(profile: AdminUserProfile): Promise<void> {
  const adminRef = doc(db, 'admins', profile.uid);
  const payload = {
    uid: profile.uid,
    email: profile.email.trim().toLowerCase(),
    nome: profile.nome.trim() || profile.email,
    role: profile.role,
    projectIds: Array.isArray(profile.projectIds) ? profile.projectIds : [],
    ativo: profile.ativo,
    criadoEm: profile.criadoEm || new Date().toISOString(),
    criadoPor: profile.criadoPor || 'admin',
  };
  const headers = await getAuthHeader();
  const { uid: _uid, ...fsData } = payload;
  await Promise.allSettled([
    setDoc(adminRef, fsData),
    fetch('/api/collections/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ itemId: profile.uid, payload }),
    }),
  ]);
}

export async function saveAdminInvite(invite: AdminInviteRecord): Promise<void> {
  const normalizedEmail = invite.email.trim().toLowerCase();
  const inviteRef = doc(db, 'admin_invites', normalizedEmail);
  const payload = {
    email: normalizedEmail,
    nome: invite.nome.trim() || normalizedEmail,
    role: invite.role,
    projectIds: Array.isArray(invite.projectIds) ? invite.projectIds : [],
    criadoEm: invite.criadoEm || new Date().toISOString(),
    criadoPor: invite.criadoPor || 'admin',
  };
  const headers = await getAuthHeader();
  await Promise.allSettled([
    setDoc(inviteRef, payload),
    fetch('/api/collections/admin_invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ itemId: normalizedEmail, payload }),
    }),
  ]);
}

export async function deleteAdminInvite(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const headers = await getAuthHeader();
  await Promise.allSettled([
    deleteDoc(doc(db, 'admin_invites', normalizedEmail)),
    fetch(`/api/collections/admin_invites/${encodeURIComponent(normalizedEmail)}`, {
      method: 'DELETE',
      headers,
    }),
  ]);
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
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function loginWithEmailPasswordFirebase(
  email: string,
  password: string
): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function registerInvitedWithEmailFirebase(
  nome: string,
  email: string,
  password: string
): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (nome.trim()) {
      await updateProfile(result.user, { displayName: nome.trim() }).catch(() => {});
    }
    return result.user;
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function sendPasswordResetFirebase(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    throw new Error(formatFirebaseAuthError(error));
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
