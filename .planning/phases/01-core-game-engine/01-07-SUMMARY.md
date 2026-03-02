---
phase: 01-core-game-engine
plan: 07
subsystem: ui
tags: [react, typescript, tetris, next-piece-preview, engine-events]

# Dependency graph
requires:
  - phase: 01-05
    provides: useGameEngine hook with DisplayState and engine callbacks; GameBoard component with canvas renderer
provides:
  - nextPieces: PieceType[] surfaced in DisplayState via onPieceLock callback
  - NEXT preview panel in GameBoard showing 3 upcoming pieces as neon-colored labeled blocks
affects: [02-react-shell, phase-2-visual-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [engine callback drives React state update for non-score display data; onPieceLock used for semantic nextPieces refresh rather than polling in rAF loop]

key-files:
  created: []
  modified:
    - src/hooks/useGameEngine.ts
    - src/components/GameBoard.tsx

key-decisions:
  - "onPieceLock callback used to refresh nextPieces — semantically cleaner than piggybacking on onScoreUpdate"
  - "Initial nextPieces seeded synchronously after engine construction before rAF starts — avoids empty preview flash on mount"
  - "CSS div blocks used for preview panel (not a second canvas) — keeps change additive and self-contained"
  - "nextPieces.slice(0, 3) guard in JSX prevents crash if fewer than 3 pieces available during early init"

patterns-established:
  - "Pattern: Any non-score engine data surfaced via new engine.on() callback -> setDisplayState(prev => ({...prev, field}))"
  - "Pattern: restart() must re-seed all displayState fields from fresh engine.state after reset()"

requirements-completed: [ENG-09]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 1 Plan 7: Next-Piece Preview Panel Summary

**Next-piece preview panel (ENG-09): nextPieces surfaced via onPieceLock callback into DisplayState, rendered as 3 neon-colored labeled CSS blocks in GameBoard**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-02T11:08:14Z
- **Completed:** 2026-03-02T11:09:35Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Added `nextPieces: PieceType[]` to `DisplayState` interface in `useGameEngine.ts` with initial seeding and `onPieceLock` refresh
- Rendered "NEXT" panel in `GameBoard.tsx` showing 3 upcoming pieces as neon-colored labeled CSS div blocks
- Closed ENG-09 gap — engine's `bag.peek(3)` was already available; only the hook and component needed updating
- Zero regressions: `npm run build` clean, 84/84 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Surface nextPieces in displayState and render next-piece preview panel** - `08c48f7` (feat)

## Files Created/Modified
- `src/hooks/useGameEngine.ts` - Added PieceType import, nextPieces to DisplayState, initial seed, onPieceLock callback, restart fix
- `src/components/GameBoard.tsx` - Added PIECE_COLORS import, nextPieces destructure, NEXT preview panel JSX

## Decisions Made
- Used `onPieceLock` (not `onScoreUpdate`) to refresh `nextPieces` — onPieceLock fires immediately when a piece locks, before the score update, making it the semantically correct event for this purpose
- Seeded `nextPieces` synchronously after `engineRef.current = engine` assignment so the preview is populated before the first `requestAnimationFrame` fires (avoids a blank NEXT panel on mount)
- `restart()` updated to re-read `engineRef.current?.state.nextPieces` after `engine.reset()` so the preview reflects the fresh bag on game restart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ENG-09 complete: 3-piece next-preview panel visible, reactive, and correctly data-sourced
- Phase 1 engine requirements gap now closed (ENG-09 was the last remaining display gap)
- Phase 2 visual polish can expand this preview into proper tetromino mini-canvas renders if desired

---
*Phase: 01-core-game-engine*
*Completed: 2026-03-02*
