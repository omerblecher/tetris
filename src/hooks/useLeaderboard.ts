import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ScoreEntry } from '../firebase/leaderboard';

export function useLeaderboard(): ScoreEntry[] {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(10),
    );

    // onSnapshot returns unsubscribe — MUST return it so React cleans up on unmount
    return onSnapshot(q, (snapshot) => {
      setEntries(
        snapshot.docs.map((d) => d.data() as ScoreEntry),
      );
    });
  }, []);

  return entries;
}
