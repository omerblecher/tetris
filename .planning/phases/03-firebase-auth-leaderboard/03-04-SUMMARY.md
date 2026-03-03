---
plan: 03-04
phase: 03-firebase-auth-leaderboard
status: complete
completed: 2026-03-03
commit: ba1eb43
---

# Plan 03-04: GameBoard Overlay — PB Banner + Guest Sign-In

## What Was Built

Extended the `GameBoard` game-over overlay with three Phase 3 features:

1. **"NEW PERSONAL BEST!" banner** — neon accent glow (Orbitron font, CSS custom properties), conditionally rendered only when `isNewPersonalBest` is `true`
2. **Guest sign-in button** — "SIGN IN WITH GOOGLE TO SAVE YOUR SCORE", shown only when `!user` (guest), calls `signIn()` from `useAuth()`
3. **LEADERBOARD button enabled** — removed `disabled`, `opacity: 0.5`, and `cursor: not-allowed` from the Phase 2 placeholder

## Key Files

| File | Change |
|------|--------|
| `src/components/GameBoard.tsx` | Added `isNewPersonalBest` prop, `useAuth()` hook call, PB banner, guest sign-in button, enabled LEADERBOARD button |

## Self-Check

- [x] `isNewPersonalBest` prop added to `GameBoardProps` interface
- [x] PB banner renders only when `isNewPersonalBest === true`
- [x] Guest sign-in button renders only when `!user`
- [x] Guest sign-in button calls `signIn()` (not a link)
- [x] LEADERBOARD button has no `disabled`, no `opacity: 0.5`, no `cursor: not-allowed`
- [x] TypeScript compiles cleanly (no errors from `npx tsc --noEmit`)
- [x] Task committed atomically: `ba1eb43`
