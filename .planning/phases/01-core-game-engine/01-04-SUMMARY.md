---
phase: 01-core-game-engine
plan: 04
subsystem: engine
tags: [typescript, tetris, game-engine, SRS, lock-delay, T-spin, gravity, rAF, delta-time]

# Dependency graph
requires:
  - phase: 01-01
    provides: Board, Bag, SRS, constants, types — all engine primitives
  - phase: 01-02
    provides: Board (TDD verified), Bag (TDD verified)
  - phase: 01-03
    provides: Scorer (TDD verified), gravity formula

provides:
  - Piece class: active piece with SRS rotation, ghost calculation, T-spin metadata
  - LockDelay class: Extended Placement lock-down (500ms, 15-move cap)
  - TetrisEngine class: full game loop, public console API (window.game), event emitter
  - window.game console API for Phase 1 browser testing

affects:
  - 02-react-shell (hooks call engine.update(dt), subscribe to engine events)
  - 03-firebase (reads engine.scorer.score for leaderboard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - rAF + delta-time gravity (no setInterval drift)
    - useRef game state pattern (React state only for display values)
    - Event emitter (Partial<GameEvents>) for React subscription in Phase 2
    - T-spin 3-corner rule with front/back distinction and 5th-kick full promotion
    - Extended Placement lock-down: 500ms / 15-move cap / resets on row descent

key-files:
  created:
    - src/engine/Piece.ts
    - src/engine/LockDelay.ts
    - src/engine/TetrisEngine.ts
  modified:
    - src/main.tsx

key-decisions:
  - "Gravity pauses during lock delay — accumulator frozen while LockDelay.isActive to prevent double-locking"
  - "T-spin center at (col+1, row+1) — consistent with 3x3 bounding box T piece in spawn orientation"
  - "debug.setNextPiece() uses type cast (this.bag as any).queue.unshift — acceptable for console testing only"
  - "window.game rAF loop capped at dt=100ms to prevent spiral-of-death on tab blur"
  - "Hold swap: activePiece replaced with new Piece(swapType) — always spawns in initial rotation state"

patterns-established:
  - "Engine pattern: engine.update(dt) called by rAF hook; engine manages all game state internally"
  - "Event pattern: engine.on('onLineClear', handler) for React subscriptions; handlers called synchronously on each event"
  - "Snapshot pattern: engine.state returns immutable snapshot for renderer; no direct reference to mutable state"

requirements-completed: [ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, ENG-08, ENG-11]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 1 Plan 04: Piece, LockDelay, TetrisEngine Summary

**Full Tetris engine assembled: rAF delta-time gravity, SRS rotation with T-spin detection (3-corner rule), Extended Placement lock-down (500ms/15-move cap), and window.game console API**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T06:30:00Z
- **Completed:** 2026-03-02T06:38:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Piece class with SRS wall-kick rotation, ghost row calculation, and T-spin metadata tracking (lastMoveWasRotation, lastKickIndex)
- LockDelay class implementing Extended Placement (500ms timer, 15-move reset cap, cap resets on row descent)
- TetrisEngine integrating Board, Bag, Scorer, Piece, LockDelay into a complete game loop
- Public console API (window.game) with moveLeft, moveRight, rotate, hardDrop, softDrop, hold, tick, pause, resume, reset, state, score, level, lines, debug.printBoard, debug.setNextPiece
- Event emitter for Phase 2 React subscriptions: onLineClear, onGameOver, onLevelUp, onPieceLock, onScoreUpdate, onHold
- T-spin detection: 3-corner rule with front/back distinction; 5th kick (index 4) auto-promotes mini to full
- Game over detection: spawn collision triggers isGameOver flag and onGameOver event

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Piece and LockDelay** - `f995973` (feat)
2. **Task 2: Implement TetrisEngine — game loop, public API, event emitter** - `2c8e9da` (feat)

## Files Created/Modified
- `src/engine/Piece.ts` - Active piece: position, rotation, SRS tryRotate(), ghostRow(), snapshot(), ghostSnapshot(), T-spin metadata
- `src/engine/LockDelay.ts` - Extended Placement lock-down: start(), onMoveOrRotate(), onRowDescend(), tick(), deactivate()
- `src/engine/TetrisEngine.ts` - Full game loop: gravity (rAF + delta-time), piece lifecycle, T-spin detection, event emitter, public console API
- `src/main.tsx` - Engine instantiation, window.game exposure, minimal rAF loop for Phase 1 console testing

## Decisions Made
- Gravity accumulator freezes while LockDelay is active — prevents double-locking when piece hits floor mid-accumulation tick
- T-spin center at (col+1, row+1) — matches 3x3 T-piece bounding box; corners are at (center.col ± 1, center.row ± 1)
- rAF loop dt capped at 100ms — prevents spiral-of-death when tab returns from background
- Hold always spawns fresh Piece(swapType) — piece returns to spawn rotation, consistent with Guideline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all engine primitives (Board, Bag, Scorer, SRS) from Plans 01-01 through 01-03 integrated cleanly. Zero TypeScript errors on first build attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Full engine is playable from browser console via window.game
- Phase 2 React shell can import TetrisEngine, call engine.update(dt) in a useGameEngine hook, and subscribe to events
- Canvas renderer (Phase 2) receives immutable snapshots via engine.state
- Engine events ready: onLineClear (with B2B flag), onLevelUp, onPieceLock (with T-spin type), onScoreUpdate, onGameOver, onHold

## Self-Check: PASSED

- src/engine/Piece.ts: FOUND
- src/engine/LockDelay.ts: FOUND
- src/engine/TetrisEngine.ts: FOUND
- .planning/phases/01-core-game-engine/01-04-SUMMARY.md: FOUND
- Commit f995973 (Piece + LockDelay): FOUND
- Commit 2c8e9da (TetrisEngine + window.game): FOUND
- Build: PASSED (zero TypeScript errors, 205kB bundle)

---
*Phase: 01-core-game-engine*
*Completed: 2026-03-02*
