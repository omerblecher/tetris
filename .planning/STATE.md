# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A beautiful, playable Tetris experience with a real global leaderboard — the neon aesthetic and smooth gameplay make it worth coming back to.
**Current focus:** Phase 1 — Core Game Engine

## Current Position

Phase: 1 of 4 (Core Game Engine)
Plan: 1 of TBD in current phase
Status: In progress
Last activity: 2026-03-02 — Completed 01-01: Vite scaffold + engine types + SRS wall kicks

Progress: [█░░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 6 min
- Total execution time: 0.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 1 completed | 6 min | 6 min |

**Recent Trend:**
- Last 5 plans: 01-01 (6 min)
- Trend: baseline established

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3]: Validate score cap (999,999) against theoretical maximum before hardcoding into Firestore security rules — check during Phase 1 scoring implementation.
- [Phase 3]: Decide on Firebase App Check (reCAPTCHA v3) before Phase 3 — easier to enable at launch than retroactively.

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 01-01-PLAN.md — Vite scaffold, types, constants, SRS kick tables. 3 tasks, 3 commits (88441cb, 8e89eed, e2cde74).
Resume file: None
