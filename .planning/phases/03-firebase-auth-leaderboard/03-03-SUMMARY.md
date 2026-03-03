---
phase: 03-firebase-auth-leaderboard
plan: 03
subsystem: ui
tags: [react, firebase, firestore, leaderboard, real-time, onsnapshot]

# Dependency graph
requires:
  - phase: 03-01
    provides: Firestore db instance, ScoreEntry type, scores collection with security rules
  - phase: 03-02
    provides: AuthContext, AuthProvider, AuthHeader, useAuth hook

provides:
  - Real-time top-10 leaderboard subscription via useLeaderboard hook (onSnapshot)
  - Leaderboard side panel component with neon/synthwave styling and current-user row highlight
  - Full app integration — AuthProvider wraps entire tree, AuthHeader visible above game layout

affects:
  - 04-deployment (user-facing auth + leaderboard features are complete and ready for production build)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useEffect returning onSnapshot unsubscribe for real-time Firestore subscription with automatic cleanup
    - Inline styles with CSS custom property references for neon/synthwave component styling (consistent with GameBoard overlay pattern)

key-files:
  created:
    - src/hooks/useLeaderboard.ts
    - src/components/Leaderboard.tsx
  modified:
    - src/App.tsx
    - src/index.css

key-decisions:
  - "Right panel width increased from 160px to 180px in grid-template-columns — leaderboard rows (rank + name + score) need the extra 20px for readable display"
  - "Leaderboard always visible in right panel below SidePanel with thin divider — not a modal, matches locked user decision"
  - "onSnapshot unsubscribe returned directly from useEffect (not wrapped in cleanup function) — onSnapshot return value IS the unsubscribe function, so returning it directly is the idiomatic pattern"

patterns-established:
  - "Real-time Firestore subscription pattern: useEffect(() => { return onSnapshot(q, cb); }, []) — return value is unsubscribe, cleanup is automatic"
  - "Current user row highlight: compare user.uid === entry.uid, apply neon cyan glow via textShadow + background rgba"

requirements-completed: [LDB-01, LDB-04, AUTH-05]

# Metrics
duration: 6min
completed: 2026-03-03
---

# Phase 3 Plan 03: Leaderboard Panel + App Integration Summary

**Real-time Firestore top-10 leaderboard with onSnapshot subscription, neon-highlighted current user row, and AuthProvider/AuthHeader wired into App.tsx**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-03T00:00:00Z
- **Completed:** 2026-03-03T00:06:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- useLeaderboard hook subscribes to scores collection via onSnapshot (orderBy score desc, limit 10) with proper cleanup on unmount
- Leaderboard component renders rank/name/score rows; current authenticated user's row highlighted with neon cyan glow (textShadow + background)
- Empty state displays "No scores yet. Be first!" message
- App.tsx now wraps entire tree in AuthProvider; AuthHeader always visible above the game layout
- Right panel width increased from 160px to 180px in CSS grid to accommodate leaderboard rows

## Task Commits

Each task was committed atomically:

1. **Task 1: useLeaderboard Hook + Leaderboard Component** - `40e0e7e` (feat)
2. **Task 2: Wire AuthProvider + AuthHeader + Leaderboard into App.tsx** - `be8eba4` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/hooks/useLeaderboard.ts` - Real-time top-10 Firestore subscription using onSnapshot; returns ScoreEntry[]
- `src/components/Leaderboard.tsx` - Side panel component with rank/name/score rows, current user highlight, empty state
- `src/App.tsx` - Added AuthProvider wrapper, AuthHeader above game layout, Leaderboard in right panel
- `src/index.css` - Increased right panel grid column from 160px to 180px

## Decisions Made
- Right panel width increased 160px → 180px: the leaderboard rows (three-column grid: rank + name + score) needed the extra 20px for readable display without truncating names too aggressively.
- onSnapshot returned directly from useEffect (not wrapped): onSnapshot's return value is the unsubscribe function itself, so `return onSnapshot(...)` is idiomatic and correct — React calls it on unmount.
- Leaderboard placed below SidePanel content with a thin rgba divider line — keeps the layout visually organized without requiring a separate panel container.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - TypeScript passed clean on first check, build succeeded without errors. The 685KB bundle size warning from Vite is expected (Firebase SDK is large) and was noted as out of scope.

## User Setup Required
None - no external service configuration required for this plan. Firebase credentials must still be in .env (configured in 03-01).

## Next Phase Readiness
- All Phase 3 Firebase Auth + Leaderboard user-facing features are now complete (plans 03-01, 03-02, 03-03)
- Remaining plans 03-04 and 03-05 can build on this complete foundation
- App is ready for production build and deployment in Phase 4
- Firebase App Check (reCAPTCHA v3) decision still pending — noted as a concern in STATE.md for Phase 4

---
*Phase: 03-firebase-auth-leaderboard*
*Completed: 2026-03-03*
