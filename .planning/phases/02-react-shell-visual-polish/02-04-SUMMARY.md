---
phase: 02-react-shell-visual-polish
plan: 04
subsystem: layout
tags: [css-grid, responsive, side-panel, orbitron, dpr, local-storage]
dependency_graph:
  requires: ["02-03"]
  provides: ["three-column layout", "SidePanel component", "heldPiece tracking", "bestScore persistence"]
  affects: ["02-05", "02-06", "02-07"]
tech_stack:
  added: ["Google Fonts Orbitron", "CSS Grid", "localStorage best score"]
  patterns: ["CSS grid-template-areas", "DPR canvas scaling", "prop-lifting from GameBoard to App"]
key_files:
  created: ["src/components/SidePanel.tsx"]
  modified: ["src/App.tsx", "src/components/GameBoard.tsx", "src/hooks/useGameEngine.ts", "src/index.css", "index.html", "src/renderer/CanvasRenderer.ts"]
decisions:
  - "onTogglePause prop defined in GameBoardProps but prefixed _onTogglePause — reserved for Plan 02-05 virtual controls; unused params cause TS6133 in strict mode"
  - "saveBestScore returns the new best (not void) so onGameOver can update displayState.bestScore atomically"
  - "isPaused synced in onScoreUpdate callback (fires every lock) rather than a dedicated toggle — sufficient accuracy for display purposes"
metrics:
  duration: "~10 min"
  completed: "2026-03-02T17:16:06Z"
  tasks_completed: 2
  files_modified: 7
---

# Phase 2 Plan 4: CSS Grid Layout + SidePanel Component Summary

CSS Grid three-column layout (Hold | Board | Score/Next) with Orbitron font, canvas DPR scaling, SidePanel component, and localStorage best-score persistence.

## What Was Built

### Task 1: CSS Foundation (commit aaaf08e)

**index.html** — Google Fonts preconnect and Orbitron 400/700/900 link tags added before existing content.

**src/index.css** — Full replacement with synthwave layout system:
- CSS custom properties: `--color-bg`, `--color-grid`, `--color-border`, `--color-text`, `--color-accent`, `--color-dim`, plus per-piece neon colors (`--color-I` through `--color-Z`)
- Desktop: `.game-layout` uses `grid-template-areas: "left-panel board right-panel"` with `grid-template-columns: 140px auto 160px`
- Canvas: `canvas#game-canvas` uses `max-height: calc(100vh - 32px)` + `aspect-ratio: 10 / 20` to scale without changing drawing buffer; `touch-action: none` prevents scroll on touch
- Panel classes: `.side-panel`, `.panel-section`, `.panel-label`, `.panel-value`, `.piece-swatch`
- Mobile (`max-width: 600px`): single-column stacked with `grid-template-areas: "board" "right-panel" "left-panel"`, sticky `.virtual-controls` bar at bottom

**src/renderer/CanvasRenderer.ts** — DPR scaling in constructor:
- `canvas.width = COLS * CELL_SIZE * dpr` / `canvas.height = ROWS * CELL_SIZE * dpr` sets physical pixel buffer
- `canvas.style.width/height` set to logical pixel dimensions
- `ctx.scale(dpr, dpr)` makes all draw calls use logical coordinates
- All overlay methods (`drawGameOverOverlay`, `drawLevelUpFlash`) already used logical dimensions — no changes needed

### Task 2: Component Restructure (commit be1bc39)

**src/components/SidePanel.tsx** (new file):
- `PieceSwatch` sub-component: renders colored div with neon `boxShadow` for known piece, or `.piece-swatch.empty` placeholder
- `SidePanel` with `side: 'left' | 'right'` prop:
  - Left panel: Hold section with `PieceSwatch`
  - Right panel: Score (toLocaleString), Best (toLocaleString), Level, Lines, Next (PieceSwatch)

**src/hooks/useGameEngine.ts** — Extended DisplayState:
```typescript
interface DisplayState {
  score: number; level: number; lines: number;
  isGameOver: boolean; nextPieces: PieceType[];
  heldPiece: PieceType | null;   // NEW
  bestScore: number;              // NEW
  isPaused: boolean;              // NEW
}
```
- `loadBestScore()` / `saveBestScore()`: localStorage helpers using key `tetris_best`
- `onHold` handler: `setDisplayState(prev => ({ ...prev, heldPiece: heldType }))`
- `onGameOver` handler: calls `saveBestScore(finalScore)` then updates `bestScore` in displayState
- `togglePause()`: calls `engine.pause()` / `engine.resume()` then flips `displayState.isPaused`
- Returns: `{ engineRef, rendererRef, displayState, restart, togglePause }`

**src/App.tsx** — Replaced flex centering with CSS Grid layout shell:
- `useGameEngine(canvasRef)` lifted here from GameBoard
- Three-column structure: `<div className="game-layout">` with `.panel-left` / `.panel-board` / `.panel-right`
- `SidePanel side="left"` receives `heldPiece`; `SidePanel side="right"` receives score/level/lines/bestScore/nextPiece

**src/components/GameBoard.tsx** — Board-only, props-driven:
- Removed `useGameEngine`, `useRef` for canvas, score display, NEXT preview, controls legend
- Accepts `canvasRef`, `engineRef`, `isGameOver`, `onRestart`, `onTogglePause` as props
- `useKeyboard(engineRef)` preserved (called once, here)
- Canvas: `<canvas id="game-canvas" ref={canvasRef} />` — no `width`/`height` attrs (CanvasRenderer sets them via DPR logic)
- Game-over overlay: Orbitron font, `#ff2060` GAME OVER text, `var(--color-accent)` PLAY AGAIN button

## CSS Grid Structure

```
Desktop (>600px):
+-------------+------------------------+------------------+
| .panel-left | .panel-board           | .panel-right     |
| (140px)     | (auto — canvas width)  | (160px)          |
| Hold: [T]   | [canvas#game-canvas]   | Score: 12,400    |
|             |                        | Best:  15,200    |
|             |                        | Level: 3         |
|             |                        | Lines: 28        |
|             |                        | Next:  [L]       |
+-------------+------------------------+------------------+

Mobile (<=600px, stacked):
+----------------------------------+
| .panel-board (canvas full width) |
+----------------------------------+
| .panel-right (flex-wrap row)     |
+----------------------------------+
| .panel-left (flex-wrap row)      |
+----------------------------------+
| .virtual-controls (sticky)       |
+----------------------------------+
```

## DPR Implementation

```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width  = COLS * CELL_SIZE * dpr;   // physical pixels
canvas.height = ROWS * CELL_SIZE * dpr;
canvas.style.width  = `${COLS * CELL_SIZE}px`;  // logical CSS
canvas.style.height = `${ROWS * CELL_SIZE}px`;
ctx.scale(dpr, dpr);  // all draw calls in logical coords
```
CSS `aspect-ratio: 10 / 20` + `max-height: calc(100vh - 32px)` handles viewport scaling without touching the drawing buffer.

## heldPiece / bestScore Tracking

- `heldPiece`: initialized `null` in displayState; updated via `engine.on('onHold', heldType => ...)`. The engine fires `onHold` immediately on `hold()` call (before swap completes), passing the newly held type.
- `bestScore`: initialized from `localStorage` on hook mount; updated only on game over via `saveBestScore()` which compares against stored value before writing.
- `isPaused`: initialized `false`; updated in `onScoreUpdate` (syncs with engine) and in `togglePause()` (optimistic update for immediate UI response).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] onTogglePause unused param causes TS6133 strict error**
- **Found during:** Task 2 — first build attempt
- **Issue:** `onTogglePause` prop is defined in `GameBoardProps` and destructured but not used inside GameBoard (virtual controls not wired until Plan 02-05). TypeScript strict mode emits TS6133: 'onTogglePause' is declared but its value is never read.
- **Fix:** Renamed destructured param to `_onTogglePause` — TypeScript convention for intentionally unused parameters. Prop interface unchanged so App.tsx passes it normally.
- **Files modified:** `src/components/GameBoard.tsx`
- **Commit:** be1bc39

## Self-Check
