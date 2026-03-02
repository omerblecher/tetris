---
phase: 01-core-game-engine
plan: 01
subsystem: engine-foundation
tags: [vite, react, typescript, tetromino, srs, types, constants]
dependency_graph:
  requires: []
  provides:
    - src/engine/types.ts (PieceType, RotationState, CellValue, PieceSnapshot, GameState, GameEvents, TSpinType)
    - src/engine/constants.ts (TETROMINOES 7x4, PIECE_COLORS, SPAWN_POSITIONS, CELL_TO_PIECE, PIECE_TO_CELL, COLS, ROWS, CELL_SIZE)
    - src/engine/SRS.ts (JLSTZ_KICKS, I_KICKS, getKicks)
  affects: []
tech_stack:
  added:
    - React 19 + Vite 6 + TypeScript 5 (react-ts scaffold)
    - "@vitejs/plugin-react": "^4.3.4"
  patterns:
    - Vite bundler mode (allowImportingTsExtensions, noEmit)
    - TypeScript strict mode (strict: true, noUnusedLocals, noUnusedParameters)
    - CSS custom properties (minimal reset, dark background)
key_files:
  created:
    - package.json
    - vite.config.ts
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - index.html
    - src/main.tsx
    - src/App.tsx
    - src/index.css
    - src/vite-env.d.ts
    - src/engine/types.ts
    - src/engine/constants.ts
    - src/engine/SRS.ts
  modified: []
decisions:
  - "Manually scaffolded Vite project instead of npm create vite interactive prompt (blocked by TTY requirement in Windows bash environment)"
  - "SPAWN_POSITIONS: all pieces use col 3, row -1 (uniform, matches tetris standard for centered spawn on 10-wide board)"
  - "I piece bounding box is 4x4 (standard SRS); O piece minos at cols 1-2 of a 4-wide box for correct centering"
  - "SRS dy convention documented inline: wiki uses +y=up, board uses +row=down, tryRotate must invert dy when applying offsets"
metrics:
  duration: "~6 minutes"
  completed: "2026-03-02"
  tasks_completed: 3
  files_created: 13
  files_modified: 0
---

# Phase 1 Plan 1: Project Scaffold + Engine Foundation Summary

**One-liner:** Vite 6 + React 19 + TypeScript 5 scaffold with SRS kick tables, 7-piece tetromino shape constants, and all engine type definitions for Phase 1.

## What Was Built

### Task 1: Vite + React + TypeScript scaffold
- Manually created all Vite react-ts scaffold files (package.json, tsconfig variants, vite.config.ts, index.html, src/main.tsx, src/App.tsx)
- Minimal CSS reset: dark `#0d0d1a` background, monospace font, no boilerplate
- Added `src/vite-env.d.ts` for CSS module type declarations
- `jsx: "react-jsx"` added to tsconfig.app.json (missing from initial template)
- Directory stubs: `src/engine/`, `src/renderer/`, `src/hooks/`, `src/components/`
- `npm run build` passes with zero TypeScript errors

### Task 2: Engine types and tetromino shape constants
- `src/engine/types.ts`: PieceType (7 variants), RotationState (0-3), CellValue (0-7), PieceSnapshot, GameState, TSpinType, GameEvents
- `src/engine/constants.ts`: TETROMINOES (7 pieces × 4 rotation states = 28 entries), PIECE_COLORS (neon fill+glow), SPAWN_POSITIONS, CELL_TO_PIECE, PIECE_TO_CELL, COLS=10, ROWS=20, CELL_SIZE=30
- Tetromino offsets verified against tetris.wiki SRS piece diagrams
- I piece uses 4×4 bounding box; O and JLSTZ use 3×3 bounding box

### Task 3: SRS wall kick tables and getKicks()
- `src/engine/SRS.ts`: JLSTZ_KICKS and I_KICKS tables (8 transitions each: 0→1, 1→0, 1→2, 2→1, 2→3, 3→2, 3→0, 0→3)
- `getKicks(pieceType, from, to)`: dispatches to I_KICKS for I, JLSTZ_KICKS for JLSTZ, [[0,0]] for O
- Verified: I(0→1) = [[0,0],[-2,0],[+1,0],[-2,-1],[+1,+2]], T(0→1) = [[0,0],[-1,0],[-1,+1],[0,-2],[-1,-2]] — they differ
- dy convention documented: wiki +y=up must be inverted (newRow = piece.row - dy) in the game engine's tryRotate

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npm create vite` interactive prompt cancels in non-TTY environment**
- **Found during:** Task 1
- **Issue:** `npm create vite@latest . -- --template react-ts` requires interactive TTY — cancelled with "Operation cancelled" in bash shell
- **Fix:** Manually created all scaffold files equivalent to what `create-vite` generates (package.json, tsconfig files, vite.config.ts, index.html, src files)
- **Files modified:** package.json, tsconfig.json, tsconfig.app.json, tsconfig.node.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/index.css
- **Commit:** 88441cb

**2. [Rule 3 - Blocking] Missing `jsx` compiler option caused TypeScript errors**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** tsconfig.app.json was missing `"jsx": "react-jsx"` — TS17004 errors on all JSX syntax
- **Fix:** Added `"jsx": "react-jsx"` to tsconfig.app.json compilerOptions; added `src/vite-env.d.ts` with `/// <reference types="vite/client" />` for CSS import resolution
- **Files modified:** tsconfig.app.json, src/vite-env.d.ts (new)
- **Commit:** 88441cb (same commit — fixed before first commit)

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | 88441cb | feat(01-core-game-engine-01): scaffold Vite + React + TypeScript project |
| 2 | 8e89eed | feat(01-core-game-engine-01): define engine types and tetromino shape constants |
| 3 | e2cde74 | feat(01-core-game-engine-01): implement SRS wall kick tables and getKicks() |

## Verification Results

- `npm run build`: PASS — zero TypeScript errors, vite build succeeds
- TETROMINOES: 7 piece types × 4 rotation states = 28 shape definitions
- PIECE_COLORS: 7 entries (neon cyan/blue/orange/yellow/green/red/purple)
- SPAWN_POSITIONS: 7 entries (all col 3, row -1)
- SRS: I(0→1) != T(0→1) — tables are distinct
- SRS: O piece returns exactly 1 kick [[0,0]]
- SRS: I piece returns exactly 5 kicks per transition
- Directory structure: src/engine/, src/renderer/, src/hooks/, src/components/ all exist

## Self-Check: PASSED

All files verified present. All commits verified in git history.
- Files: 12/12 FOUND
- Commits: 3/3 FOUND (88441cb, 8e89eed, e2cde74)
