import { GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase.ts';

export { auth, db };
export const googleAuthProvider = new GoogleAuthProvider();
