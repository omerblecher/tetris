import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './config';

export interface ScoreEntry {
  uid: string;
  displayName: string;
  score: number;
}

/**
 * Submit score to Firestore only if it beats the player's stored personal best.
 * Silent fail on network errors — never throws to caller.
 * Returns true if score was submitted (new PB), false otherwise.
 */
export async function submitScoreIfBest(user: User, finalScore: number): Promise<boolean> {
  try {
    const ref = doc(db, 'scores', user.uid);
    const snap = await getDoc(ref);
    const currentBest: number = snap.exists() ? (snap.data().score ?? 0) : 0;

    if (finalScore <= currentBest) return false;

    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName ?? 'Anonymous',
      score: finalScore,
    });
    return true;
  } catch {
    // Silent fail — network errors must not disrupt game-over experience
    return false;
  }
}

/**
 * Get player's stored personal best from Firestore (0 if none or error).
 */
export async function getPersonalBest(uid: string): Promise<number> {
  try {
    const snap = await getDoc(doc(db, 'scores', uid));
    return snap.exists() ? (snap.data().score ?? 0) : 0;
  } catch {
    return 0;
  }
}
