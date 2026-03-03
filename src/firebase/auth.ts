import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    // Popup closed by user is not an error — treat as no-op
    if ((err as { code?: string }).code === 'auth/popup-closed-by-user') return;
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
