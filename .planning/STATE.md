# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A beautiful, playable Tetris experience with a real global leaderboard — the neon aesthetic and smooth gameplay make it worth coming back to.
**Current focus:** Phase 3 — Firebase Auth + Leaderboard

## Current Position

Phase: 4 of 4 (Deployment + Developer Setup)
Plan: 1 of 2 in current phase
Status: In Progress — Phase 4 Plan 01 complete (CLAUDE.md + README.md created); Phase 4 Plan 02 pending
Last activity: 2026-03-03 — Phase 4 Plan 01: CLAUDE.md and README.md created; DEV-04 env var setup confirmed

Progress: [█████████░] 85%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 5.7 min
- Total execution time: ~0.67 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 7 completed | ~40 min | ~5.7 min |

**Recent Trend:**
- Last 8 plans: 01-01 (6 min), 01-02 (6 min est.), 01-03 (7 min), 01-04 (8 min), 01-05 (7 min), 01-06 (4 min est.), 01-07 (2 min), 02-01 (2 min)
- Trend: consistent ~2-8 min per plan

*Updated after each plan completion*

| Phase 02 P01 | 2 min | 2 tasks | 8 files |
| Phase 02 P02 | 5 min | 2 tasks | 2 files |
| Phase 02 P03 | 8 min | 2 tasks | 4 files |
| Phase 03 P01 | 15 | 2 tasks | 8 files |
| Phase 03 P02 | 2 min | 2 tasks | 3 files |
| Phase 03 P03 | 6 min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Canvas rendering locked in — DOM cells with CSS glow cause paint storms on mobile (40fps on mid-range Android). Non-recoverable if deferred.
- [Phase 1]: Game state must live in `useRef`, not `useState` — React setState in the game loop causes 60 re-renders/sec; performance collapses at higher levels.
- [Phase 1]: `requestAnimationFrame` + delta-time required — `setInterval` drifts by tens of ms per tick, causing erratic piece fall at high levels.
- [Phase 1]: Full SRS wall kick tables required — naive rotation without wall kicks makes the game feel broken to experienced players.
- [01-01]: Vite scaffold created manually (npm create vite requires interactive TTY, unavailable in bash shell). Equivalent output produced.
- [01-01]: All SPAWN_POSITIONS use col 3, row -1 — uniform spawn centered on 10-wide board.
- [01-01]: SRS dy convention: tetris.wiki uses +y=up; game board uses +row=down. `tryRotate` must apply `newRow = piece.row - dy`.
- [01-02]: Array.from({ length: ROWS }, () => Array(COLS).fill(0)) is required for Board cells — Array(ROWS).fill([]) shares row references causing silent bugs.
- [01-02]: Board.isValid() treats negative rows (spawn buffer) as always valid — pieces enter from row -1 and must be allowed during spawn.
- [01-03]: Guideline gravity formula at level 1 produces 1000ms (not 800ms) — `(0.8)^0 = 1.0s`. Plan spec had erroneous test expectations; formula itself is correct per tetris.wiki.
- [01-03]: Scorer tests isolate B2B from combo by setting `b2bActive` directly — cleaner than sequential clears that trigger both modifiers simultaneously.
- [01-03]: Perfect clear uses level-scaled Guideline values (PC_SCORES: 800/1200/1800/2000 × level; B2B Tetris PC: 3200 × level) rather than flat 3500 placeholder.
- [Phase 01-04]: Gravity accumulator freezes while LockDelay is active — prevents double-locking when piece hits floor mid-accumulation tick
- [Phase 01-04]: T-spin center at (col+1, row+1) — matches 3x3 T-piece bounding box with 3-corner rule and 5th-kick full promotion
- [Phase 01-04]: window.game rAF loop capped at dt=100ms to prevent spiral-of-death on tab blur/resume
- [01-05]: shadowBlur set only in offscreen.ts preRenderPiece() — never on main canvas at render time (GPU paint cost at 60fps with 200 cells)
- [01-05]: useEffect empty deps array for engine/renderer — created once per mount, never recreated on re-render
- [01-05]: Ghost piece uses globalAlpha=0.25 with same pre-rendered texture — no separate ghost-colored texture needed
- [01-07]: onPieceLock used (not onScoreUpdate) to refresh nextPieces — fires immediately on lock before score update; semantically correct
- [01-07]: nextPieces seeded synchronously after engine construction before rAF starts — avoids blank NEXT panel on mount
- [01-07]: restart() must re-read engine.state.nextPieces after reset() — keeps preview consistent on game restart
- [Phase 02]: Ghost textures pre-baked into OffscreenCanvas with globalAlpha=0.7 and strokeRect — no runtime alpha manipulation at render time
- [Phase 02]: clearLines() returns number[] (row indices) instead of number (count) so animation system can target exact rows
- [Phase 02]: Animation state machine uses elapsed/duration pattern with dt-driven pruning — animations auto-expire without external cleanup
- [Phase 02]: onPieceLock captures state.activePiece.minos before null assignment — timing verified against lockPiece() source
- [02-03]: DAS_DELAY=133ms, ARR_INTERVAL=33ms — TETR.IO standard; DAS callbacks re-check isPaused at each tick to block movement if paused mid-hold
- [02-03]: Control key mapped to CCW rotate without e.preventDefault() — browser undo not intercepted
- [02-03]: Blur handler calls softDrop(false) in addition to clearing DAS intervals — prevents stuck soft-drop state on alt-tab
- [Phase 03-01]: firebase@^12 modular SDK — identical API paths to v11, tree-shaking works with Vite, 0 vulnerabilities
- [Phase 03-01]: Score cap 10,000,000 in Firestore rules — 3-5x above world records; blocks spoofed values without affecting real play
- [Phase 03-01]: setDoc (not updateDoc) in submitScoreIfBest — safe for first-time users with no existing document
- [Phase 03-02]: userRef pattern — user from useAuth() in rAF-adjacent onGameOver callback stored in useRef to avoid stale closure
- [Phase 03-02]: Async IIFE in onGameOver — sync engine callback cannot be async; IIFE lets submitScoreIfBest run without blocking
- [Phase 03-02]: loading guard returns placeholder div (not null) — preserves layout height during auth resolution to prevent layout shift
- [Phase 03-02]: max(localStorage, Firestore) on sign-in — protects against false new-PB banner on fresh devices
- [Phase 03-03]: Right panel width increased 160px → 180px — leaderboard rows (rank + name + score) need extra space for readable display without truncating names
- [Phase 03-03]: onSnapshot returned directly from useEffect (not wrapped in callback) — onSnapshot return value IS the unsubscribe function; returning it directly is the idiomatic React cleanup pattern
- [Phase 03-03]: Leaderboard always visible below SidePanel with thin rgba divider — matches locked user decision (not a modal)
- [Phase 04-01]: CLAUDE.md written at 134 lines — dense and authoritative; 7 never-do items with specific consequences (performance numbers, security impacts)
- [Phase 04-01]: DEV-04 confirmed already complete in Phase 3 — config.ts, .env.example, .gitignore all correct; no code changes needed

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3 - RESOLVED]: Score cap set to 10,000,000 in Firestore rules — verified 3-5x above world records during Phase 3 research.
- [Phase 3]: Decide on Firebase App Check (reCAPTCHA v3) before Phase 4 deployment — easier to enable at launch than retroactively.

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 04-01-PLAN.md — CLAUDE.md and README.md created; Phase 4 Plan 02 (Vercel deployment) is next.
Resume file: None
