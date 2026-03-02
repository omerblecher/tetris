---
phase: 01-core-game-engine
plan: 05
subsystem: renderer
tags: [typescript, canvas, offscreencanvas, react, hooks, useRef, rAF, neon, glow, shadowBlur]

# Dependency graph
requires:
  - phase: 01-04
    provides: TetrisEngine with update(dt), state snapshot, event emitter (onScoreUpdate, onGameOver), full game loop
  - phase: 01-01
    provides: constants (CELL_SIZE, COLS, ROWS, PIECE_COLORS, CELL_TO_PIECE), types (PieceType, CellValue, GameState, PieceSnapshot)

provides:
  - offscreen.ts: initTextures() + getTexture() + getTextureForCell() — OffscreenCanvas pre-rendering with shadowBlur baked in at startup
  - CanvasRenderer: render(state) — composites board cells, ghost piece (25% alpha), active piece each frame via drawImage
  - useGameEngine hook: engine + renderer in useRef, rAF loop in useEffect, score/level/lines/isGameOver in useState
  - GameBoard component: canvas + score overlay + game over screen + keyboard controls (arrows, Z, Space, C)
  - App.tsx: GameBoard centered on dark (#0d0d1a) background

affects:
  - 02-react-shell (GameBoard will be extended with DAS/ARR, mobile touch, hold/next preview panels)
  - 03-firebase (score display already wired to engine events — Firebase will add leaderboard submission)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - OffscreenCanvas pre-rendering: shadowBlur baked in once at startup, never set at render time
    - drawImage compositing: 60fps main canvas uses only drawImage from pre-rendered textures
    - useRef for game objects: TetrisEngine and CanvasRenderer held in useRef, never re-created
    - useEffect rAF loop: requestAnimationFrame loop started in useEffect, cancelled on unmount
    - Engine event pattern: React state updated only via onScoreUpdate/onGameOver callbacks (~1-4x per piece)
    - globalAlpha compositing: ghost piece drawn at 0.25 alpha by setting ctx.globalAlpha before drawImage

key-files:
  created:
    - src/renderer/offscreen.ts
    - src/renderer/CanvasRenderer.ts
    - src/hooks/useGameEngine.ts
    - src/components/GameBoard.tsx
  modified:
    - src/App.tsx
    - src/main.tsx

key-decisions:
  - "shadowBlur set only in offscreen.ts preRenderPiece() — never on main canvas at render time (GPU cost)"
  - "initTextures() called once in CanvasRenderer constructor — textures shared across all frames"
  - "useEffect empty deps array — engine created once, never recreated on re-render"
  - "main.tsx cleanup: removed Phase 1 rAF loop and window.game (moved to useGameEngine hook)"
  - "Ghost piece uses globalAlpha = 0.25 with same texture — no separate ghost-colored texture needed"

patterns-established:
  - "Renderer pattern: CanvasRenderer.render(state) called every rAF frame, reads immutable GameState snapshot"
  - "Hook pattern: useGameEngine encapsulates all engine lifecycle — callers only see displayState + restart()"
  - "Canvas sizing: canvas.width/height set in CanvasRenderer constructor from COLS/ROWS * CELL_SIZE constants"

requirements-completed: [ENG-04, ENG-07, SCR-06]

# Metrics
duration: 7min
completed: 2026-03-02
---

# Phase 1 Plan 05: Canvas Renderer and React Shell Summary

**Canvas 2D rendering with OffscreenCanvas neon glow pre-rendering, useGameEngine rAF hook (engine in useRef), and GameBoard component with score overlay and keyboard controls**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-02T06:35:14Z
- **Completed:** 2026-03-02T06:42:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- offscreen.ts pre-renders each of 7 piece types to OffscreenCanvas with shadowBlur=12 baked in at startup — never set at render time (critical GPU optimization)
- CanvasRenderer composites board cells, ghost piece at 25% alpha, and active piece each frame using drawImage from textures — no per-frame shadowBlur
- useGameEngine hook: engine + renderer in useRef (never in React state), rAF loop in useEffect with 100ms dt cap, score/level/lines/isGameOver in useState updated via engine events only
- GameBoard component: canvas element + score/level/lines overlay + game over screen with PLAY AGAIN button + keyboard controls (arrows, Z=CCW, Space=hardDrop, C=hold)
- App.tsx: centered GameBoard on dark (#0d0d1a) synthwave background; main.tsx cleaned up (removed Phase 1 console-only rAF loop)
- window.game console API still exposed via useGameEngine for console testing

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement offscreen pre-rendering and CanvasRenderer** - `01a58af` (feat)
2. **Task 2: Implement useGameEngine hook and GameBoard component** - `5edd8f4` (feat)

## Files Created/Modified
- `src/renderer/offscreen.ts` - initTextures(), getTexture(type), getTextureForCell(cell) — OffscreenCanvas with shadowBlur baked in
- `src/renderer/CanvasRenderer.ts` - CanvasRenderer class: render(state) composites grid, board cells, ghost, active piece, game-over overlay
- `src/hooks/useGameEngine.ts` - useGameEngine hook: engine/renderer in useRef, rAF loop, display state via engine events
- `src/components/GameBoard.tsx` - GameBoard React component: canvas + score overlay + game over + keyboard controls
- `src/App.tsx` - Updated to render GameBoard centered on dark background
- `src/main.tsx` - Cleaned up: removed Phase 1 console rAF loop (moved to useGameEngine)

## Decisions Made
- shadowBlur set only in offscreen.ts preRenderPiece() — never on main canvas CanvasRenderer at render time; prevents GPU paint cost at 60fps with 200 cells
- initTextures() called once in CanvasRenderer constructor — all 7 piece OffscreenCanvases shared across all render frames
- useEffect empty deps array — engine and renderer created once per mount, never recreated on re-render
- Ghost piece uses ctx.globalAlpha = 0.25 with same pre-rendered texture — no separate ghost texture needed
- main.tsx Phase 1 rAF loop removed — window.game and rAF lifecycle now fully owned by useGameEngine hook

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all engine types and exports from Plans 01-01 through 01-04 integrated cleanly. Zero TypeScript errors on first build attempt. Build size grew from 205kB to 209kB (4kB for renderer + hook + component code).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Game is visually playable in browser: pieces fall, keyboard controls work, score updates live, game over screen and restart functional
- Phase 2 React shell can extend GameBoard with DAS/ARR auto-repeat, hold/next preview panels, neon CSS polish, and mobile touch controls
- window.game console API available at localhost:5173 for manual testing
- Canvas renders at 60fps with neon glow via pre-rendered OffscreenCanvas textures

## Self-Check: PASSED

- src/renderer/offscreen.ts: FOUND
- src/renderer/CanvasRenderer.ts: FOUND
- src/hooks/useGameEngine.ts: FOUND
- src/components/GameBoard.tsx: FOUND
- src/App.tsx: MODIFIED (updated)
- src/main.tsx: MODIFIED (cleaned up)
- .planning/phases/01-core-game-engine/01-05-SUMMARY.md: FOUND
- Commit 01a58af (offscreen + CanvasRenderer): FOUND
- Commit 5edd8f4 (useGameEngine + GameBoard + App): FOUND
- Build: PASSED (zero TypeScript errors, 209.54kB bundle, 41 modules)
- shadowBlur in CanvasRenderer.ts: NOT FOUND (correct — comment only, no ctx.shadowBlur code)

---
*Phase: 01-core-game-engine*
*Completed: 2026-03-02*
