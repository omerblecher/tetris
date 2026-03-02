---
phase: 02-react-shell-visual-polish
plan: 01
subsystem: renderer-visual
tags: [synthwave, palette, ghost-piece, grid, canvas, events]
requirements: [VIS-01, VIS-02, VIS-05]
dependency_graph:
  requires: []
  provides: [synthwave-palette, ghost-textures, cleared-row-indices]
  affects: [02-02-animation-state-machine]
tech_stack:
  added: []
  patterns: [pre-baked-offscreen-ghost-textures, outline-only-ghost-rendering]
key_files:
  created: []
  modified:
    - src/engine/constants.ts
    - src/renderer/offscreen.ts
    - src/renderer/CanvasRenderer.ts
    - src/engine/Board.ts
    - src/engine/types.ts
    - src/engine/TetrisEngine.ts
    - src/hooks/useGameEngine.ts
    - src/__tests__/Board.test.ts
decisions:
  - "Ghost textures pre-baked into OffscreenCanvas with globalAlpha=0.7 and strokeRect — no runtime alpha manipulation needed at render time"
  - "clearLines() returns number[] (row indices) instead of number (count) so animation system can target exact rows"
  - "isGhost boolean replaces alpha parameter in drawPiece() for explicit intent"
metrics:
  duration: 2 min
  completed_date: 2026-03-02
  tasks_completed: 2
  files_modified: 8
---

# Phase 2 Plan 01: Visual Foundation — Synthwave Palette, Ghost Outline, Grid + Event Indices Summary

Synthwave neon palette applied to all 7 piece types, ghost piece changed from dim-solid to outline-only via pre-baked OffscreenCanvas, grid lines darkened to #1a1a2e, and `onLineClear` event extended to carry cleared row indices for Plan 02-02's animation state machine.

## What Was Built

### Task 1: Synthwave Palette + Ghost Outline Textures

**constants.ts — Updated PIECE_COLORS (synthwave palette):**

| Piece | Fill | Glow | Description |
|-------|------|------|-------------|
| I | `#00f5ff` | `#00f5ff` | Electric cyan |
| J | `#4d4dff` | `#6666ff` | Electric blue |
| L | `#ff8c00` | `#ffaa00` | Neon orange |
| O | `#ffe600` | `#fff44f` | Neon yellow |
| S | `#00ff7f` | `#00ff9f` | Neon green |
| T | `#bf00ff` | `#d400ff` | Neon purple |
| Z | `#ff2060` | `#ff4080` | Hot pink |

**offscreen.ts — Ghost outline textures:**

Added `GHOST_TEXTURES` map alongside `TEXTURES`. New `preRenderGhost(type)` function renders:
- `globalAlpha = 0.7` (baked into the texture)
- `strokeStyle = glow` from PIECE_COLORS
- `lineWidth = 2`, `shadowBlur = 8`, `shadowColor = glow`
- `strokeRect(3, 3, size-6, size-6)` — 3px inset prevents stroke clipping
- No fill (outline only)

`initTextures()` now also populates `GHOST_TEXTURES`. New `getGhostTexture(type)` exported alongside existing `getTexture()`.

**CanvasRenderer.ts — Ghost rendering + grid lines:**

- `drawPiece(piece, isGhost)` replaces `drawPiece(piece, alpha)` — boolean makes intent explicit
- Ghost calls `getGhostTexture(piece.type)` at `globalAlpha = 1.0` (alpha baked into texture)
- Active piece calls `getTexture(piece.type)` at `globalAlpha = 1.0`
- `drawGrid()` grid line color: `rgba(255, 255, 255, 0.05)` → `#1a1a2e` (VIS-02)

### Task 2: Board.clearLines() Returns Row Indices + onLineClear Carries clearedRows

**Board.ts — clearLines() return type change:**

Changed from `clearLines(): number` (count) to `clearLines(): number[]` (indices). Row indices collected BEFORE mutation so they represent the original board positions. Example: clearing rows 16–19 returns `[16, 17, 18, 19]`.

**types.ts — onLineClear signature:**

```typescript
// Before:
onLineClear: (linesCleared: number, score: number, tSpin: TSpinType, isB2B: boolean) => void;
// After:
onLineClear: (linesCleared: number, score: number, tSpin: TSpinType, isB2B: boolean, clearedRows: number[]) => void;
```

**TetrisEngine.ts — lockPiece() updated:**

```typescript
const clearedRows = this.board.clearLines();          // number[]
const linesCleared = clearedRows.length;              // number (for scorer)
// ...
this.events.onLineClear?.(linesCleared, this.scorer.score, tSpin, this.scorer.b2bActive, clearedRows);
```

**useGameEngine.ts — onLineClear handler:**

Handler now accepts 5th parameter `_clearedRows` (unused in Plan 01, ready for Plan 02-02's animation trigger). Also added explicit `onLineClear` subscription for score/level/lines update (previously done by `onScoreUpdate` only).

**Board.test.ts — Updated assertions:**

| Old assertion | New assertion |
|---|---|
| `expect(board.clearLines()).toBe(0)` | `expect(board.clearLines()).toEqual([])` |
| `expect(cleared).toBe(1)` | `expect(cleared).toEqual([19])` |
| `expect(cleared).toBe(4)` | `expect(cleared).toEqual([16, 17, 18, 19])` |
| `expect(board.clearLines()).toBe(0)` | `expect(board.clearLines()).toEqual([])` |

## Verification Results

- `npm run build`: 0 errors, 0 type errors
- `npm test`: 84/84 tests passing (Board: 25, Scorer: 47, Bag: 12)

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Task | Description |
|------|------|-------------|
| 0bdb704 | Task 1 | feat(02-01): synthwave palette, ghost outline textures, dark grid lines |
| ee39490 | Task 2 | feat(02-01): Board.clearLines() returns number[], onLineClear carries clearedRows |

## Self-Check: PASSED

All files exist. Both task commits verified (0bdb704, ee39490). 84/84 tests pass. Build clean.
