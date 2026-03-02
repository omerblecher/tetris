---
phase: 02-react-shell-visual-polish
plan: 02
subsystem: renderer-animation
tags: [animation, state-machine, flash-effects, canvas, rAF, delta-time]
requirements: [VIS-03, VIS-04, VIS-06]
dependency_graph:
  requires: [02-01]
  provides: [animation-state-machine, lock-flash, line-clear-flash, level-up-flash]
  affects: [02-04-canvas-scaling]
tech_stack:
  added: []
  patterns: [animation-state-machine, elapsed-timer-pruning, dt-driven-animation]
key_files:
  created: []
  modified:
    - src/renderer/CanvasRenderer.ts
    - src/hooks/useGameEngine.ts
decisions:
  - "Animation state machine uses elapsed/duration pattern with dt-driven pruning — animations auto-expire without external cleanup"
  - "onPieceLock handler captures state.activePiece.minos BEFORE activePiece is set to null — timing verified against lockPiece() source (event fires at line 230, null assignment at line 249)"
  - "onLineClear and onLevelUp handlers both update displayState for immediate score feedback on same frame as animation trigger"
metrics:
  duration: 5 min
  completed_date: 2026-03-02
  tasks_completed: 2
  files_modified: 2
---

# Phase 2 Plan 02: Animation State Machine — Line-Clear, Lock-In, Level-Up Flash Summary

Animation state machine added to CanvasRenderer using elapsed/duration pattern driven by delta-time; three flash effects (line-clear white row flash, lock-in mino flash, level-up board pulse) wired to engine events with zero React re-renders.

## What Was Built

### Task 1: Animation State Machine in CanvasRenderer

**Types added:**

```typescript
type AnimationType = 'lineClear' | 'lockFlash' | 'levelUp';

interface AnimationState {
  type: AnimationType;
  elapsed: number;
  duration: number;
  rows?: number[];             // lineClear: which rows to flash
  cells?: [number, number][];  // lockFlash: mino [col, row] positions
}
```

**Class fields and trigger methods:**

`private animations: AnimationState[] = []` — multiple animations can be active simultaneously (e.g., lock flash during line clear).

Three public trigger methods enqueue animation entries:
- `triggerLineClear(rows: number[])` — 100ms white row flash
- `triggerLockFlash(cells: [number, number][])` — 50ms white mino flash
- `triggerLevelUp()` — 300ms pink/purple board pulse

**Render pipeline update:**

`render(state: GameState, dt: number)` — dt added as second parameter.

At render start, before `clearRect`:
```typescript
this.animations = this.animations.filter(a => {
  a.elapsed += dt;
  return a.elapsed < a.duration;
});
```

Animations prune themselves — no external cleanup needed. Multiple overlapping animations (lock + line-clear) are supported naturally.

**Draw layer order:**

1. Grid
2. Board cells
3. Ghost piece
4. Active piece
5. Animation overlays (new — after game elements, before game-over)
6. Game-over overlay

**Three private draw methods:**

| Method | Effect | Alpha formula |
|--------|--------|---------------|
| `drawLineClearFlash(rows, progress)` | White fill over full row width | `(1 - progress) * 0.85` — fades from 0.85 to 0 |
| `drawLockFlash(cells, progress)` | White fill over each mino cell | `(1 - progress) * 0.7` — fades from 0.7 to 0 |
| `drawLevelUpFlash(progress)` | Pink/purple fill over full canvas | `sin(progress * PI) * 0.4` — pulses in then out |

### Task 2: Wire Animation Triggers in useGameEngine

**dt passed to renderer:**
```typescript
rendererRef.current.render(engineRef.current.state, dt);
```

**onPieceLock handler — lock flash with mino capture:**

Key timing detail: `onPieceLock` fires at `lockPiece()` line 230, before `this.activePiece = null` at line 249. The engine's `state` getter returns `p.snapshot()` where `p = this.activePiece`. So at event time, `engineRef.current?.state.activePiece` is still non-null and reflects the piece that just locked.

```typescript
engine.on('onPieceLock', (_pieceType, _tSpin) => {
  const state = engineRef.current?.state;
  if (state?.activePiece) {
    lastLockedCells = state.activePiece.minos.map(([dc, dr]) => [
      state.activePiece!.col + dc,
      state.activePiece!.row + dr,
    ] as [number, number]);
  }
  rendererRef.current?.triggerLockFlash(lastLockedCells);
  setDisplayState(prev => ({ ...prev, nextPieces: engineRef.current?.state.nextPieces ?? [] }));
});
```

**onLineClear handler — line clear flash:**

The `clearedRows: number[]` parameter (added in Plan 02-01) passes exact row indices directly to the renderer.

**onLevelUp handler — new handler:**

Previously no `onLevelUp` subscription existed. Added to trigger `triggerLevelUp()` and update level display.

**rendererRef exposed in return:**

`return { engineRef, rendererRef, displayState, restart }` — rendererRef now accessible to parent components for future plans (02-03 keyboard, 02-06 game-over overlay).

## Verification Results

- `npm run build`: 0 TypeScript errors, Vite production build clean
- `npm test`: 84/84 tests passing (Board: 25, Scorer: 47, Bag: 12)
- Animation code is renderer-only — no test changes needed

## Deviations from Plan

None — plan executed exactly as written. The timing of `onPieceLock` vs `activePiece = null` was as described in the plan (event fires before null assignment), confirmed by reading TetrisEngine.lockPiece() source.

## Commits

| Hash | Task | Description |
|------|------|-------------|
| 506908f | Task 1 | feat(02-02): animation state machine in CanvasRenderer |
| 6db709a | Task 2 | feat(02-02): wire animation triggers in useGameEngine, pass dt to renderer |

## Self-Check: PASSED

All files exist. Both task commits verified. 84/84 tests pass. Build clean with 0 errors.
