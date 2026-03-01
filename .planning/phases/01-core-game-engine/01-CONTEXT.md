# Phase 1: Core Game Engine - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure TypeScript game engine that produces correct, playable Tetris — driveable from the browser console before any React UI exists. All non-recoverable architectural decisions (Canvas rendering, useRef game state, rAF loop, SRS rotation) are locked in this phase. React wiring, visual polish, and mobile controls are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Hold piece & next queue
- Hold piece included — standard feature, one hold per piece (locked after use until next piece spawns)
- Next piece queue: 1 piece shown/tracked
- 7-bag randomizer (shuffles all 7 tetrominoes, deals in order, reshuffles) — no pure random

### Scoring system
- Base formula: 100/300/500/800 × level for 1/2/3/4 lines (from roadmap, locked)
- T-spin bonuses: single/double/triple at 2×/4×/6× base score
- Back-to-back multiplier: 1.5× for consecutive Tetrises or T-spins
- Combo counter: 50 × combo × level bonus for consecutive line-clearing drops
- Perfect clear bonus: large bonus (e.g., 3500 points) when board is fully empty after a clear

### Speed curve
- Tetris Guideline formula: seconds_per_row = (0.8 - (level-1) × 0.007)^(level-1)
- Maximum level: 20
- Soft drop: 20× gravity multiplier (Guideline standard)
- Lock delay: ~500ms — piece stays moveable/rotatable after touching the floor (standard competitive behavior)

### Console API
- Engine exposed as `window.game` global object
- Actions: `game.moveLeft()`, `game.moveRight()`, `game.rotate()`, `game.hardDrop()`, `game.softDrop()`, `game.hold()`, `game.tick()`
- State inspection: `game.state`, `game.board`, `game.score`, `game.level`, `game.lines`
- Debug helpers: `game.debug.printBoard()` (ASCII), `game.debug.setNextPiece(type)`
- Event system: EventEmitter / callback hooks (`onLineClear`, `onGameOver`, `onLevelUp`, `onPieceLock`) so Phase 2 React layer can subscribe to drive animations and UI updates

### Claude's Discretion
- Exact canvas render architecture (how the board loop is structured before React)
- T-spin detection algorithm specifics (3-corner rule or similar)
- Lock delay reset behavior (whether moving a piece resets the lock timer, and if there's a max-reset cap)
- Perfect clear bonus exact point value

</decisions>

<specifics>
## Specific Ideas

- Engine should feel like a proper Tetris Guideline implementation — T-spins, back-to-back, combos, perfect clears are all standard modern Tetris features
- Console testing must be ergonomic: `window.game` with both action methods and debug tools

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-core-game-engine*
*Context gathered: 2026-03-01*
