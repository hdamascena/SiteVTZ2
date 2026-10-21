import { doc, getDoc } from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { db, auth } from '../firebase.ts';

// Data reads and writes live in ClubDataContext; this file only handles admin authentication.

export const PRIMARY_ADMIN_EMAIL = 'higor.rock2011@gmail.com';

// ============================================================================
// FIREBASE AUTHENTICATION & ADMIN ROLE VERIFICATION (mirrors isAdmin() in firestore.rules)
// ============================================================================

export async function verifyFirebaseAdminAccess(
  user: User | null
): Promise<{ authorized: boolean; role: string; reason?: string }> {
  if (!user || !user.email) {
    return {
      authorized: false,
      role: 'guest',
      reason: 'Nenhum usuário autenticado no Firebase.',
    };
  }

  const emailLower = user.email.trim().toLowerCase();

  // 1. Primary Owner check (matches firestore.rules)
  if (emailLower === PRIMARY_ADMIN_EMAIL.toLowerCase() && user.emailVerified) {
    return { authorized: true, role: 'super_admin' };
  }

  // 2. Firestore /admins/{uid} collection check
  try {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
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
    // Return null so the caller shows a generic "invalid credentials" message
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
