---
phase: 01-core-game-engine
plan: 03
subsystem: scoring-engine
tags: [scorer, tdd, vitest, tetris-guideline, t-spin, b2b, combo, perfect-clear, gravity]
dependency_graph:
  requires:
    - src/engine/types.ts (TSpinType)
  provides:
    - src/engine/Scorer.ts (Scorer class: calculateLineClearScore, addHardDropScore, addSoftDropScore, getGravityMs, reset)
    - src/__tests__/Scorer.test.ts (47 Scorer tests covering all scoring scenarios)
  affects:
    - src/engine/Bag.ts (created as Rule 3 deviation — Bag.test.ts was present without implementation, blocking build)
tech_stack:
  added:
    - Vitest 4.x (already installed from prior uncommitted Plan 02 work; verified configured correctly)
  patterns:
    - TDD RED→GREEN cycle (test commit before implementation commit)
    - vitest/config defineConfig (replaces vite/config defineConfig for test type support)
    - Tetris Guideline Marathon gravity formula: (0.8 - (level-1)*0.007)^(level-1) × 1000ms
    - Level-scaled scoring tables (all bonuses multiply by current level)
key_files:
  created:
    - src/engine/Scorer.ts
    - src/__tests__/Scorer.test.ts
    - src/engine/Bag.ts (Rule 3 deviation — was missing, blocked build)
  modified:
    - vite.config.ts (Rule 3 deviation — changed import to vitest/config for correct test types)
decisions:
  - "Gravity formula at level 1 produces 1000ms per Guideline formula (0.8^0 = 1.0s), not 800ms — plan spec was inconsistent with its own formula; tests updated to match the formula"
  - "B2B tests written to set b2bActive directly and reset combo to -1 to isolate B2B from combo interaction — cleaner test isolation"
  - "PC_SCORES table uses Guideline level-scaled values (800/1200/1800/2000) rather than flat 3500 — more authentic, confirmed in plan implementation spec"
  - "T-spin mini double is 400 (not 800) — confirmed from tetris.wiki/Scoring table"
metrics:
  duration: "~7 minutes"
  completed: "2026-03-02"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 1 Plan 3: Scorer Module (TDD) Summary

**One-liner:** Scorer class implementing full Tetris Guideline scoring — line clears, T-spins, B2B (×1.5), combos (50×n×level), perfect clears, and the Guideline Marathon gravity formula — built via TDD RED→GREEN cycle.

## What Was Built

### TDD RED Phase — Failing Scorer Tests

Created `src/__tests__/Scorer.test.ts` with 47 test cases covering all scoring scenarios before any implementation existed. Tests confirmed to fail with "Cannot find module '../engine/Scorer'" error — correct RED state.

Test coverage:
- Line clear scoring at level 1 (100/300/500/800 for 1/2/3/4 lines)
- Level scaling (1 line at level 3 = 300, 4 lines at level 5 = 4000)
- T-spin scoring — full (0/800/1200/1600) and mini (100/200/400) variants at level 1
- B2B modifier (×1.5 floor) for consecutive Tetris/T-spin clears
- B2B chain state transitions (Tetris → single breaks chain → Tetris resets → Tetris gets bonus)
- Combo bonus (50 × combo_count × level, starting at combo=1)
- Perfect clear bonus: level-scaled (800/1200/1800/2000), B2B Tetris PC = 3200
- Drop scores (hard drop 2×cells, soft drop 1×cells)
- Level progression (floor(lines/10)+1, capped at 20)
- Gravity formula values at key levels
- Reset clears all state
- Score accumulation across multiple actions

### TDD GREEN Phase — Scorer Implementation

Created `src/engine/Scorer.ts` passing all 47 tests:

```typescript
export class Scorer {
  score = 0; level = 1; lines = 0; combo = -1; b2bActive = false;
  calculateLineClearScore(linesCleared, tSpin, isPerfectClear): number
  addHardDropScore(cellsDropped): void
  addSoftDropScore(cellsDropped): void
  static getGravityMs(level): number  // Guideline Marathon formula
  reset(): void
}
```

Key scoring tables:
- `LINE_SCORES`: `{ 0:0, 1:100, 2:300, 3:500, 4:800 }`
- `TSPIN_SCORES`: `{ 0:400, 1:800, 2:1200, 3:1600 }`
- `MINI_TSPIN_SCORES`: `{ 0:100, 1:200, 2:400 }`
- `PC_SCORES`: `{ 1:800, 2:1200, 3:1800, 4:2000 }` (level-scaled)
- B2B Tetris PC bonus: 3200 (level-scaled)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan spec gravity values (800ms/217ms/83ms) inconsistent with formula**
- **Found during:** GREEN phase, gravity test failures
- **Issue:** Plan spec listed "Level 1: ~800ms/row" but the documented Guideline formula `(0.8-(l-1)*0.007)^(l-1)*1000` evaluates to 1000ms at level 1 (exponent is 0, gives 1.0). Values 217ms and 83ms for levels 5 and 10 also didn't match formula output (355ms and 64ms respectively).
- **Fix:** Tests updated to match the formula's actual output (the authoritative source per tetris.wiki): level 1 = 1000ms, level 2 = ~793ms, level 5 = ~355ms, level 10 = ~64ms, level 20 < 5ms. The formula itself is correct per Guideline; the test spec values in the plan were erroneous.
- **Files modified:** `src/__tests__/Scorer.test.ts`
- **Commit:** a4e1f71

**2. [Rule 1 - Bug] B2B test cases produced unexpected totals due to combo accumulation**
- **Found during:** GREEN phase, B2B test failures (expected 1200, got 1250)
- **Issue:** Tests for "B2B Tetris → 1200" called `calculateLineClearScore` twice sequentially, which also triggered combo bonuses (+50). The delta returned was 1200 + 50 = 1250.
- **Fix:** Redesigned B2B tests to set `scorer.b2bActive = true` and `scorer.combo = -1` directly, isolating the B2B modifier from combo effects. Also added separate tests for b2bActive state transitions.
- **Files modified:** `src/__tests__/Scorer.test.ts`
- **Commit:** a4e1f71

**3. [Rule 1 - Bug] Combo scaling test used level 2 but level was recalculated to 1 after first clear**
- **Found during:** GREEN phase, combo test failure
- **Issue:** Test set `scorer.level = 2` but `calculateLineClearScore` recalculates level from lines cleared: `floor(lines/10)+1`. With `scorer.lines = 0`, clearing 1 line gives `floor(1/10)+1 = 1`, dropping level back to 1.
- **Fix:** Tests that need stable level set both `scorer.level` AND `scorer.lines` to consistent values (e.g., `scorer.lines = 20` for level 3). Added clearer tests for combo scaling.
- **Files modified:** `src/__tests__/Scorer.test.ts`
- **Commit:** a4e1f71

**4. [Rule 3 - Blocking] `vite.config.ts` used `defineConfig` from `vite` instead of `vitest/config`**
- **Found during:** Build verification (`npm run build`)
- **Issue:** `'test' does not exist in type 'UserConfigExport'` — Vite's `defineConfig` doesn't include the `test` field; that's provided by Vitest's config wrapper.
- **Fix:** Changed import to `import { defineConfig } from 'vitest/config'` — this re-exports everything from vite plus adds the test config types.
- **Files modified:** `vite.config.ts`
- **Commit:** a4e1f71

**5. [Rule 3 - Blocking] `src/engine/Bag.ts` missing — blocked TypeScript build**
- **Found during:** Build verification (`npm run build`)
- **Issue:** `Bag.test.ts` already existed (from uncommitted Plan 02 work) importing `../engine/Bag` which didn't exist. TS error: `Cannot find module '../engine/Bag'`.
- **Fix:** Created `src/engine/Bag.ts` using the Plan 02 implementation (7-bag Fisher-Yates randomizer with `next()`, `peek(n)`, `reset()` methods).
- **Files modified:** `src/engine/Bag.ts` (created)
- **Commit:** a4e1f71

## Commits

| Task | Hash | Message |
|------|------|---------|
| RED (failing tests) | 582a7d2 | test(01-03): add failing Scorer tests |
| GREEN (implementation) | a4e1f71 | feat(01-03): implement Scorer with full Guideline scoring |

## Verification Results

- `npm test`: PASS — 84 tests pass (47 Scorer + 25 Board + 12 Bag), 0 failures
- `npm run build`: PASS — zero TypeScript errors, Vite build succeeds
- Commit log: `test(01-03)` at 582a7d2 precedes `feat(01-03)` at a4e1f71 — RED→GREEN confirmed
- All scoring scenarios verified against Tetris Guideline tables
- Gravity formula verified at key levels (1000ms/793ms/355ms/64ms/0.46ms for levels 1/2/5/10/20)

## Self-Check: PASSED
