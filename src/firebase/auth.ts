import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

function isCapacitorNative(): boolean {
  return !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

export async function signInWithGoogle(): Promise<void> {
  if (isCapacitorNative()) {
    // In Android/iOS WebView, popups are blocked — use redirect instead.
    // The result is picked up by handleRedirectResult() on next app load.
    await signInWithRedirect(auth, googleProvider);
  } else {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      // Popup closed by user is not an error — treat as no-op
      if ((err as { code?: string }).code === 'auth/popup-closed-by-user') return;
      throw err;
    }
  }
}

export async function handleRedirectResult(): Promise<void> {
  await getRedirectResult(auth);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
