---
phase: 01-core-game-engine
plan: 02
subsystem: engine-data-structures
tags: [board, bag, tdd, vitest, collision, line-clearing, 7-bag, randomizer]
dependency_graph:
  requires:
    - src/engine/types.ts (CellValue, PieceType, TSpinType)
    - src/engine/constants.ts (COLS, ROWS)
  provides:
    - src/engine/Board.ts (Board class: isValid, lock, clearLines, isPerfectClear, getCell, snapshot, reset)
    - src/engine/Bag.ts (Bag class: next, peek, reset — 7-bag Fisher-Yates)
    - src/__tests__/Board.test.ts (25 Board unit tests)
    - src/__tests__/Bag.test.ts (12 Bag unit tests)
  affects:
    - src/engine/ (future GameEngine will consume Board and Bag)
tech_stack:
  added:
    - vitest@4.0.18 (test runner)
    - "@vitest/coverage-v8"@4.0.18 (coverage)
  patterns:
    - TDD (RED -> GREEN -> REFACTOR) cycle with per-phase commits
    - Vitest with node environment (no DOM needed for pure engine logic)
    - vite.config.ts imports defineConfig from vitest/config for test type inference
key_files:
  created:
    - src/engine/Board.ts
    - src/__tests__/Board.test.ts
    - src/__tests__/Bag.test.ts
  modified:
    - vite.config.ts (added test: { environment: node, include: ['src/__tests__/**/*.test.ts'] })
    - package.json (added "test": "vitest run" script, added vitest devDependencies)
decisions:
  - "Array.from({ length: ROWS }, () => [...]) used for board cells — Array(ROWS).fill([]) would share row references (classic JS pitfall)"
  - "isValid() treats negative rows (spawn buffer) as valid — pieces spawn above row 0 and must be allowed to enter the board"
  - "clearLines() uses filter-partition approach: separate full rows from remaining rows, prepend empty rows to top"
  - "Bag RED phase could not fail (Bag.ts was pre-committed from 01-03 run) — documented as deviation"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 1 Plan 2: Board + Bag (TDD) Summary

**One-liner:** Board collision detection (isValid/lock/clearLines/isPerfectClear) and 7-bag randomizer (Fisher-Yates) implemented TDD with 25+12 Vitest tests — all passing.

## What Was Built

### Task 1: Vitest installation and configuration
- Installed `vitest@4.0.18` and `@vitest/coverage-v8` as devDependencies
- Updated `vite.config.ts`: imports `defineConfig` from `vitest/config`, added `test: { environment: 'node', include: ['src/__tests__/**/*.test.ts'] }`
- Added `"test": "vitest run"` to package.json scripts
- Created `src/__tests__/` directory

### Task 2: Board (TDD — RED → GREEN)

**RED phase (commit b3eb4a0):** Wrote 25 Board tests covering:
- `isValid()`: valid center position, left/right wall collision, floor collision, spawn buffer (row -1), occupied cell collision, multi-mino pieces, exact boundary conditions
- `lock()` / `getCell()`: single and multi-mino locking, out-of-bounds returns 0
- `clearLines()`: zero clears on empty board, single row clear returns 1, Tetris (4 rows) returns 4, row ordering after clear (empty rows prepended), partial row not cleared
- `isPerfectClear()`: true on empty board, false with one locked cell, true after clearing all 20 rows
- `reset()`: all 200 cells return 0 after reset
- `snapshot()`: returns deep copy (mutation of snapshot does not affect board), correct ROWS×COLS dimensions

**GREEN phase (commit cfba0a9):** Implemented `src/engine/Board.ts`:
- `isValid(minos, col, row)`: walls (c < 0 || c >= COLS), floor (r >= ROWS), spawn buffer (r < 0 → true), occupied cell check
- `lock(minos, col, row, cellValue)`: bounds-checked placement into cells array
- `clearLines()`: filter-partition — full rows vs remaining, prepend empty rows to top, return cleared count
- `isPerfectClear()`: every cell in every row equals 0
- `getCell(col, row)`: bounds-checked read, returns 0 for out-of-bounds
- `snapshot()`: `this.cells.map(row => [...row])` — deep copy
- `reset()`: reinitializes cells with `Array.from({ length: ROWS }, () => Array(COLS).fill(0))`

### Task 3: Bag (TDD — partial RED, GREEN from pre-existing)

**Pre-existing state:** `Bag.ts` was already committed at HEAD (commit a4e1f71 from a prior 01-03 execution). `Bag.test.ts` was new.

**Test commit (c2bfa7b):** Wrote 12 Bag tests covering:
- `next()`: returns valid PieceType for single draw and 20 consecutive draws
- 7-bag distribution: all 7 types appear exactly once in first 7 draws, each of two consecutive bags has all 7 types, 700-draw drought test (every window of 7 is complete)
- `peek(n)`: length check, non-consuming behavior (next() still returns peeked values in order), full-bag peek has no duplicates, 14-element peek covers two bags
- `reset()`: valid draws after reset, 7-bag guarantee holds after reset

**Bag.ts** (pre-committed): Fisher-Yates shuffle refill, `queue.shift()` for FIFO draw, `queue.slice(0, n)` for non-consuming peek.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scorer.test.ts was pre-placed in working directory without Scorer.ts implementation**
- **Found during:** Task 1 (first test run after Vitest configuration)
- **Issue:** `src/__tests__/Scorer.test.ts` was an untracked file in the working directory. After configuring Vitest to pick up all tests in `src/__tests__/`, the Scorer tests failed due to missing `Scorer` module, preventing `npm test` from passing
- **Discovery:** Scorer.ts was already committed at HEAD (commit a4e1f71 from a prior partial 01-03 execution). The file was both on disk AND in git — `git status` initially showed it as untracked due to earlier state confusion
- **Resolution:** No fix needed — the pre-existing Scorer.ts satisfied all 47 Scorer tests. The situation resolved once the full git state was clear
- **Files modified:** None (Scorer.ts was already correct)

**2. [Rule 3 - Blocking] Bag.ts pre-committed — true RED phase impossible for Bag TDD**
- **Found during:** Task 3 (Bag TDD)
- **Issue:** `Bag.ts` was already committed at HEAD (commit a4e1f71 from prior 01-03 execution). Writing `Bag.test.ts` immediately produced passing tests — no RED phase possible
- **Fix:** Wrote comprehensive Bag tests (12 tests, 129 lines) and committed them. The TDD cycle intent was honored (tests document correct behavior), though the temporal RED→GREEN ordering could not be achieved for Bag
- **Files modified:** `src/__tests__/Bag.test.ts` (created)
- **Commit:** c2bfa7b

## Commits

| Task | Hash | Message |
|------|------|---------|
| Vitest setup + Board tests (RED) | b3eb4a0 | test(01-02): add failing Board tests |
| Board implementation (GREEN) | cfba0a9 | feat(01-02): implement Board with collision, lock, and line clearing |
| Bag tests | c2bfa7b | test(01-02): add Bag tests (7-bag distribution, peek, reset) |

*Note: Bag.ts (GREEN for Bag) is at commit a4e1f71 (prior 01-03 execution).*

## Verification Results

- `npm test`: PASS — 84 tests across 3 suites (Board: 25, Bag: 12, Scorer: 47)
- `npm run build`: PASS — zero TypeScript errors, Vite build succeeds (194.57 kB)
- Board.test.ts: 214 lines (min_lines: 60 requirement met ✓)
- Bag.test.ts: 129 lines (min_lines: 30 requirement met ✓)
- Board tests cover: left/right/floor collision, spawn buffer, occupied cell, lock, clearLines (0,1,4 rows), row ordering after clear, isPerfectClear, reset, snapshot
- Bag tests cover: valid types, 7-bag distribution (no duplicates in 700-draw window), peek without consuming, reset guarantee

## Self-Check: PASSED

All files verified present. All commits verified in git history.
- src/engine/Board.ts: FOUND
- src/engine/Bag.ts: FOUND
- src/__tests__/Board.test.ts: FOUND
- src/__tests__/Bag.test.ts: FOUND
- Commits: b3eb4a0 FOUND, cfba0a9 FOUND, c2bfa7b FOUND
