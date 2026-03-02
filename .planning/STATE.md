# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A beautiful, playable Tetris experience with a real global leaderboard — the neon aesthetic and smooth gameplay make it worth coming back to.
**Current focus:** Phase 1 — Core Game Engine

## Current Position

Phase: 1 of 4 (Core Game Engine)
Plan: 5 of TBD in current phase
Status: In progress
Last activity: 2026-03-02 — Completed 01-05: Canvas renderer with OffscreenCanvas neon glow, useGameEngine hook, GameBoard component

Progress: [████░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 6.8 min
- Total execution time: 0.57 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 5 completed | ~34 min | ~6.8 min |

**Recent Trend:**
- Last 5 plans: 01-01 (6 min), 01-02 (6 min est.), 01-03 (7 min), 01-04 (8 min), 01-05 (7 min)
- Trend: consistent ~6-8 min per plan

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3]: Validate score cap (999,999) against theoretical maximum before hardcoding into Firestore security rules — Scorer implemented; max score analysis can now be done.
- [Phase 3]: Decide on Firebase App Check (reCAPTCHA v3) before Phase 3 — easier to enable at launch than retroactively.

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 01-05-PLAN.md — offscreen pre-rendering (01a58af), useGameEngine + GameBoard (5edd8f4). Game visually playable in browser at 60fps.
Resume file: None
