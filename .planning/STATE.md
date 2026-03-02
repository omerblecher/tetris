# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A beautiful, playable Tetris experience with a real global leaderboard — the neon aesthetic and smooth gameplay make it worth coming back to.
**Current focus:** Phase 1 — Core Game Engine

## Current Position

Phase: 1 of 4 (Core Game Engine)
Plan: 3 of TBD in current phase
Status: In progress
Last activity: 2026-03-02 — Completed 01-03: Scorer module (TDD) — full Guideline scoring

Progress: [██░░░░░░░░] 15%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 6.3 min
- Total execution time: 0.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 3 completed | ~19 min | ~6.3 min |

**Recent Trend:**
- Last 5 plans: 01-01 (6 min), 01-02 (6 min est.), 01-03 (7 min)
- Trend: consistent ~6-7 min per plan

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
- [01-03]: Guideline gravity formula at level 1 produces 1000ms (not 800ms) — `(0.8)^0 = 1.0s`. Plan spec had erroneous test expectations; formula itself is correct per tetris.wiki.
- [01-03]: Scorer tests isolate B2B from combo by setting `b2bActive` directly — cleaner than sequential clears that trigger both modifiers simultaneously.
- [01-03]: Perfect clear uses level-scaled Guideline values (PC_SCORES: 800/1200/1800/2000 × level; B2B Tetris PC: 3200 × level) rather than flat 3500 placeholder.

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3]: Validate score cap (999,999) against theoretical maximum before hardcoding into Firestore security rules — Scorer implemented; max score analysis can now be done.
- [Phase 3]: Decide on Firebase App Check (reCAPTCHA v3) before Phase 3 — easier to enable at launch than retroactively.

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 01-03-PLAN.md — Scorer module (TDD): calculateLineClearScore, addHardDropScore, addSoftDropScore, getGravityMs, reset. RED: 582a7d2, GREEN: a4e1f71.
Resume file: None
