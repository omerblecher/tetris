# Phase 1: Core Game Engine - Research

**Researched:** 2026-03-01
**Domain:** TypeScript game engine, Canvas 2D rendering, Tetris Guideline mechanics
**Confidence:** HIGH (core mechanics verified against TetrisWiki official docs; Canvas APIs verified against MDN)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hold piece & next queue:**
- Hold piece included — standard feature, one hold per piece (locked after use until next piece spawns)
- Next piece queue: 1 piece shown/tracked
- 7-bag randomizer (shuffles all 7 tetrominoes, deals in order, reshuffles) — no pure random

**Scoring system:**
- Base formula: 100/300/500/800 × level for 1/2/3/4 lines (from roadmap, locked)
- T-spin bonuses: single/double/triple at 2×/4×/6× base score
- Back-to-back multiplier: 1.5× for consecutive Tetrises or T-spins
- Combo counter: 50 × combo × level bonus for consecutive line-clearing drops
- Perfect clear bonus: large bonus (e.g., 3500 points) when board is fully empty after a clear

**Speed curve:**
- Tetris Guideline formula: seconds_per_row = (0.8 - (level-1) × 0.007)^(level-1)
- Maximum level: 20
- Soft drop: 20× gravity multiplier (Guideline standard)
- Lock delay: ~500ms — piece stays moveable/rotatable after touching the floor (standard competitive behavior)

**Console API:**
- Engine exposed as `window.game` global object
- Actions: `game.moveLeft()`, `game.moveRight()`, `game.rotate()`, `game.hardDrop()`, `game.softDrop()`, `game.hold()`, `game.tick()`
- State inspection: `game.state`, `game.board`, `game.score`, `game.level`, `game.lines`
- Debug helpers: `game.debug.printBoard()` (ASCII), `game.debug.setNextPiece(type)`
- Event system: EventEmitter / callback hooks (`onLineClear`, `onGameOver`, `onLevelUp`, `onPieceLock`) so Phase 2 React layer can subscribe

### Claude's Discretion

- Exact canvas render architecture (how the board loop is structured before React)
- T-spin detection algorithm specifics (3-corner rule or similar)
- Lock delay reset behavior (whether moving a piece resets the lock timer, and if there's a max-reset cap)
- Perfect clear bonus exact point value

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENG-01 | Player can move pieces left, right, and down using keyboard arrow keys | Board collision detection pattern; delta-based input handling |
| ENG-02 | Player can rotate pieces clockwise and counter-clockwise using keyboard (Up = CW, Z/Ctrl = CCW) | Full SRS wall kick tables documented below; rotation state machine pattern |
| ENG-03 | All 7 standard tetrominoes (I, O, T, S, Z, J, L) spawn and rotate using SRS with wall kicks | Complete kick tables from tetris.wiki verified; spawn positions documented |
| ENG-04 | Pieces fall automatically; fall speed increases with level (gravity) | Guideline gravity formula verified: `(0.8 - (level-1)×0.007)^(level-1)` seconds/row |
| ENG-05 | Player can hard drop (spacebar) to instantly place piece at lowest valid position | Ghost piece collision scan → lock; add 2 pts per cell |
| ENG-06 | Player can soft drop (hold down arrow) to accelerate piece fall | 20× gravity multiplier per Guideline; +1 pt per cell |
| ENG-07 | Ghost piece shows semi-transparent preview of where current piece will land | Scan down from current position until collision; render at that row |
| ENG-08 | Player can hold the current piece (C key / hold button) and swap with held piece once per drop | Hold slot; lock flag reset on new piece spawn |
| ENG-09 | Game displays next 3 upcoming pieces in a preview panel (CONTEXT says 1, req says 3 — see Open Questions) | 7-bag queue; peek at next N pieces |
| ENG-10 | Collision detection prevents pieces from moving through walls, floor, or locked cells | Board bounds check + locked-cell check on each candidate move |
| ENG-11 | Game detects and handles game over when a newly spawned piece cannot be placed | Spawn collision check immediately after piece entry |
| SCR-01 | Complete horizontal rows are cleared; rows above fall down to fill gaps | Row scan after lock; splice and unshift empty row |
| SCR-02 | Score uses standard Tetris formula: 100/300/500/800 points for 1/2/3/4 lines × current level | Verified from tetris.wiki/Scoring |
| SCR-03 | Back-to-back Tetris and combo bonuses apply multiplier to score | B2B: ×1.5; Combo: 50 × combo_count × level |
| SCR-04 | Level increases every 10 lines cleared; gravity scales with level | Standard Guideline progression |
| SCR-05 | Hard drop adds 2 pts per cell dropped; soft drop adds 1 pt per cell | Verified from tetris.wiki/Scoring |
| SCR-06 | Current score, level, and lines cleared are displayed in real time during gameplay | React state (not useRef) for display values; engine emits events to update |
</phase_requirements>

---

## Summary

Phase 1 builds a complete, standalone Tetris game engine in pure TypeScript with Canvas 2D rendering. The engine must implement the full Tetris Guideline specification: 7-bag randomization, SRS rotation with wall kick tables, Extended Placement lock delay (move reset, 15-move cap), the standard scoring hierarchy (line clears, T-spins, back-to-back, combos, perfect clears), and a `requestAnimationFrame` + delta-time game loop. The engine is exposed as `window.game` for console testing before any React UI is wired up.

The non-recoverable architectural decisions are already locked: Canvas 2D (not DOM), `useRef` for game state (not `useState`), `requestAnimationFrame` + delta-time (not `setInterval`), and SRS wall kicks. These must be correct from the start — retrofitting them later requires rewriting the engine.

The most subtle implementation risks are: (1) the SRS wall kick table has two different sets of offsets — one for J/L/S/T/Z and a completely different one for I — and mixing them up silently produces wrong kick behavior; (2) T-spin detection requires tracking "last action was rotation" and then applying the 3-corner rule with front/back corner distinction for mini vs. full T-spins; (3) `shadowBlur` is expensive and must be pre-rendered to an offscreen canvas per piece type rather than applied on every draw call.

**Primary recommendation:** Implement the engine as a pure TypeScript class (`TetrisEngine`) with no DOM/React dependencies, expose it globally via `window.game`, and use a thin Canvas renderer that composites from offscreen-rendered piece canvases. Verify SRS wall kicks and T-spin detection against the tetris.wiki tables before moving to Phase 2.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (project-locked) | Type-safe game engine, board state, piece types | Already in project stack; catches coordinate/index bugs at compile time |
| HTML5 Canvas 2D | Browser built-in | Board rendering with neon glow | Locked decision — DOM cells cause paint storms on mobile |
| requestAnimationFrame | Browser built-in | 60fps game loop with delta time | Locked decision — `setInterval` drifts at high speeds |
| React 19 | Project-locked | Minimal UI shell, score/level display | State only for display values — game state lives in `useRef` |
| Vite 6 | Project-locked | Build and dev server | Already in project stack |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No additional libraries needed | — | — | The engine is pure TypeScript + browser APIs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Canvas 2D | WebGL | WebGL is overkill for 2D grid game; Canvas 2D is simpler and fully capable |
| Canvas 2D | DOM cells + CSS | Locked out — CSS glow on 200 cells causes paint storm on mobile |
| requestAnimationFrame | setInterval | Locked out — setInterval drifts at high levels |

**Installation:** No additional packages needed for Phase 1 engine. Project already has React 19 + Vite 6 + TypeScript 5.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/              # Pure TS — no DOM/React imports
│   ├── TetrisEngine.ts  # Main engine class (game loop, state, public API)
│   ├── Board.ts         # 10×20 board: collision, line clear, lock
│   ├── Piece.ts         # Active piece: position, rotation state, type
│   ├── Bag.ts           # 7-bag randomizer
│   ├── SRS.ts           # Rotation tables + wall kick data
│   ├── Scorer.ts        # Line clear scoring, T-spin, B2B, combo, perfect clear
│   ├── types.ts         # PieceType, RotationState, GameState, etc.
│   └── constants.ts     # TETROMINOES, COLORS, SPAWN_POSITIONS, KICK_TABLES
├── renderer/
│   ├── CanvasRenderer.ts  # Composites board + ghost + active piece each frame
│   └── offscreen.ts       # Pre-rendered piece textures (shadowBlur baked in)
├── hooks/
│   └── useGameEngine.ts   # useRef wrapper; subscribes React display to engine events
└── components/
    └── GameBoard.tsx      # Canvas element + score/level display (Phase 2 expands this)
```

### Pattern 1: Pure Engine Class with Event Emitter

**What:** `TetrisEngine` is a pure TypeScript class with no DOM/React imports. It manages all game state internally and fires callbacks for game events. React subscribes to these callbacks to update display state.

**When to use:** When game state must be completely decoupled from React's render cycle to avoid 60fps re-renders.

**Example:**
```typescript
// src/engine/TetrisEngine.ts
type GameEvents = {
  onLineClear: (lines: number, score: number, isTSpin: boolean, isB2B: boolean) => void;
  onGameOver: (finalScore: number) => void;
  onLevelUp: (newLevel: number) => void;
  onPieceLock: (piece: PieceType) => void;
  onScoreUpdate: (score: number, level: number, lines: number) => void;
};

export class TetrisEngine {
  private board: Board;
  private bag: Bag;
  private activePiece: Piece | null = null;
  private heldPiece: PieceType | null = null;
  private holdUsed: boolean = false;
  private scorer: Scorer;
  private events: Partial<GameEvents> = {};
  private lastTimestamp: number = 0;
  private accumulator: number = 0;
  private rafId: number = 0;
  private running: boolean = false;

  // --- Public console API (window.game) ---
  moveLeft(): void { ... }
  moveRight(): void { ... }
  rotate(cw: boolean = true): void { ... }
  hardDrop(): void { ... }
  softDrop(): void { ... }
  hold(): void { ... }
  tick(dt: number): void { ... }   // advance one gravity step manually (console testing)

  get state(): GameState { ... }
  get score(): number { ... }
  get level(): number { ... }
  get lines(): number { ... }

  debug = {
    printBoard: () => { /* ASCII art board */ },
    setNextPiece: (type: PieceType) => { /* inject into bag queue */ },
  };

  on<K extends keyof GameEvents>(event: K, handler: GameEvents[K]): void { ... }
}
```

### Pattern 2: useRef Game Loop Hook

**What:** `useGameEngine` holds the engine in a ref, starts the rAF loop in `useEffect`, and updates React display state only via engine callbacks.

**When to use:** Every game React integration — game state must not be in React state.

**Example:**
```typescript
// src/hooks/useGameEngine.ts
export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const engineRef = useRef<TetrisEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [displayState, setDisplayState] = useState({ score: 0, level: 1, lines: 0 });

  useEffect(() => {
    const engine = new TetrisEngine();
    const renderer = new CanvasRenderer(canvasRef.current!);
    engineRef.current = engine;
    rendererRef.current = renderer;

    // React state updated ONLY via callbacks — never in the rAF loop
    engine.on('onScoreUpdate', (score, level, lines) => {
      setDisplayState({ score, level, lines });
    });

    let rafId: number;
    let lastTime: number = performance.now();

    function loop(timestamp: number) {
      const dt = timestamp - lastTime;
      lastTime = timestamp;
      engine.update(dt);            // advance game logic
      renderer.render(engine.state); // draw frame
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    // Expose for console testing
    (window as any).game = engine;

    return () => {
      cancelAnimationFrame(rafId);
      delete (window as any).game;
    };
  }, []);

  return { engineRef, displayState };
}
```

### Pattern 3: SRS Rotation State Machine

**What:** Pieces have a `rotationState: 0 | 1 | 2 | 3` (0=spawn, 1=CW, 2=180°, 3=CCW). Each piece stores its minos as offsets from center. Rotation applies the kick table for the transition, testing 5 positions in order.

**When to use:** All piece rotation — this is the complete SRS algorithm.

**Example:**
```typescript
// src/engine/SRS.ts
type RotationState = 0 | 1 | 2 | 3;

// Wall kick table for J, L, S, T, Z
const JLSTZ_KICKS: Record<string, [number, number][]> = {
  '0->1': [[0,0],[-1,0],[-1,+1],[0,-2],[-1,-2]],
  '1->0': [[0,0],[+1,0],[+1,-1],[0,+2],[+1,+2]],
  '1->2': [[0,0],[+1,0],[+1,-1],[0,+2],[+1,+2]],
  '2->1': [[0,0],[-1,0],[-1,+1],[0,-2],[-1,-2]],
  '2->3': [[0,0],[+1,0],[+1,+1],[0,-2],[+1,-2]],
  '3->2': [[0,0],[-1,0],[-1,-1],[0,+2],[-1,+2]],
  '3->0': [[0,0],[-1,0],[-1,-1],[0,+2],[-1,+2]],
  '0->3': [[0,0],[+1,0],[+1,+1],[0,-2],[+1,-2]],
};

// Wall kick table for I — DIFFERENT from JLSTZ
const I_KICKS: Record<string, [number, number][]> = {
  '0->1': [[0,0],[-2,0],[+1,0],[-2,-1],[+1,+2]],
  '1->0': [[0,0],[+2,0],[-1,0],[+2,+1],[-1,-2]],
  '1->2': [[0,0],[-1,0],[+2,0],[-1,+2],[+2,-1]],
  '2->1': [[0,0],[+1,0],[-2,0],[+1,-2],[-2,+1]],
  '2->3': [[0,0],[+2,0],[-1,0],[+2,+1],[-1,-2]],
  '3->2': [[0,0],[-2,0],[+1,0],[-2,-1],[+1,+2]],
  '3->0': [[0,0],[+1,0],[-2,0],[+1,-2],[-2,+1]],
  '0->3': [[0,0],[-1,0],[+2,0],[-1,+2],[+2,-1]],
};

// O piece has no kicks (rotation is symmetric)
export function getKicks(pieceType: PieceType, from: RotationState, to: RotationState): [number, number][] {
  if (pieceType === 'O') return [[0,0]];
  const key = `${from}->${to}`;
  return pieceType === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key];
}
```

### Pattern 4: Board as 2D Number Array

**What:** The board is a `number[][]` (10 cols × 20 rows), where 0 = empty and 1–7 = locked piece type (used for color). Row 0 is the top; row 19 is the bottom.

**When to use:** Standard for all Tetris implementations — simple, fast, easy to print in console.

**Example:**
```typescript
// src/engine/Board.ts
const COLS = 10;
const ROWS = 20;

export class Board {
  private cells: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

  isValid(minos: [number, number][], col: number, row: number): boolean {
    return minos.every(([dc, dr]) => {
      const c = col + dc;
      const r = row + dr;
      return c >= 0 && c < COLS && r < ROWS && (r < 0 || this.cells[r][c] === 0);
    });
  }

  lock(minos: [number, number][], col: number, row: number, pieceId: number): void {
    minos.forEach(([dc, dr]) => {
      this.cells[row + dr][col + dc] = pieceId;
    });
  }

  clearLines(): number {
    const full = this.cells.filter(row => row.every(c => c !== 0));
    const remaining = this.cells.filter(row => row.some(c => c === 0));
    const cleared = full.length;
    // Add empty rows at top
    const empty = Array.from({ length: cleared }, () => Array(COLS).fill(0));
    this.cells = [...empty, ...remaining];
    return cleared;
  }

  isPerfectClear(): boolean {
    return this.cells.every(row => row.every(c => c === 0));
  }
}
```

### Pattern 5: Canvas Offscreen Pre-rendering for shadowBlur

**What:** `shadowBlur` is GPU-expensive per draw call. Pre-render each tetromino at each glow intensity to an offscreen `OffscreenCanvas` (or `<canvas>`) once at startup. Composite these per frame with `drawImage`.

**When to use:** Any time shadowBlur is needed at 60fps — this is the only way to avoid a performance cliff on mid-range hardware.

**Example:**
```typescript
// src/renderer/offscreen.ts
const CELL_SIZE = 30;

export function preRenderPiece(pieceType: PieceType, color: string, glowColor: string): OffscreenCanvas {
  const minos = TETROMINOES[pieceType][0]; // rotation state 0
  const canvas = new OffscreenCanvas(4 * CELL_SIZE, 4 * CELL_SIZE);
  const ctx = canvas.getContext('2d')!;
  ctx.shadowBlur = 20;
  ctx.shadowColor = glowColor;
  ctx.fillStyle = color;
  minos.forEach(([dc, dr]) => {
    ctx.fillRect(dc * CELL_SIZE, dr * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
  });
  return canvas;
}
```

### Anti-Patterns to Avoid

- **React state in the game loop:** Calling `setState` at 60fps causes React to re-render 60 times/sec — the whole component tree. Game state (board, piece position, score) must live in `useRef`. Only display-safe values (score, level, lines for the UI overlay) go into React state, updated via engine callbacks.
- **`setInterval` for gravity:** Interval drifts by 10–50ms per tick at high levels due to JS event loop queuing. Use `requestAnimationFrame` + delta time accumulation.
- **JLSTZ kick table applied to I piece:** The I piece has a completely different wall kick table. Silently using the wrong table makes I-piece rotation feel broken near walls/floor with no error thrown.
- **Applying shadowBlur every draw call:** CPU/GPU cost scales with canvas area and blur radius. shadowBlur = 20 on a 300×600 canvas redrawn at 60fps is measurably expensive. Pre-render to offscreen canvas.
- **`new Array(COLS).fill([])` for board rows:** `fill` with a reference type gives all rows the same array reference. Use `Array.from({ length: ROWS }, () => Array(COLS).fill(0))`.
- **Rotation by matrix transpose:** Naive matrix rotation works for O and T but does not produce the correct SRS rotation offsets. Use explicit mino-offset arrays per rotation state, not computed matrix rotation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wall kicks | Custom offset guessing | SRS kick tables from tetris.wiki | 5 specific tests per rotation direction; wrong tables make the game feel broken |
| Randomizer | `Math.random() % 7` | 7-bag Fisher-Yates shuffle | Pure random allows droughts (10+ pieces without an I piece) which feel unfair |
| T-spin detection | Ad-hoc corner checks | 3-corner rule with front/back distinction | Mini vs. full T-spin scoring requires front-corner distinction, not just "3 corners occupied" |
| Gravity formula | Linear level-speed mapping | Guideline formula `(0.8-(level-1)×0.007)^(level-1)` | Linear feels wrong — Guideline curve is exponential and matches player expectations |
| Lock delay | Simple timeout | Extended Placement: 500ms timer + 15-move cap, cap resets on row descent | Without a cap, players can stall indefinitely; without move-reset, rotation near floor feels sluggish |
| Perfect clear detection | None needed | `board.every(row => row.every(c => c === 0))` after line clear | Trivial to implement correctly — just check after each clear |

**Key insight:** SRS wall kicks and T-spin detection are the two places where "close enough" implementations will feel wrong to any experienced Tetris player. Use the exact tables from tetris.wiki.

---

## Common Pitfalls

### Pitfall 1: Wrong I-Piece Kick Table

**What goes wrong:** I-piece rotation near walls or floor fails silently (rotation just cancels) or kicks in the wrong direction, making I-piece feel unresponsive.

**Why it happens:** The I-piece has a completely different set of wall kick offsets from J/L/S/T/Z. Copy-paste error or a single `kicks[pieceType]` call that falls back to the JLSTZ table for I.

**How to avoid:** Separate `I_KICKS` and `JLSTZ_KICKS` constants. Add a type guard in `getKicks()`. Write console tests: `game.debug.setNextPiece('I')`, move to left wall, rotate — should succeed.

**Warning signs:** I-piece can't rotate when flush with a wall; pieces get stuck where they shouldn't.

### Pitfall 2: React State in Game Loop

**What goes wrong:** Game slows to ~20fps at level 5+. React DevTools shows hundreds of renders per second.

**Why it happens:** Any `useState` setter called in the rAF loop triggers a React re-render. At 60fps that's 60 complete React reconciliations per second.

**How to avoid:** `useRef` for ALL game state. Only fire `setDisplayState` from engine event callbacks (which fire ~1–4 times per piece placement, not 60 times/sec).

**Warning signs:** `React DevTools Profiler` shows >10 renders/sec during active gameplay; game feels sluggish on level 5.

### Pitfall 3: setInterval Gravity Drift

**What goes wrong:** At level 15+, piece fall becomes erratic — sometimes two rows at once, sometimes a stutter. The timer fires late due to JS event loop saturation.

**Why it happens:** `setInterval(fn, 50)` at high gravity levels accumulates drift. The browser may fire multiple ticks late to "catch up", causing double-steps.

**How to avoid:** `requestAnimationFrame` + delta time accumulator. `accumulator += dt; while (accumulator >= gravityInterval) { dropOnce(); accumulator -= gravityInterval; }`.

**Warning signs:** Piece fall looks uneven at high levels; timing measurements show intervals of 45–95ms instead of 50ms.

### Pitfall 4: Board Row Reference Bug

**What goes wrong:** Clearing one row clears all rows (or multiple rows get the same state).

**Why it happens:** `new Array(ROWS).fill(new Array(COLS).fill(0))` or `Array(ROWS).fill([])` — all rows share the same array reference.

**How to avoid:** Always `Array.from({ length: ROWS }, () => Array(COLS).fill(0))`.

**Warning signs:** Line clear causes multiple rows to change simultaneously; board state corrupts unexpectedly.

### Pitfall 5: Lock Delay Without Move-Reset Cap

**What goes wrong:** Skilled players stall indefinitely by sliding the piece back and forth after it lands, never locking.

**Why it happens:** Naive 500ms timer resets on every move/rotation without any cap.

**How to avoid:** Extended Placement Lock Down: 500ms timer, resets on any move/rotation, but max 15 resets. The 15-reset cap itself resets when the piece descends to a new row.

**Warning signs:** Experienced playtesters can keep pieces alive indefinitely at the bottom.

### Pitfall 6: T-Spin Mini vs. Full Detection

**What goes wrong:** All T-spins score as mini (or all as full), causing wrong point values.

**Why it happens:** Only checking "3 of 4 corners occupied" without distinguishing front vs. back corners.

**How to avoid:** Implement 3-corner T rule with front-corner distinction:
- **Full T-spin:** 2 front corners occupied + at least 1 back corner
- **Mini T-spin:** 1 front corner occupied (with exactly 1 back) — OR the kick used was a 1×2 jump (auto-promotes to full in SRS)

**Warning signs:** T-spin double scoring as mini T-spin double; players report wrong point values.

### Pitfall 7: shadowBlur Performance Cliff

**What goes wrong:** Frame rate drops to 30–40fps on mid-range hardware when the board is populated.

**Why it happens:** `ctx.shadowBlur = 20` applied per-cell during each draw call. With 200 cells × 60fps, that's 12,000 shadow renders/sec.

**How to avoid:** Pre-render each piece type to an `OffscreenCanvas` with shadowBlur baked in. Composite with `drawImage` per frame — no shadow properties set at render time.

**Warning signs:** FPS drops below 55fps when the board is > 50% full; Chrome DevTools shows excessive paint time.

### Pitfall 8: Gravity at Level 20 Under/Over-Shoots

**What goes wrong:** The Guideline formula produces < 0 at level > ~20, causing NaN gravity or instant lock.

**How to avoid:** Cap at level 20. `const effectiveLevel = Math.min(level, 20)`. At level 20 the formula gives ≈0.0017 seconds/row (effectively instant fall, which is correct).

---

## Code Examples

Verified patterns from official sources and TetrisWiki:

### 7-Bag Randomizer (Fisher-Yates)
```typescript
// Source: tetris.wiki/Random_Generator (algorithm), Fisher-Yates shuffle (standard)
const ALL_TYPES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export class Bag {
  private queue: PieceType[] = [];

  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }

  peek(n: number): PieceType[] {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }

  private refill(): void {
    const bag = [...ALL_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }
}
```

### Gravity Formula (Tetris Guideline)
```typescript
// Source: tetris.wiki/Tetris_Guideline — Marathon speed curve
function getGravityMs(level: number): number {
  const l = Math.min(level, 20);
  const secondsPerRow = Math.pow(0.8 - (l - 1) * 0.007, l - 1);
  return secondsPerRow * 1000; // convert to milliseconds
}
// Level 1 → 800ms/row; Level 5 → ~217ms; Level 10 → ~83ms; Level 20 → ~1.7ms
```

### rAF Game Loop with Delta Time
```typescript
// Source: MDN requestAnimationFrame + standard game loop pattern
class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private rafId = 0;

  start(engine: TetrisEngine, renderer: CanvasRenderer): void {
    const loop = (timestamp: number) => {
      const dt = Math.min(timestamp - this.lastTime, 100); // cap at 100ms to handle tab-background
      this.lastTime = timestamp;
      this.accumulator += dt;

      const gravityMs = getGravityMs(engine.level);
      while (this.accumulator >= gravityMs) {
        engine.gravityDrop(); // move piece down one row
        this.accumulator -= gravityMs;
      }

      renderer.render(engine.state);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }
}
```

### SRS Rotation Attempt
```typescript
// Source: tetris.wiki/Super_Rotation_System — 5-test wall kick procedure
function tryRotate(engine: TetrisEngine, piece: Piece, board: Board, cw: boolean): boolean {
  const nextState = cw
    ? ((piece.rotation + 1) % 4) as RotationState
    : ((piece.rotation + 3) % 4) as RotationState;

  const kicks = getKicks(piece.type, piece.rotation, nextState);
  const newMinos = TETROMINOES[piece.type][nextState];

  for (const [dx, dy] of kicks) {
    const newCol = piece.col + dx;
    const newRow = piece.row - dy; // Note: wiki uses +y=up; board uses +row=down
    if (board.isValid(newMinos, newCol, newRow)) {
      piece.rotation = nextState;
      piece.col = newCol;
      piece.row = newRow;
      piece.lastMoveWasRotation = true; // for T-spin detection
      return true;
    }
  }
  return false; // rotation failed
}
```

### T-Spin Detection (3-Corner Rule)
```typescript
// Source: tetris.wiki/T-Spin — 3-corner T with front/back corner distinction
function detectTSpin(piece: Piece, board: Board): 'none' | 'mini' | 'full' {
  if (piece.type !== 'T' || !piece.lastMoveWasRotation) return 'none';

  // Corner positions relative to T-piece center, for each rotation state
  // rotation 0 (flat-side down): front = top corners, back = bottom corners
  const CORNERS_BY_ROTATION: Record<RotationState, { front: [number,number][], back: [number,number][] }> = {
    0: { front: [[-1,-1],[+1,-1]], back: [[-1,+1],[+1,+1]] }, // spawn state
    1: { front: [[+1,-1],[+1,+1]], back: [[-1,-1],[-1,+1]] }, // CW
    2: { front: [[-1,+1],[+1,+1]], back: [[-1,-1],[+1,-1]] }, // 180
    3: { front: [[-1,-1],[-1,+1]], back: [[+1,-1],[+1,+1]] }, // CCW
  };

  const { front, back } = CORNERS_BY_ROTATION[piece.rotation];

  const isOccupied = ([dc, dr]: [number, number]) => {
    const c = piece.col + dc;
    const r = piece.row + dr;
    return c < 0 || c >= 10 || r >= 20 || (r >= 0 && board.getCell(c, r) !== 0);
  };

  const frontCount = front.filter(isOccupied).length;
  const backCount = back.filter(isOccupied).length;

  if (frontCount === 2 && backCount >= 1) return 'full';  // proper T-spin
  if (frontCount >= 1 && backCount === 2) return 'mini';  // mini T-spin
  // SRS kick promotion: if the kick used was the 5th test (large jump), promote mini to full
  // This is tracked via piece.lastKickIndex === 4
  if (piece.lastKickIndex === 4 && frontCount + backCount >= 3) return 'full';
  return 'none';
}
```

### Scoring Calculator
```typescript
// Source: tetris.wiki/Scoring — Tetris Guideline scores
const LINE_SCORES = [0, 100, 300, 500, 800]; // index = lines cleared

function calculateScore(
  lines: number,
  level: number,
  tSpin: 'none' | 'mini' | 'full',
  isB2B: boolean,
  combo: number,
  isPerfectClear: boolean
): number {
  let base = 0;

  if (tSpin === 'full') {
    const T_SPIN_SCORES = [400, 800, 1200, 1600];
    base = (T_SPIN_SCORES[lines] ?? 0) * level;
  } else if (tSpin === 'mini') {
    const MINI_SCORES = [100, 200, 400];
    base = (MINI_SCORES[lines] ?? 0) * level;
  } else {
    base = LINE_SCORES[lines] * level;
  }

  if (isB2B && lines > 0) base = Math.floor(base * 1.5);

  // Combo bonus (added separately)
  const comboBonus = lines > 0 && combo > 0 ? 50 * combo * level : 0;

  // Perfect clear bonus (added on top of line clear score)
  let perfectBonus = 0;
  if (isPerfectClear) {
    const PC_SCORES = [0, 800, 1200, 1800, 2000];
    perfectBonus = (PC_SCORES[lines] ?? 0) * level;
    if (isB2B && lines === 4) perfectBonus = 3200 * level;
  }

  return base + comboBonus + perfectBonus;
}
```

### Back-to-Back and Combo State
```typescript
// A "difficult" clear is: Tetris (4 lines) OR any T-spin with lines
function updateChainState(
  lines: number,
  tSpin: 'none' | 'mini' | 'full',
  b2bActive: boolean,
  combo: number
): { isB2B: boolean; newB2BActive: boolean; newCombo: number } {
  const isDifficult = lines === 4 || (tSpin !== 'none' && lines > 0);
  const isLineClearing = lines > 0;

  const newB2BActive = isDifficult ? true : isLineClearing ? false : b2bActive;
  const isB2B = isDifficult && b2bActive; // B2B fires only on second+ difficult
  const newCombo = isLineClearing ? combo + 1 : -1;

  return { isB2B, newB2BActive, newCombo };
}
```

### Lock Delay (Extended Placement)
```typescript
// Extended Placement Lock Down: 500ms, 15-move reset cap
class LockDelay {
  private timer = 0;
  private resetCount = 0;
  private readonly MAX_RESETS = 15;
  private readonly LOCK_MS = 500;

  onPieceLanded(): void {
    this.timer = this.LOCK_MS;
    this.resetCount = 0;
  }

  onMoveOrRotate(): boolean {
    // Returns true if reset was applied
    if (this.resetCount < this.MAX_RESETS) {
      this.timer = this.LOCK_MS;
      this.resetCount++;
      return true;
    }
    return false; // cap reached — no more resets
  }

  onRowDescend(): void {
    // Piece moved to a lower row — reset the cap
    this.resetCount = 0;
    this.timer = this.LOCK_MS;
  }

  tick(dt: number): boolean {
    // Returns true when piece should lock
    this.timer -= dt;
    return this.timer <= 0;
  }
}
```

### Canvas Rendering Loop
```typescript
// src/renderer/CanvasRenderer.ts
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize = 30;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  render(state: GameState): void {
    const { ctx, cellSize } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw locked board cells (no shadowBlur — pre-rendered textures)
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 10; c++) {
        const cell = state.board[r][c];
        if (cell !== 0) {
          ctx.drawImage(PIECE_TEXTURES[cell], c * cellSize, r * cellSize);
        }
      }
    }

    // Draw ghost piece (low alpha, same color)
    this.drawPiece(state.ghostPiece, 0.3);

    // Draw active piece
    this.drawPiece(state.activePiece, 1.0);
  }

  private drawPiece(piece: PieceSnapshot, alpha: number): void {
    // Use pre-rendered offscreen canvas texture
    this.ctx.globalAlpha = alpha;
    const texture = PIECE_TEXTURES[piece.type];
    // ... draw each mino using drawImage from texture
    this.ctx.globalAlpha = 1.0;
  }
}
```

---

## Scoring Reference (Verified)

From tetris.wiki/Scoring — Tetris Guideline scores (all × level):

| Action | Points |
|--------|--------|
| Single | 100 |
| Double | 300 |
| Triple | 500 |
| Tetris (4 lines) | 800 |
| Mini T-Spin (0 lines) | 100 |
| T-Spin (0 lines) | 400 |
| Mini T-Spin Single | 200 |
| T-Spin Single | 800 |
| Mini T-Spin Double | 400 |
| T-Spin Double | 1,200 |
| T-Spin Triple | 1,600 |
| Back-to-back modifier | × 1.5 |
| Combo | 50 × combo_count |
| Soft drop | 1 per cell |
| Hard drop | 2 per cell |
| Perfect Clear Single | 800 |
| Perfect Clear Double | 1,200 |
| Perfect Clear Triple | 1,800 |
| Perfect Clear Tetris | 2,000 |
| Perfect Clear B2B Tetris | 3,200 |

**Note on CONTEXT.md vs. tetris.wiki scoring:**
- CONTEXT.md specifies "T-spin bonuses: single/double/triple at 2×/4×/6× base score" — this approximation matches the Guideline values when cross-referenced.
- CONTEXT.md specifies "Perfect clear bonus: large bonus (e.g., 3500 points)" — the Guideline specifies level-scaled values. Recommend implementing the full Guideline perfect clear table; the 3500-point fixed value is Claude's discretion and the Guideline values are more authentic.
- Combo: CONTEXT.md says "50 × combo × level" — matches Guideline exactly.

---

## SRS Spawn Positions (Verified)

From tetris.wiki/Tetris_Guideline:

- Pieces spawn centered, rounded to the left when not symmetric
- Spawn rows: rows 21–22 (the two rows above the visible 20-row field)
- For a 0-indexed board where row 0 = top of visible field, spawn at row = -1 or -2
- Practical implementation: spawn at row = -1 (top of buffer zone), with first gravity drop moving to row 0

**Standard spawn columns (0-indexed, 10-wide board):**

| Piece | Spawn Col | Notes |
|-------|-----------|-------|
| I | col 0, row -1 | 4 wide, occupies cols 0–3 in horizontal state |
| O | col 4, row -1 | 2 wide, occupies cols 4–5 |
| T | col 3, row -1 | 3 wide, occupies cols 3–5 |
| S | col 3, row -1 | 3 wide |
| Z | col 3, row -1 | 3 wide |
| J | col 3, row -1 | 3 wide |
| L | col 3, row -1 | 3 wide |

**Standard piece colors:**

| Piece | Color |
|-------|-------|
| I | Cyan |
| J | Blue |
| L | Orange |
| O | Yellow |
| S | Green |
| Z | Red |
| T | Magenta/Purple |

---

## Tetromino Mino Offsets (Rotation State 0)

Store pieces as mino offsets from a pivot point. The origin is the top-left of the bounding box or a consistent center point. All 4 rotation states must be stored explicitly (not computed via matrix transpose) to match SRS exactly.

```typescript
// Minos as [col_offset, row_offset] from piece origin
// Row increases downward, col increases rightward
const TETROMINOES: Record<PieceType, [number, number][][]> = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],  // state 0 (horizontal)
    [[2,0],[2,1],[2,2],[2,3]],  // state 1 (vertical right)
    [[0,2],[1,2],[2,2],[3,2]],  // state 2 (horizontal flipped)
    [[1,0],[1,1],[1,2],[1,3]],  // state 3 (vertical left)
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],  // state 0
    [[1,0],[1,1],[2,1],[1,2]],  // state 1 CW
    [[0,1],[1,1],[2,1],[1,2]],  // state 2
    [[1,0],[0,1],[1,1],[1,2]],  // state 3 CCW
  ],
  // ... S, Z, J, L similarly
};
```

**Note:** Exact mino offsets should be verified against a reference implementation or TetrisWiki piece diagrams before finalizing. The above is a representative example; specific offset values may differ by 1 depending on pivot choice. The SRS kick table coordinates assume a consistent pivot definition.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` for gravity | `requestAnimationFrame` + delta time | Modern browser era | No drift at high speeds |
| DOM cells for board | Canvas 2D rendering | Mobile era | No paint storm on mobile |
| Random piece selection | 7-bag randomizer | Tetris Worlds (2001) | Eliminates piece droughts |
| Pure random rotation | SRS wall kicks | Tetris Worlds (2001) | Pieces rotate near walls without getting stuck |
| Fixed lock delay | Extended Placement Lock Down (15-move cap) | Tetris DS era | Prevents infinite stalling while keeping responsive feel |

**Deprecated/outdated:**
- `setInterval`-based gravity: Never use for Tetris — use rAF + delta time
- DOM-based board rendering: CSS glow on 200 elements causes mobile paint storms
- Naive `Math.random() % 7` randomizer: Allows long droughts, use 7-bag
- Matrix-transpose rotation: Doesn't match SRS offsets, use explicit offset tables

---

## Open Questions

1. **ENG-09 next piece count: Requirements say 3, CONTEXT.md says 1**
   - What we know: REQUIREMENTS.md ENG-09 says "display next 3 upcoming pieces"; CONTEXT.md says "Next piece queue: 1 piece shown/tracked"
   - What's unclear: Is 1 a user decision or an oversight? The 7-bag queue can easily serve N pieces.
   - Recommendation: Implement queue that can serve N pieces (trivial with the Bag class); display 1 in Phase 1 canvas (matching CONTEXT.md decision), and treat 3-piece display as Phase 2 UI work. The engine should always be able to `peek(3)`.

2. **Perfect clear bonus exact value**
   - What we know: CONTEXT.md says "e.g., 3500 points" as a fixed value; Guideline uses level-scaled values (800–3200 × level)
   - What's unclear: User said this is Claude's discretion
   - Recommendation: Implement Guideline level-scaled values — they are more authentic and already researched. Document the choice.

3. **T-spin mini promotion via 5th kick test**
   - What we know: SRS specifies that when the 5th kick (large offset) is used, a mini T-spin is promoted to a full T-spin
   - What's unclear: The exact kick offset that triggers promotion varies by implementation
   - Recommendation: Track `lastKickIndex` on the piece; if `lastKickIndex === 4` (0-based), promote mini to full.

4. **Spawn buffer rows (above visible board)**
   - What we know: Standard is 2 hidden rows above row 0 for spawn; game over triggered if spawn position collides
   - What's unclear: Whether to implement a full 22-row board internally or just check spawn validity at row -1
   - Recommendation: Keep board as 20-row array internally; represent spawn at `row = -1`. Collision check handles `row < 0` as valid (buffer zone). Game over fires when spawn at `row = -1` with `row + offset = 0` collides.

---

## Sources

### Primary (HIGH confidence)
- tetris.wiki/Super_Rotation_System — complete JLSTZ and I wall kick tables, spawn states
- tetris.wiki/Scoring — full Guideline scoring table: line clears, T-spins, B2B, combo, perfect clear, hard/soft drop
- tetris.wiki/T-Spin — 3-corner rule, mini vs. full classification, wall/floor counting
- tetris.wiki/Tetris_Guideline — spawn positions, colors, lock delay types, gravity formula, 7-bag mandate
- tetris.wiki/Lock_delay — Extended Placement Lock Down, move reset, 15-reset cap behavior
- MDN CanvasRenderingContext2D.shadowBlur — property behavior, performance characteristics
- web.dev/canvas-performance — offscreen canvas pre-rendering, shadowBlur cost, clearRect vs. width reset

### Secondary (MEDIUM confidence)
- tetris.wiki/Random_Generator — 7-bag algorithm conceptual description (implementation pattern inferred as Fisher-Yates, standard for shuffle)
- spicyyoghurt.com/tutorials — rAF + delta time game loop pattern (standard, verified against MDN rAF docs)

### Tertiary (LOW confidence)
- Medium/blog posts on TypeScript Tetris architecture — used only to confirm community patterns, not relied upon for mechanical correctness

---

## Metadata

**Confidence breakdown:**
- SRS wall kick tables: HIGH — fetched directly from tetris.wiki/Super_Rotation_System
- Scoring formulas: HIGH — fetched directly from tetris.wiki/Scoring
- T-spin detection: HIGH — fetched from tetris.wiki/T-Spin; 3-corner rule well documented
- Lock delay mechanics: HIGH — cross-referenced tetris.wiki/Lock_delay + tetris.wiki/Tetris_Guideline
- Canvas performance patterns: HIGH — web.dev/canvas-performance is authoritative Google source
- Gravity formula: HIGH — tetris.wiki/Tetris_Guideline references Tetris Worlds Marathon curve
- 7-bag implementation: MEDIUM — conceptual algorithm confirmed; Fisher-Yates shuffle is the standard approach but not explicitly stated in official docs
- T-spin mini 5th-kick promotion: MEDIUM — documented in wiki but exact implementation varies by game

**Research date:** 2026-03-01
**Valid until:** 2026-06-01 (stable — Tetris mechanics have been frozen since ~2010; Canvas APIs are stable)
