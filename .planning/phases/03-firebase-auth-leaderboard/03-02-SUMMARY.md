---
phase: 03-firebase-auth-leaderboard
plan: 02
subsystem: auth
tags: [firebase, react, context, hooks, typescript, firestore]

# Dependency graph
requires:
  - phase: 03-01
    provides: Firebase config, auth.ts (signInWithGoogle, signOutUser), leaderboard.ts (submitScoreIfBest, getPersonalBest)
  - phase: 02
    provides: CSS custom properties (--color-accent, --color-text, --color-dim), Orbitron font, GameBoard overlay style baseline
provides:
  - AuthProvider component and useAuth hook (AuthContext.tsx)
  - AuthHeader component with neon-styled sign-in/sign-out UI
  - useGameEngine extended with isNewPersonalBest, score submission on game over, Firestore PB sync
affects:
  - 03-03 (Leaderboard panel consumes useAuth to gate display)
  - 03-04 (App.tsx integration — wraps with AuthProvider, mounts AuthHeader)
  - 04 (CLAUDE.md will document AuthProvider wrapping requirement)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onAuthStateChanged wrapped in useEffect with cleanup unsubscribe return"
    - "userRef pattern — keep User in useRef updated via useEffect to avoid stale closures in rAF-adjacent callbacks"
    - "Async IIFE inside sync engine callback for fire-and-forget Firestore writes"
    - "Firestore PB sync on user sign-in via useEffect([user]) — max(localStorage, Firestore) prevents false new-PB banners"

key-files:
  created:
    - src/contexts/AuthContext.tsx
    - src/components/AuthHeader.tsx
  modified:
    - src/hooks/useGameEngine.ts

key-decisions:
  - "useRef for user in onGameOver — React state changes after callback registration; ref keeps it current without stale closure"
  - "Async IIFE in onGameOver — sync engine callback cannot be async; IIFE lets submitScoreIfBest run without blocking"
  - "loading guard returns placeholder div (not null) — preserves layout height during auth resolution to prevent layout shift"
  - "Firestore PB sync on sign-in — max(local, Firestore) protects against false new-PB banner on fresh devices"

patterns-established:
  - "Context pattern: createContext<T | null>(null) + useContext guard throw — type-safe with descriptive error"
  - "userRef pattern: const userRef = useRef(user); useEffect(() => { userRef.current = user; }, [user]) — safe async access"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - LDB-02
  - LDB-03

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 3 Plan 02: AuthContext + AuthHeader + Score Submission Summary

**React auth context with Google sign-in, neon AuthHeader, and automatic Firestore score submission on game over using userRef stale-closure pattern**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T07:05:50Z
- **Completed:** 2026-03-03T07:07:55Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- AuthProvider wraps onAuthStateChanged and provides user/loading/signIn/signOut to entire component tree
- useAuth hook with type-safe context guard — throws descriptive error if used outside AuthProvider
- AuthHeader renders loading placeholder (no layout shift), guest sign-in button, or displayName + sign-out for authenticated users
- useGameEngine now auto-submits score to Firestore on game over (authenticated users, silent fail on errors)
- isNewPersonalBest flag in DisplayState drives the "New personal best!" banner
- Firestore PB syncs on user sign-in — max(localStorage, Firestore) prevents false positives on fresh devices
- userRef pattern prevents stale closure issues in rAF-adjacent onGameOver callback

## Task Commits

Each task was committed atomically:

1. **Task 1: AuthContext + AuthHeader** - `113e81b` (feat)
2. **Task 2: Extend useGameEngine for Score Submission + PB Sync** - `037adbc` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/contexts/AuthContext.tsx` - AuthProvider component and useAuth hook using onAuthStateChanged
- `src/components/AuthHeader.tsx` - Neon-styled header with sign-in/sign-out UI, loading guard
- `src/hooks/useGameEngine.ts` - Extended with isNewPersonalBest, userRef, submitScoreIfBest call, Firestore PB sync

## Decisions Made
- **userRef stale closure pattern** — user from useAuth() is React state that changes over time; the onGameOver callback is registered once in useEffect and would capture the initial null value without the ref. Using useRef + useEffect([user]) to keep it current is the correct pattern for rAF-adjacent callbacks.
- **Async IIFE in onGameOver** — engine callback cannot be async (it's synchronous event handler); async IIFE lets Firestore write happen without blocking or changing the callback signature.
- **Loading placeholder div** — returning `<div style={{ minHeight: '40px' }} />` instead of null preserves layout during auth state resolution; prevents content jump when Firebase resolves auth.
- **max(localStorage, Firestore) on sign-in** — if user has 50k score in Firestore but plays on a fresh device (localStorage=0), without sync the first game over with score < 50k would correctly not set isNewPB, but bestScore display would show 0 until game over. Sync on sign-in keeps display accurate.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Firebase credentials were set up in Phase 3 Plan 01.

## Next Phase Readiness
- AuthContext and AuthHeader ready to be mounted in App.tsx (03-04)
- isNewPersonalBest available in displayState for GameBoard overlay to consume (03-04)
- Score submission wired — any game over by authenticated user auto-submits to Firestore
- Ready for 03-03: Leaderboard panel (reads top scores, uses useAuth for display context)

---
*Phase: 03-firebase-auth-leaderboard*
*Completed: 2026-03-03*
