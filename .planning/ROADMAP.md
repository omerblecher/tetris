# Roadmap: Tetris

## Overview

Four phases built in strict dependency order. Phase 1 locks in the non-recoverable architectural decisions — Canvas rendering, `useRef`-based game state, `requestAnimationFrame` loop, and SRS rotation — before any UI exists. Phase 2 wires that engine to React and delivers a fully playable local game with neon polish and mobile controls. Phase 3 adds Firebase Auth and a hardened Firestore leaderboard. Phase 4 deploys to production, establishes developer tooling, and commits the complete project to GitHub.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Game Engine** - Pure TypeScript game engine with SRS rotation, collision, scoring, and Canvas rendering architecture locked in
- [ ] **Phase 2: React Shell + Visual Polish** - Playable game in browser with neon aesthetic, responsive layout, and mobile touch controls
- [ ] **Phase 3: Firebase Auth + Leaderboard** - Google login, Firestore leaderboard with hardened security rules, personal best tracking
- [ ] **Phase 4: Deployment + Developer Setup** - Vercel/Netlify deploy, CLAUDE.md, GitHub commit/push automation, final polish

## Phase Details

### Phase 1: Core Game Engine
**Goal**: A pure TypeScript game engine that produces correct, playable Tetris — driveable from the browser console before any React UI exists, with all non-recoverable architectural decisions locked in
**Depends on**: Nothing (first phase)
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, ENG-08, ENG-09, ENG-10, ENG-11, SCR-01, SCR-02, SCR-03, SCR-04, SCR-05, SCR-06
**Success Criteria** (what must be TRUE):
  1. All 7 tetrominoes spawn, move left/right/down, and rotate clockwise and counter-clockwise using SRS wall kicks — pieces rotate near walls and the floor without getting stuck
  2. Hard drop instantly places the piece at the lowest valid position; soft drop accelerates fall; ghost piece correctly previews landing position
  3. Complete rows are cleared, rows above fall down, and score updates correctly: 100/300/500/800 × level for 1/2/3/4 lines; level increases every 10 lines
  4. Game over is correctly detected when a newly spawned piece cannot be placed; the engine can be reset and restarted
  5. Canvas renders the board at 60fps using `shadowBlur`/`shadowColor` for neon glow; game state lives in `useRef` (not React state); loop uses `requestAnimationFrame` with delta-time (not `setInterval`)
**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold + types + SRS wall kick tables (Wave 1)
- [x] 01-02-PLAN.md — TDD: Board (collision, line clear, perfect clear) + Bag (7-bag randomizer) (Wave 2)
- [x] 01-03-PLAN.md — TDD: Scorer (all Guideline scoring formulas, level/gravity) (Wave 2)
- [ ] 01-04-PLAN.md — Piece + LockDelay + TetrisEngine assembly (Wave 3)
- [ ] 01-05-PLAN.md — CanvasRenderer (offscreen glow) + useGameEngine hook + GameBoard component (Wave 4)
- [ ] 01-06-PLAN.md — Human verification checkpoint (Wave 5)

### Phase 2: React Shell + Visual Polish
**Goal**: A fully playable Tetris game in the browser with neon/glow aesthetic, responsive layout that works on desktop and mobile, and touch controls — no backend required
**Depends on**: Phase 1
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, VIS-06, CTR-01, CTR-02, CTR-03, CTR-04, CTR-05, LAY-01, LAY-02, LAY-03, LAY-04
**Success Criteria** (what must be TRUE):
  1. The game board renders with distinct neon colors per tetromino type; active piece glows brightest; ghost piece is dim/translucent; background is near-black with subtle grid lines
  2. Line-clear animation flashes/pulses cleared rows before they disappear; lock-in flash fires when a piece locks; level-up produces a visible screen effect
  3. All gameplay works via keyboard on desktop (arrows, spacebar, Z/C/P keys); player can pause and resume; game over screen shows final score and restart option
  4. On mobile, swipe gestures control movement and drop; on-screen virtual buttons are visible and tappable for rotate, hard drop, and hold; no hardware keyboard required
  5. Layout adapts correctly: desktop shows board centered with side panels; mobile shows board top, compact score panel, and virtual controls at bottom — no overflow or scroll on any device
**Plans**: TBD

### Phase 3: Firebase Auth + Leaderboard
**Goal**: Authenticated players can submit scores to a global Firestore leaderboard with hardened security rules; guest players can view the leaderboard and play without an account
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, LDB-01, LDB-02, LDB-03, LDB-04, LDB-05
**Success Criteria** (what must be TRUE):
  1. Player can sign in with Google (popup flow), see their display name in the UI, remain signed in across browser sessions, and sign out at any time
  2. Guest players can play and view the leaderboard; leaderboard submission prompt appears at game over only for authenticated players
  3. Global top-10 leaderboard displays player names and scores; it updates in real time when a new high score is submitted
  4. After game over, an authenticated player's score is submitted to Firestore only if it beats their personal best; personal best is displayed on the game over screen
  5. Firestore security rules enforce: authenticated writes only, UID matches auth user, score is a number within valid range, records are write-once-or-increase (score can only go up)
**Plans**: TBD

### Phase 4: Deployment + Developer Setup
**Goal**: The game is live on a public URL with auto-deploy on push, Firebase config is secured in environment variables, CLAUDE.md documents project rules, and the complete project is committed and pushed to GitHub
**Depends on**: Phase 3
**Requirements**: DEV-01, DEV-02, DEV-03, DEV-04
**Success Criteria** (what must be TRUE):
  1. CLAUDE.md exists in the repo root with project rules, coding conventions, stack decisions, and AI development guidelines
  2. Firebase config is loaded from environment variables; `.env` is in `.gitignore`; no secrets appear in the committed codebase
  3. Project is deployed to Vercel or Netlify; pushing to the main branch triggers an automatic redeploy; the live URL is accessible and fully functional
  4. All project files are committed to git with a clean history and pushed to the remote GitHub repository
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Game Engine | 3/6 | In progress | - |
| 2. React Shell + Visual Polish | 0/TBD | Not started | - |
| 3. Firebase Auth + Leaderboard | 0/TBD | Not started | - |
| 4. Deployment + Developer Setup | 0/TBD | Not started | - |
