# Phase 3: Firebase Auth + Leaderboard - Research

**Researched:** 2026-03-02
**Domain:** Firebase Auth (Google sign-in), Firestore real-time leaderboard, Firestore security rules
**Confidence:** HIGH (modular SDK API verified via official docs; security rule patterns verified via Firebase docs; architecture patterns verified via official codelab)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth UI & placement**
- Sign-in button lives in the header / top of page — always visible, not gated to game-over
- Signed-in state: display name + sign-out button, text only (no Google avatar)
- Mobile: auth header stays at the top, compact row above the game board
- A secondary "Sign in with Google to save your score" button also appears on the game-over overlay for guests (in addition to the persistent header button)

**Leaderboard display**
- Side panel next to the board — always visible during play, not a modal
- Each row shows: rank + name + score (clean, minimal — no level or date)
- Real-time via Firestore `onSnapshot`; rows animate/reorder live when new scores arrive
- The current authenticated player's row is highlighted (neon accent color/glow) if they appear in the top 10

**Score submission flow**
- Auto-submit only if the score beats the player's personal best — no prompt, no button
- Firestore write happens silently; personal best doc and leaderboard entry update in the same operation, so the leaderboard reflects the new score immediately
- Game-over screen shows a "New personal best!" banner only when the player beats their PB; nothing extra is shown otherwise
- Silent fail on network errors — no error message, don't disrupt the game-over experience

**Guest experience**
- Guests have full gameplay — no restrictions, no persistent banners
- Leaderboard side panel is fully visible to guests (read access open, write requires auth)
- Phase 2's localStorage best score continues to display for guests as their personal best
- Game-over overlay shows a prominent "Sign in with Google to save your score" button (not a text link), but guests can restart without signing in

### Claude's Discretion
- Exact neon highlight styling for the player's leaderboard row
- Animation specifics for row reordering (slide duration, easing)
- Firestore data model structure (single `scores` collection vs subcollections)
- Compression/ordering of the top-10 query

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Player can sign in with Google account (Firebase Auth, `signInWithPopup`) | Firebase Auth modular SDK: `signInWithPopup(auth, googleProvider)` pattern documented |
| AUTH-02 | Player can sign out at any time | `signOut(auth)` from `firebase/auth` — trivial call, invoked from header button |
| AUTH-03 | Auth state persists across browser sessions (player stays logged in) | Default Firebase Auth uses `browserLocalPersistence` — no extra config needed, state survives tab close |
| AUTH-04 | Player can play without logging in (guest mode); leaderboard submission requires auth | `onAuthStateChanged` returns null user for guests; conditional Firestore write gated on `user !== null` |
| AUTH-05 | Display name from Google account is shown on the leaderboard | `user.displayName` from Firebase Auth User object; stored to Firestore on score write |
| LDB-01 | Global leaderboard displays top 10 all-time scores with player name and score | `query(collection, orderBy('score','desc'), limit(10))` + `onSnapshot` for real-time; single `scores` collection approach |
| LDB-02 | Player's personal best score is stored in Firestore per UID and displayed on game over screen | `setDoc(doc(db,'scores',uid), {score, displayName}, {merge:true})` — same document is both PB and leaderboard entry |
| LDB-03 | After game over (authenticated players), score is submitted to Firestore only if it beats personal best | Client-side `getDoc` check + conditional write; security rules also enforce score-only-increases as backup |
| LDB-04 | Leaderboard is readable by all (including guests); write is restricted to authenticated user's own record | `allow read: if true` + `allow write: if request.auth != null && request.auth.uid == userId` |
| LDB-05 | Firestore security rules enforce: authenticated writes only, UID matches auth user, score is a number within valid range, records are write-once-update (score only increases) | Full security rules pattern with type/range/UID/score-increase checks documented below |
</phase_requirements>

---

## Summary

Phase 3 adds Firebase Authentication (Google sign-in via popup) and a Firestore-backed global leaderboard. The core data model is deliberately simple: one document per user in a `scores` collection, where the document ID is the user's UID. This single document serves as both the user's personal best record and their leaderboard entry — no separate personal-best collection needed. The top-10 leaderboard is fetched with a `orderBy('score','desc').limit(10)` query and kept live via `onSnapshot`.

The Firestore security rules are the critical hardening layer. They enforce: (1) authenticated writes only, (2) UID must match the document path, (3) score field must be an integer within a valid range (0–10,000,000), (4) score can only increase on updates, and (5) only the `score` and `displayName` fields may be written. The 10M cap is generous relative to real-world Tetris performance (world records reach ~2-3M) but blocks obviously spoofed values.

The React integration follows the same `useRef`-for-game-state pattern already established. Auth state is managed via a lightweight `useAuth` React context that wraps `onAuthStateChanged`. The leaderboard component subscribes to `onSnapshot` in a `useEffect` with proper unsubscribe cleanup. The existing `useGameEngine` hook's `onGameOver` callback is extended to call the Firestore write function when appropriate. Firebase v12 is the current release (latest: 12.10.0); the modular API (`firebase/auth`, `firebase/firestore`) is identical to v11 with no breaking changes in the relevant APIs.

**Primary recommendation:** Use a single `scores` collection keyed by UID; `onSnapshot` for real-time leaderboard; `setDoc` with merge for score submission; gate the write client-side AND enforce it in security rules.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | ^12.10.0 (latest) | Auth + Firestore SDK | Official Google SDK; modular/tree-shakeable; v12 import paths identical to locked v11 decision |
| firebase/auth | (included) | Google sign-in, auth state | `signInWithPopup`, `onAuthStateChanged`, `signOut` — all in this sub-package |
| firebase/firestore | (included) | Leaderboard data storage | `onSnapshot`, `setDoc`, `getDoc`, `collection`, `query`, `orderBy`, `limit` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| firebase/app-check | (included, optional) | Bot/abuse protection via reCAPTCHA v3 | Recommended but not required for v1; enables in Firebase Console first |
| vite-env.d.ts augment | N/A | TypeScript types for `import.meta.env` | Required so TS knows about `VITE_FIREBASE_*` variables |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single `scores` collection (one doc per UID) | Separate `scores` + `personalBests` collections | Two collections doubles writes and adds complexity; single doc is simpler and sufficient for top-10 |
| `onSnapshot` for real-time leaderboard | Polling with `getDocs` | `onSnapshot` is zero-cost push; polling wastes reads and adds latency |
| Client-side PB check + Firestore security rules | Cloud Function for score validation | Cloud Functions add cold-start latency, billing complexity; not needed for this scale |

**Installation:**
```bash
npm install firebase
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── firebase/
│   ├── config.ts          # initializeApp, getAuth, getFirestore
│   ├── auth.ts            # signInWithGoogle, signOutUser
│   └── leaderboard.ts     # submitScore, subscribeLeaderboard, getPersonalBest
├── contexts/
│   └── AuthContext.tsx    # AuthProvider, useAuth hook
├── hooks/
│   ├── useGameEngine.ts   # EXTENDED: calls submitScore on game over
│   └── useLeaderboard.ts  # onSnapshot subscription, LeaderboardEntry[]
├── components/
│   ├── AuthHeader.tsx     # Sign-in/sign-out header row
│   ├── Leaderboard.tsx    # Side panel with real-time rows
│   └── GameBoard.tsx      # EXTENDED: sign-in button on game-over overlay
```

### Pattern 1: Firebase Config via Vite Env Variables

**What:** Firebase config stored entirely in `VITE_*` env variables; never hardcoded in source.
**When to use:** Always — DEV-04 requirement.

```typescript
// src/firebase/config.ts
// Source: Vite docs (vite.dev/guide/env-and-mode) + Firebase official setup

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
```

```typescript
// src/vite-env.d.ts — extend existing file to add Firebase types
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Pattern 2: AuthContext + useAuth Hook

**What:** React context that wraps `onAuthStateChanged`; provides `user`, `loading`, `signIn`, `signOut` to the whole tree.
**When to use:** Wrap `<App>` in `<AuthProvider>`. Any component reads `useAuth()`.

```typescript
// src/contexts/AuthContext.tsx
// Source: Firebase Auth official docs + React context pattern

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { signInWithGoogle, signOutUser } from '../firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function — return it for cleanup
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn: signInWithGoogle, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

### Pattern 3: Google Sign-In

```typescript
// src/firebase/auth.ts
// Source: Firebase Auth Web docs (firebase.google.com/docs/auth/web/google-signin)

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  // signInWithPopup sets auth state; onAuthStateChanged will fire automatically
  await signInWithPopup(auth, googleProvider);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
```

### Pattern 4: Score Submission (Personal Best + Leaderboard in One Write)

**What:** Single `setDoc` with `merge: false` into `scores/{uid}` — overwrites the whole doc each time (safe since we only write when score improves).
**When to use:** Only on game over, only if `finalScore > currentPersonalBest`.

```typescript
// src/firebase/leaderboard.ts
// Source: Firestore manage-data/add-data docs + merge pattern

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
 * Returns true if score was submitted, false if not a new PB.
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
    // Silent fail — network errors should not disrupt game-over experience
    return false;
  }
}

/**
 * Get player's stored personal best (0 if none).
 */
export async function getPersonalBest(uid: string): Promise<number> {
  try {
    const snap = await getDoc(doc(db, 'scores', uid));
    return snap.exists() ? (snap.data().score ?? 0) : 0;
  } catch {
    return 0;
  }
}
```

### Pattern 5: Real-Time Leaderboard Subscription

```typescript
// src/hooks/useLeaderboard.ts
// Source: Firestore query-data/listen docs

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ScoreEntry } from '../firebase/leaderboard';

export function useLeaderboard(): ScoreEntry[] {
  const [entries, setEntries] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(10),
    );

    // onSnapshot returns unsubscribe — return it so React cleans up on unmount
    return onSnapshot(q, (snapshot) => {
      setEntries(
        snapshot.docs.map((d) => d.data() as ScoreEntry),
      );
    });
  }, []);

  return entries;
}
```

### Pattern 6: Extending useGameEngine for Score Submission

**What:** The existing `onGameOver` callback in `useGameEngine.ts` is extended to call `submitScoreIfBest` and update the `isNewPB` display flag.
**Key constraint:** Must read `user` from AuthContext at the call site or pass it in — `useGameEngine` cannot use `useAuth()` unless it's a hook itself (it already is — this is fine).

```typescript
// Extension to useGameEngine.ts onGameOver handler
engine.on('onGameOver', async (finalScore) => {
  const best = saveBestScore(finalScore); // Keep localStorage PB for guests
  let isNewPB = false;

  if (user && finalScore > 0) {
    isNewPB = await submitScoreIfBest(user, finalScore);
  }

  setDisplayState(prev => ({
    ...prev,
    score: finalScore,
    isGameOver: true,
    bestScore: best,
    isNewPersonalBest: isNewPB,
  }));
});
```

### Anti-Patterns to Avoid
- **Storing Firebase config in source**: Config MUST come from `import.meta.env.VITE_*`; `.env` in `.gitignore`.
- **Calling `signInWithPopup` from an effect or async context without user gesture**: Popup blockers will fire. Always call from a click handler.
- **Not returning the `onSnapshot` unsubscribe**: Causes memory leaks and phantom reads after unmount.
- **Not returning the `onAuthStateChanged` unsubscribe**: Same leak issue.
- **Updating React state inside the rAF loop**: The async Firestore call in `onGameOver` is fine because `onGameOver` fires once, outside the rAF loop.
- **Using `FieldValue.increment()` for personal best**: Not needed — we only write when score strictly increases; `increment` is for counters, not max-tracking.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow | Custom OAuth redirect handler | `signInWithPopup(auth, googleProvider)` | Popup handles PKCE, token exchange, error states; custom impl has security holes |
| Auth state persistence | Manual localStorage token storage | Firebase Auth (default `browserLocalPersistence`) | Firebase handles token refresh, expiry, cross-tab sync automatically |
| Real-time updates | Polling with `setInterval` + `getDocs` | `onSnapshot` subscription | Push-based; zero read wasted on unchanged data; handles reconnect automatically |
| Rate-limiting score writes | Client-side debounce | Firestore security rules (score-only-increases) | Rules enforce at write time server-side; client debounce is bypassable |
| Score fraud prevention | Client-side score validation | Firestore security rules with type/range/UID checks | Rules are server-enforced; client checks are bypassable via console |

**Key insight:** Firebase Auth and Firestore's security rules handle the hardest security problems (token integrity, data validation, fraud prevention) server-side. Client code should be clean and trust the rules as the enforcement layer.

---

## Common Pitfalls

### Pitfall 1: Popup Blocked by Browser
**What goes wrong:** `signInWithPopup` fails with `auth/popup-blocked` error if called outside a user gesture (click event).
**Why it happens:** Popup blockers require user gestures. Calling from `useEffect`, `setTimeout`, or any async chain that isn't directly triggered by a click fails.
**How to avoid:** Always call `signIn()` from a `onClick` handler — never from an effect or timer.
**Warning signs:** Error code `auth/popup-blocked` or `auth/cancelled-popup-request` in console.

### Pitfall 2: Auth State Race on Mount
**What goes wrong:** Component checks `user` on first render before `onAuthStateChanged` has fired — treats authenticated user as guest briefly, triggers incorrect UI flash or skips score submission.
**Why it happens:** `onAuthStateChanged` fires asynchronously even for already-logged-in users.
**How to avoid:** Use the `loading` flag from `AuthContext`. Don't render auth-dependent UI until `loading === false`. Don't submit scores until auth state is resolved.
**Warning signs:** "Sign in" button flashes then disappears for logged-in users; score submitted as guest when user is actually logged in.

### Pitfall 3: onSnapshot Listener Leak
**What goes wrong:** Memory leak + phantom state updates after component unmounts; old listener keeps firing and calling `setEntries` on an unmounted component.
**Why it happens:** `onSnapshot` returns an unsubscribe function that must be called on cleanup. If `useEffect` doesn't return it, the listener lives forever.
**How to avoid:** `useEffect` must `return onSnapshot(...)`. React calls the return value as the cleanup function.
**Warning signs:** Console warning "Can't perform a React state update on an unmounted component"; multiple leaderboard snapshots firing after navigation.

### Pitfall 4: Firestore Score Cap Too Low
**What goes wrong:** Legitimate high-scoring players are blocked from submitting their real score because the security rule `score <= MAX` rejects the write.
**Why it happens:** Underestimating max possible score. Our Scorer supports: B2B Tetris perfect clear at level 20 = 3200 × 20 = 64,000 per set of 4 pieces. Extended play can reach millions.
**How to avoid:** Set cap at 10,000,000 (10M). Real-world Tetris world records peak ~2-3M. 10M gives 3-5x headroom and blocks obviously fake values (999,999,999).
**Warning signs:** Legit users see silent submission failures; their score doesn't appear in leaderboard.

### Pitfall 5: Personal Best Out of Sync (Firestore vs localStorage)
**What goes wrong:** Authenticated player signs in on a new device; their Firestore PB (e.g., 500k) is not loaded into `bestScore` display state, so the UI shows 0 and they see wrong "New personal best!" banners.
**Why it happens:** `useGameEngine` currently seeds `bestScore` from `localStorage` only. After auth, the Firestore PB must be loaded and used as the source of truth.
**How to avoid:** On auth state change (when user signs in), call `getPersonalBest(user.uid)` and update `bestScore` display state to `max(localStoragePB, firestorePB)`.
**Warning signs:** "New personal best!" fires every game for an authenticated player who already had a high Firestore score.

### Pitfall 6: Missing Firestore Index
**What goes wrong:** `orderBy('score', 'desc').limit(10)` query fails at runtime with `FAILED_PRECONDITION: The query requires an index`.
**Why it happens:** Firestore auto-creates single-field indexes but not always for the specific ordering needed by queries.
**How to avoid:** Run the app once in development after adding the `onSnapshot` query — if the index is missing, the error includes a direct Firebase Console link to create it with one click.
**Warning signs:** Console error with `FAILED_PRECONDITION` and a URL in the message.

### Pitfall 7: `auth/popup-closed-by-user` Error Swallowing
**What goes wrong:** User closes popup without signing in; the rejected promise propagates and shows an unhandled rejection or error UI.
**Why it happens:** `signInWithPopup` rejects with `auth/popup-closed-by-user` — this is expected user behavior, not an error.
**How to avoid:** In the `signInWithGoogle` function, catch and filter this specific error code; treat it as a no-op.

```typescript
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'auth/popup-closed-by-user') return;
    throw err; // Re-throw unexpected errors
  }
}
```

---

## Code Examples

Verified patterns from official sources:

### Complete Firestore Security Rules
```javascript
// firestore.rules
// Source: Firebase security rules docs (firebase.google.com/docs/firestore/security/rules-conditions)
//         + MakerKit in-depth guide verification

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // scores collection: one document per user, keyed by UID
    match /scores/{userId} {

      // Anyone can read the leaderboard (including guests)
      allow read: if true;

      // Create: authenticated, UID matches path, valid data
      allow create: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.uid == userId
        && request.resource.data.score is int
        && request.resource.data.score >= 0
        && request.resource.data.score <= 10000000
        && request.resource.data.displayName is string
        && request.resource.data.keys().hasOnly(['uid', 'score', 'displayName']);

      // Update: same auth checks + score can only increase
      allow update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.score is int
        && request.resource.data.score > resource.data.score
        && request.resource.data.score <= 10000000
        && request.resource.data.displayName is string
        && request.resource.data.keys().hasOnly(['uid', 'score', 'displayName']);

      // No deletes from client
      allow delete: if false;
    }

    // Deny all other paths by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Leaderboard Component (Row Highlight + Animation)
```tsx
// src/components/Leaderboard.tsx
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../contexts/AuthContext';
import { ScoreEntry } from '../firebase/leaderboard';

export function Leaderboard() {
  const entries = useLeaderboard();
  const { user } = useAuth();

  return (
    <div className="leaderboard-panel">
      <div className="panel-label">GLOBAL TOP 10</div>
      {entries.map((entry, i) => {
        const isCurrentUser = user?.uid === entry.uid;
        return (
          <div
            key={entry.uid}
            className={`leaderboard-row ${isCurrentUser ? 'leaderboard-row--highlight' : ''}`}
          >
            <span className="lb-rank">#{i + 1}</span>
            <span className="lb-name">{entry.displayName}</span>
            <span className="lb-score">{entry.score.toLocaleString()}</span>
          </div>
        );
      })}
      {entries.length === 0 && (
        <div className="lb-empty">No scores yet. Be first!</div>
      )}
    </div>
  );
}
```

### AuthHeader Component
```tsx
// src/components/AuthHeader.tsx
import { useAuth } from '../contexts/AuthContext';

export function AuthHeader() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return null; // Avoid auth-state flash

  return (
    <header className="auth-header">
      {user ? (
        <>
          <span className="auth-display-name">{user.displayName}</span>
          <button className="auth-btn auth-btn--signout" onClick={signOut}>
            SIGN OUT
          </button>
        </>
      ) : (
        <button className="auth-btn auth-btn--signin" onClick={signIn}>
          SIGN IN WITH GOOGLE
        </button>
      )}
    </header>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase compat SDK (`firebase/app` v8 style) | Modular SDK (`import { getAuth } from 'firebase/auth'`) | Firebase v9 (2021) | Tree-shakeable; smaller bundle; required for v9+ |
| `firebase.auth().signInWithPopup()` | `signInWithPopup(auth, provider)` | Firebase v9 | All functions are now standalone, not methods |
| `firebase.firestore().collection()` | `collection(db, 'collectionName')` | Firebase v9 | Same pattern |
| `firebase/vertexai` import alias | `firebase/ai` | Firebase v12 | Only affects AI/Vertex features — irrelevant for this project |
| Manual `setPersistence(auth, browserLocalPersistence)` call | Default persistence is `browserLocalPersistence` | Firebase v9+ | No setup needed; sessions persist automatically |

**Deprecated/outdated:**
- Namespaced SDK (`firebase.auth()`, `firebase.firestore()`): Replaced by modular SDK. Do not use.
- `firebase.initializeApp(config)` (v8 style): Replaced by `initializeApp(config)` from `firebase/app`. Do not use.
- `react-firebase-hooks` library: Not needed here. The patterns are simple enough to implement directly.

---

## Firebase SDK Version Note

**Current npm version:** 12.10.0 (released 2025)
**Project memory target:** v11 (locked decision)

**Assessment:** The modular API imports (`firebase/auth`, `firebase/firestore`) are **identical** in v11 and v12. The only breaking change in v12 that matters is the rename of `firebase/vertexai` to `firebase/ai` — which is irrelevant to this project. Installing v12 is recommended as v11 will eventually fall out of support. The planner should install `firebase@^12` (or `firebase@latest`) and document this in PLAN.md.

---

## Data Model

### Firestore Collection: `scores`

```
scores/
  {uid}/            # Document ID = Firebase Auth UID
    uid: string     # Redundant but required for security rule UID check
    displayName: string  # From user.displayName at time of score write
    score: number   # Personal best score (integer)
```

**Why this design:**
- One doc per user = leaderboard entry IS the personal best. No duplication.
- `orderBy('score','desc').limit(10)` gives top 10 directly.
- `getDoc(doc(db,'scores',uid))` gives personal best directly.
- Satisfies LDB-01 (top 10), LDB-02 (personal best), LDB-03 (only if beats PB), LDB-04 (read all, write own), LDB-05 (security rules).

**Score cap rationale:**
- Tetris world records (marathon-style): ~2-3M
- Our Scorer max per-move: B2B Tetris PC at level 20 = 64,000 pts
- Setting cap at 10,000,000 (10M) gives ~3-5x headroom above world records while blocking obviously spoofed values (e.g., 999,999,999).

---

## Integration Points with Existing Code

### Files to Modify (Phase 2 output)

| File | Change |
|------|--------|
| `src/App.tsx` | Add `<AuthProvider>` wrapper, `<AuthHeader>`, extend layout for leaderboard panel |
| `src/hooks/useGameEngine.ts` | Import `useAuth`, extend `onGameOver` to call `submitScoreIfBest`, add `isNewPersonalBest` to `DisplayState` |
| `src/components/GameBoard.tsx` | Add "Sign in with Google" button in game-over overlay (for guests); add "New personal best!" banner |
| `src/components/SidePanel.tsx` | Replace the right panel's leaderboard placeholder with `<Leaderboard>` component |
| `src/vite-env.d.ts` | Add `VITE_FIREBASE_*` env var type declarations |
| `index.html` | Add Firebase project config (none needed — all via env vars) |

### Files to Create (Phase 3 new)

| File | Purpose |
|------|---------|
| `src/firebase/config.ts` | Firebase app init, auth, db exports |
| `src/firebase/auth.ts` | `signInWithGoogle`, `signOutUser` |
| `src/firebase/leaderboard.ts` | `submitScoreIfBest`, `getPersonalBest` |
| `src/contexts/AuthContext.tsx` | `AuthProvider`, `useAuth` |
| `src/hooks/useLeaderboard.ts` | `onSnapshot` subscription hook |
| `src/components/AuthHeader.tsx` | Header sign-in/sign-out row |
| `src/components/Leaderboard.tsx` | Side panel leaderboard list |
| `firestore.rules` | Hardened Firestore security rules |
| `.env` | Firebase config env vars (gitignored) |
| `.env.example` | Template for env vars (committed) |

---

## Open Questions

1. **Score cap validation (from STATE.md blocker)**
   - What we know: World record marathon Tetris scores are ~2-3M. Our Scorer caps level at 20. B2B Tetris PC at level 20 = 64,000 pts. A sustained 10M score would require ~156 consecutive B2B Tetris PCs at max level — theoretically possible in a very long play session.
   - What's unclear: Whether any bot testing in the project will submit anomalously high scores during development.
   - Recommendation: Use 10,000,000 as the cap. This is confirmed safe based on real-world performance analysis.

2. **Firebase App Check (from STATE.md blocker)**
   - What we know: `initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey) })` is the setup. Must register the reCAPTCHA v3 site key in Firebase Console and Google reCAPTCHA Admin.
   - What's unclear: Whether the user wants to set this up in Phase 3 or Phase 4. It requires creating a reCAPTCHA v3 site key, which requires console access.
   - Recommendation: Include App Check setup as an optional task in Phase 3. It's a one-time console setup + 5 lines of code. Easier now than retroactively (requires updating security rules to enforce App Check tokens).

3. **displayName on leaderboard when user renames their Google account**
   - What we know: `user.displayName` is stored at write time. If they change their Google name, the stored value is stale.
   - What's unclear: Whether this matters for a game leaderboard.
   - Recommendation: Accept staleness — update `displayName` on every score write. Since we only write when score improves, this is cheap and naturally keeps the name current for active players.

---

## Sources

### Primary (HIGH confidence)
- Firebase Auth Web docs (firebase.google.com/docs/auth/web/google-signin) — `signInWithPopup`, `GoogleAuthProvider`, `signOut`, `onAuthStateChanged` patterns
- Firestore security rules conditions docs (firebase.google.com/docs/firestore/security/rules-conditions) — `request.auth`, `request.resource.data`, type checking, `keys().hasOnly()`
- Firestore manage-data/add-data docs (firebase.google.com/docs/firestore/manage-data/add-data) — `setDoc`, `getDoc`, `doc()`, merge patterns
- Firebase Leaderboard Codelab (firebase.google.com/codelabs/build-leaderboards-with-firestore) — data model patterns, scaling approaches
- Vite env variables docs (vite.dev/guide/env-and-mode) — `VITE_*` prefix, `import.meta.env`, TypeScript augmentation

### Secondary (MEDIUM confidence)
- MakerKit Firestore Security Rules guide (makerkit.dev) — UID-matching helper functions, score-increase-only pattern, complete leaderboard rules structure (cross-verified with official Firebase docs)
- Firebase JS SDK Release Notes (firebase.google.com/support/release-notes/js) — v11 release date Oct 2024, v12 release Jul 2025, modular import paths unchanged

### Tertiary (LOW confidence)
- RecordSetter Tetris Marathon records — used for score cap analysis (~2-3M world records); sufficient for cap decision but not a definitive authoritative source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Firebase modular SDK verified via official docs; v12 import compatibility confirmed via release notes
- Architecture patterns: HIGH — config/auth/firestore patterns directly from official Firebase docs
- Security rules: HIGH — rule syntax verified via official conditions docs + cross-checked with community guide
- Pitfalls: MEDIUM-HIGH — auth pitfalls from official error code docs; onSnapshot leak from official cleanup docs; score cap from real-world data analysis

**Research date:** 2026-03-02
**Valid until:** 2026-06-02 (Firebase SDK stable; 90-day validity reasonable for established SDK)
