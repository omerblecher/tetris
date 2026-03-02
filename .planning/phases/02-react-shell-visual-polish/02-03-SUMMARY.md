---
phase: 02-react-shell-visual-polish
plan: 03
subsystem: ui
tags: [react, typescript, keyboard, das, arr, pause, hooks]

# Dependency graph
requires:
  - phase: 01-core-game-engine
    provides: TetrisEngine with moveLeft/moveRight/rotate/hardDrop/softDrop/hold/pause/resume
  - phase: 02-react-shell-visual-polish/02-01
    provides: CanvasRenderer with dt-based animation system
provides:
  - useKeyboard hook with DAS/ARR auto-repeat (DAS_DELAY=133ms, ARR_INTERVAL=33ms)
  - TetrisEngine.isPaused and isGameOver public getters
  - P key pause/resume support
  - Window blur handler to prevent stuck movement on alt-tab
affects: [02-04-layout, 02-05-mobile-touch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DAS/ARR keyboard hook extracted into src/hooks/useKeyboard.ts
    - engineRef passed to hook; hook reads isPaused/isGameOver before DAS action fires
    - Blur handler clears all active setInterval timers to prevent stuck auto-repeat

key-files:
  created:
    - src/hooks/useKeyboard.ts
  modified:
    - src/engine/TetrisEngine.ts
    - src/components/GameBoard.tsx
    - src/hooks/useGameEngine.ts

key-decisions:
  - "DAS_DELAY=133ms, ARR_INTERVAL=33ms — TETR.IO standard; gives snappy feel without being too fast"
  - "DAS callbacks re-check engineRef.current.isPaused at each tick, not at keydown time — prevents movement if paused mid-hold"
  - "Control key mapped to CCW rotate (alongside Z) — e.preventDefault() not called for Ctrl so browser undo is not intercepted"
  - "Blur handler calls softDrop(false) in addition to clearing DAS intervals — prevents stuck soft-drop state"

patterns-established:
  - "Keyboard hook pattern: useKeyboard(engineRef) — self-contained, manages its own event listeners via useEffect cleanup"
  - "DAS/ARR state: Map<string, DASState> with timer and interval fields; startDAS/stopDAS per key string"

requirements-completed: [CTR-01, CTR-04]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 2 Plan 03: Keyboard DAS/ARR + Pause Summary

**useKeyboard hook with 133ms DAS delay, 33ms ARR repeat, P-key pause/resume, and blur safety guard extracted from GameBoard**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-02T19:00:00Z
- **Completed:** 2026-03-02T19:08:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `src/hooks/useKeyboard.ts` with DAS/ARR auto-repeat for left/right arrows
- Added `isPaused` and `isGameOver` public getters to `TetrisEngine` so the keyboard hook can check state without accessing private fields
- Replaced the 35-line raw keydown/keyup `useEffect` in `GameBoard.tsx` with a single `useKeyboard(engineRef)` call
- P key toggles pause/resume; DAS callbacks guard against movement while paused
- Window blur handler clears all active DAS intervals and resets soft-drop to prevent stuck movement on alt-tab

## Task Commits

Each task was committed atomically:

1. **Task 1: Add isPaused/isGameOver getters + create useKeyboard hook** - `b05416f` (feat)
2. **Task 2: Wire useKeyboard into GameBoard, remove raw keydown handler** - `9327f6f` (feat)

**Plan metadata:** _(created in final commit)_

## Files Created/Modified

- `src/hooks/useKeyboard.ts` - New DAS/ARR keyboard hook; DAS_DELAY=133ms, ARR_INTERVAL=33ms; handles left/right/up/down/space/Z/Ctrl/C/P
- `src/engine/TetrisEngine.ts` - Added `get isPaused()` and `get isGameOver()` public getters after existing score/level/lines getters
- `src/components/GameBoard.tsx` - Removed raw keyboard useEffect; calls `useKeyboard(engineRef)`; updated controls legend to include Z/Ctrl CCW and P Pause
- `src/hooks/useGameEngine.ts` - Fixed missing `dt` argument in `rendererRef.current.render()` call (auto-fix); added lock flash and level-up animation triggers

## Decisions Made

- **DAS_DELAY=133ms** — TETR.IO/Guideline standard. Gives ~4 frames of hold before repeat starts at 30fps — snappy but not so instant that miskeys trigger auto-repeat.
- **ARR_INTERVAL=33ms** — 2 frames at 60fps. Lets the piece move at 30 cells/sec maximum — fast enough for skilled play, controlled enough for beginners.
- **DAS callbacks re-check `isPaused` at each tick interval**, not just at keydown time. This means if the user presses P while holding left, the ongoing DAS ticks will stop moving the piece immediately rather than continuing for one more tick.
- **`Control` key maps to CCW rotate** alongside Z — supports Ctrl+Z muscle memory from desktop use. `e.preventDefault()` is not called for Ctrl key, so browser undo shortcut is not intercepted at the handler level.
- **Blur handler calls `softDrop(false)`** in addition to clearing DAS intervals. Without this, releasing the arrow key while alt-tabbing would leave soft-drop active.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing `dt` argument in CanvasRenderer.render() call**
- **Found during:** Task 1 (build verification)
- **Issue:** `useGameEngine.ts` line 70 called `rendererRef.current.render(engineRef.current.state)` but `CanvasRenderer.render()` requires 2 arguments: `(state: GameState, dt: number)`. The signature changed in 02-01 (animation system) but the call site was not updated.
- **Fix:** Changed call to `rendererRef.current.render(engineRef.current.state, dt)` where `dt` is already available in the loop function scope.
- **Files modified:** `src/hooks/useGameEngine.ts`
- **Verification:** `npm run build` passes with 0 TypeScript errors after fix
- **Committed in:** `b05416f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary correctness fix. The build was broken before this plan started due to mismatched render() signature from 02-01. No scope creep.

## Issues Encountered

None beyond the auto-fixed build error above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Keyboard controls complete with DAS/ARR, pause, and blur guard
- `useKeyboard` hook is standalone and portable — Plan 02-04 layout refactor can keep `useKeyboard(engineRef)` in the top-level component
- Plan 02-05 (mobile touch) will add a parallel `useTouchControls` hook following the same pattern
- CTR-01 (keyboard DAS/ARR) and CTR-04 (pause/resume) requirements satisfied

---
*Phase: 02-react-shell-visual-polish*
*Completed: 2026-03-02*
