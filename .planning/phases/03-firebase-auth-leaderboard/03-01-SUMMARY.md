---
phase: 03-firebase-auth-leaderboard
plan: 01
subsystem: auth
tags: [firebase, firestore, google-auth, security-rules, typescript, vite]

# Dependency graph
requires:
  - phase: 02-react-shell-visual-polish
    provides: React app shell that Firebase Auth + Firestore will integrate into

provides:
  - Firebase SDK installed (firebase@^12, modular tree-shakeable imports)
  - src/firebase/config.ts — app init via VITE_* env vars, exports app/auth/db
  - src/firebase/auth.ts — signInWithGoogle (Google popup, popup-closed silenced), signOutUser
  - src/firebase/leaderboard.ts — submitScoreIfBest (PB-only write, silent fail), getPersonalBest, ScoreEntry type
  - firestore.rules — hardened: auth-only writes, UID match, score 0-10M cap, score-only-increases, no deletes
  - .env.example — committed template documenting all 6 VITE_FIREBASE_* vars
  - TypeScript types for all VITE_FIREBASE_* env vars in vite-env.d.ts
  - .env added to .gitignore

affects:
  - 03-02 (AuthContext + useAuth hook consumes signInWithGoogle, signOutUser, auth from config)
  - 03-03 (LeaderboardPanel consumes submitScoreIfBest, getPersonalBest, ScoreEntry)
  - 03-04 (GameOver screen uses submitScoreIfBest on game end)
  - 03-05 (Deployment must deploy firestore.rules via firebase deploy --only firestore:rules)

# Tech tracking
tech-stack:
  added: [firebase@^12 (modular SDK — getAuth, getFirestore, signInWithPopup, GoogleAuthProvider, doc, getDoc, setDoc)]
  patterns:
    - All Firebase config via import.meta.env.VITE_* — zero hardcoded secrets in source
    - Single doc per UID in scores/ collection — one document serves as both leaderboard entry and personal best
    - Silent-fail pattern — submitScoreIfBest catches all errors and returns false; never throws to caller
    - popup-closed-by-user treated as no-op (not an error) in signInWithGoogle

key-files:
  created:
    - src/firebase/config.ts
    - src/firebase/auth.ts
    - src/firebase/leaderboard.ts
    - firestore.rules
    - .env.example
  modified:
    - src/vite-env.d.ts (added ImportMetaEnv interface with 6 VITE_FIREBASE_* fields)
    - .gitignore (added .env)
    - package.json (firebase@^12 dependency added)

key-decisions:
  - "firebase@^12 installed — modular import paths identical to v11 per research; tree-shaking works correctly with Vite"
  - "Score cap set at 10,000,000 — 3-5x above verified world records; blocks spoofed values without affecting legitimate play"
  - "submitScoreIfBest uses setDoc (not updateDoc) — safe for first-time users with no existing document"
  - "score-only-increases enforced both client-side (submitScoreIfBest) and server-side (Firestore rules) — defense in depth"
  - ".env.example committed as template; actual .env gitignored — no secrets ever in version control"

patterns-established:
  - "Firebase imports: always modular (firebase/app, firebase/auth, firebase/firestore) — never compat layer"
  - "Silent fail on Firestore ops: catch block returns 0/false — network errors must never disrupt game UX"
  - "Auth error handling: popup-closed-by-user silenced, all other errors re-thrown"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, LDB-03, LDB-04, LDB-05]

# Metrics
duration: 15min
completed: 2026-03-03
---

# Phase 03 Plan 01: Firebase Infrastructure Summary

**Firebase SDK (modular v12) installed with Google Auth popup, Firestore personal-best leaderboard, and hardened security rules (auth-only, UID-match, score 0-10M cap, score-only-increases)**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-02T22:06:05Z
- **Completed:** 2026-03-02T22:21:00Z
- **Tasks:** 2 of 3 automated (Task 1 and Task 3 are human-action checkpoints)
- **Files modified:** 8

## Accomplishments

- Installed firebase@^12 with full modular tree-shakeable imports (82 packages, 0 vulnerabilities)
- Created complete Firebase infrastructure: config init, Google Auth, Firestore leaderboard — all typed, all using VITE_* env vars
- Hardened Firestore security rules: no spoofing (score cap 10M), no replay attacks (score-only-increases), no unauthorized writes (UID match + auth check), no deletes
- Zero hardcoded secrets in source — verified by grep scan

## Task Commits

Each task was committed atomically:

1. **Task 1: Firebase Project Setup** — human-action checkpoint (user created Firebase project, enabled Google Auth, created Firestore DB)
2. **Task 2: Install Firebase + Create Firebase Infrastructure Files** — `d4877b1` (feat)
3. **Task 3: User Fills In .env** — human-action checkpoint (pending: user fills in VITE_FIREBASE_* values)

## Files Created/Modified

- `src/firebase/config.ts` — Firebase app init, exports `app`, `auth`, `db` via VITE_* env vars
- `src/firebase/auth.ts` — `signInWithGoogle()` (popup, popup-closed silenced), `signOutUser()`
- `src/firebase/leaderboard.ts` — `submitScoreIfBest()` (PB-only, silent fail), `getPersonalBest()`, `ScoreEntry` type
- `src/vite-env.d.ts` — `ImportMetaEnv` interface with all 6 `VITE_FIREBASE_*` fields
- `firestore.rules` — hardened security rules (auth, UID, score 0-10M, score-only-increases, no deletes)
- `.env.example` — committed template documenting all required env vars
- `.gitignore` — added `.env` to prevent secret leakage
- `package.json` — firebase@^12 added as dependency

## Decisions Made

- firebase@^12 (latest) used — modular API paths identical to v11 per research; no API breakage
- Score cap: 10,000,000 — 3-5x above world records (verified during Phase 3 research); blocks spoofed values
- `setDoc` used (not `updateDoc`) in `submitScoreIfBest` — safe for first-time users with no existing document
- Score-increase-only enforced at both client and server layers — defense in depth
- `popup-closed-by-user` error code silenced — this is expected user behavior, not an error

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `.env` to `.gitignore`**
- **Found during:** Task 2 (pre-commit verification)
- **Issue:** `.gitignore` did not include `.env` — would allow accidental commit of Firebase API keys
- **Fix:** Added `.env` line to `.gitignore` with explanatory comment
- **Files modified:** `.gitignore`
- **Verification:** `grep "^\.env$" .gitignore` returns match
- **Committed in:** `d4877b1` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (missing critical — security)
**Impact on plan:** Essential security fix. No scope creep.

## Issues Encountered

None — all planned work executed as specified. TypeScript compiled clean (`npx tsc --noEmit` passed with 0 errors).

## User Setup Required

Task 3 is a blocking human-action checkpoint:

1. Copy `.env.example` to `.env`: `cp .env.example .env`
2. Open `.env` in your editor
3. Fill in each `VITE_FIREBASE_*` value from the Firebase Console config object
4. Save — verify `.env` is NOT tracked by git: `git status` should NOT show `.env`
5. Type `.env filled` to continue to Tasks 03-02 through 03-05

## Self-Check

- [x] `src/firebase/config.ts` exists
- [x] `src/firebase/auth.ts` exists
- [x] `src/firebase/leaderboard.ts` exists
- [x] `firestore.rules` exists
- [x] `.env.example` exists
- [x] `.env` in `.gitignore`
- [x] `d4877b1` commit exists
- [x] TypeScript compiles clean

## Self-Check: PASSED

## Next Phase Readiness

- Firebase infrastructure complete — 03-02 (AuthContext) can begin immediately after `.env filled` checkpoint
- All exports match what 03-02/03-03/03-04 depend on (`signInWithGoogle`, `signOutUser`, `submitScoreIfBest`, `getPersonalBest`, `ScoreEntry`, `auth`, `db`)
- Firestore security rules written and ready for deployment in Phase 4 (`firebase deploy --only firestore:rules`)
- No blockers for continuation

---
*Phase: 03-firebase-auth-leaderboard*
*Completed: 2026-03-03*
