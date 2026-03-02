# Phase 2: React Shell + Visual Polish - Research

**Researched:** 2026-03-02
**Domain:** React UI, Canvas 2D animation, CSS layout, touch controls, keyboard DAS/ARR
**Confidence:** HIGH (core patterns), MEDIUM (animation timing specifics)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Neon palette & atmosphere**
- Neon synthwave palette (departs from Guideline colors) — hot pink, electric blue, neon green, purple; each piece gets a vivid, distinct synthwave color
- Background: near-black (#0a0a0f) — maximum contrast for neon glow
- Subtle grid lines (e.g. very faint ~#1a1a2e) — visible enough to aid piece placement, not distracting
- Ghost piece: dim outline only (border in piece's color, no fill)

**Animations**
- Line-clear: flash then collapse — cleared rows flash bright neon, then instantly disappear and rows fall
- Line-clear duration: ~100ms flash before collapse — snappy, minimal interruption to gameplay
- Lock-in: brief bright flash on the locked cells (~50ms) — confirms piece placement
- Level-up: full board flash — entire board flashes briefly to celebrate the level milestone

**Side panels**
- Info shown: Score, Level, Lines, Next piece (1 piece), Hold piece, High score (local best)
- Desktop layout: Left panel = Hold | Center = Board | Right panel = Score + Next + Level + Lines + High score
- Next piece preview shows 1 piece only
- Game-over screen: darkened overlay on the board with final score and restart button (board stays visible underneath)

**Mobile controls**
- Primary movement: swipe gestures (swipe left/right to move, swipe down = soft drop)
- Tap anywhere on board = rotate clockwise
- Rotate CCW: explicit button (always visible)
- Always-visible buttons at bottom of screen, below the board: Hard drop, Hold, Pause, Rotate CCW
- No hardware keyboard required

### Claude's Discretion
- Exact synthwave color hex values per tetromino type
- Button visual style and sizing on mobile
- Swipe vs tap detection threshold (pixels/ms to distinguish)
- Pause screen design
- Typography and spacing in side panels
- Exact flash color for animations (white vs neon)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Game board renders on HTML5 Canvas with neon/glow effect — each tetromino type has a distinct neon color rendered via `ctx.shadowBlur` / `ctx.shadowColor` | Phase 1 already implements offscreen pre-baked neon textures in `offscreen.ts`. Phase 2 updates `PIECE_COLORS` to synthwave palette and extends ghost piece rendering to outline-only. |
| VIS-02 | Background is near-black (#0d0d1a or similar); board lines are subtle dark grid | Phase 1 `index.css` already sets `body { background: #0d0d1a }`. Grid lines in `CanvasRenderer.drawGrid()` exist but need color update to `#1a1a2e`. |
| VIS-03 | Line-clear animation: cleared rows flash/pulse before disappearing | Requires animation state machine in `CanvasRenderer` + engine event. Flash rows at high brightness for ~100ms, then collapse. Driven by `onLineClear` event already in engine. |
| VIS-04 | Level-up visual effect: brief screen flash or glow burst on level increase | Full-board alpha overlay in `CanvasRenderer` triggered by `onLevelUp` engine event. Already wired in engine. |
| VIS-05 | Active piece has brightest glow; ghost piece is dim/translucent version of the same color | Ghost piece currently uses `globalAlpha=0.25` + solid fill. Must change to outline-only: `strokeRect` with piece color, no fill. Active piece texture already has `shadowBlur=12`. |
| VIS-06 | Lock-in flash: brief bright flash when a piece locks into place | White/neon overlay on locked mino positions for ~50ms. Triggered by `onPieceLock` event. |
| CTR-01 | All gameplay functions work with keyboard on desktop (arrows, spacebar, Z/C keys) | Phase 1 has basic `keydown`/`keyup` in `GameBoard.tsx`. Phase 2 adds DAS/ARR (133ms delay, 33ms repeat), adds P key for pause, Ctrl key for CCW. |
| CTR-02 | Touch/swipe controls work on mobile: swipe left/right = move, swipe down = soft drop, swipe up = hard drop, tap = rotate clockwise | Custom `touchstart`/`touchmove`/`touchend` handler on canvas with `touch-action: none`. Threshold: ~30px displacement OR >50ms press = tap. |
| CTR-03 | On-screen virtual buttons visible on mobile for discoverability (rotate CW/CCW, hard drop, hold) | DOM buttons rendered in React below canvas. Always visible on mobile, hidden on desktop via media query or CSS. |
| CTR-04 | Player can pause and resume the game (P key or pause button) | `engine.pause()`/`engine.resume()` already exist. Wire P key in keyboard handler. Pause overlay on canvas. |
| CTR-05 | Game over screen displays final score, personal best, and options to play again or view leaderboard | Game over overlay already partially in `CanvasRenderer.drawGameOverOverlay()`. Phase 2 upgrades to full-board darkened overlay + React overlay div with score, personal best (localStorage), restart button. "View Leaderboard" placeholder (Phase 3). |
| LAY-01 | Layout adapts to desktop (landscape): game board centered, panels left/right | CSS Grid with `grid-template-areas`: `"left-panel board right-panel"`. Side panels fixed width ~140px. |
| LAY-02 | Layout adapts to mobile (portrait): game board top, score/next panel compact below, virtual controls at bottom | Media query `@media (max-width: 600px)` switches grid to single-column. Controls pinned to bottom. |
| LAY-03 | Game canvas scales to fit viewport without overflow or scroll on any device | Canvas uses CSS `max-height: calc(100vh - X)` + `aspect-ratio` maintained via fixed pixel dimensions. Scale via CSS `transform: scale()` or viewport units. |
| LAY-04 | No keyboard or hardware dependency on mobile — game is fully playable via touch alone | Virtual buttons + swipe gestures cover all actions. `touch-action: none` on canvas. |
</phase_requirements>

---

## Summary

Phase 2 wraps the Phase 1 engine in a complete React UI with three areas of work: (1) visual refinement — updating the neon palette to full synthwave colors, changing the ghost piece to outline-only, and adding three timed canvas animations (line-clear flash, lock-in flash, level-up flash); (2) input hardening — adding DAS/ARR auto-repeat to keyboard controls, wiring pause, and implementing swipe/tap gesture detection plus virtual on-screen buttons; (3) responsive layout — restructuring `GameBoard.tsx` into a CSS Grid layout with side panels on desktop and a stacked column on mobile, with canvas scaling to prevent viewport overflow.

The Phase 1 codebase is well-prepared for this work. The engine already fires `onLineClear`, `onLevelUp`, `onPieceLock`, `onHold`, `onGameOver`, and `onScoreUpdate` events. The renderer uses pre-baked offscreen textures for neon glow (no per-frame shadowBlur cost). The `useGameEngine` hook already separates game state (refs) from display state (React). The main additions are: an animation state machine inside `CanvasRenderer` to handle timed flash effects, a `useTouchControls` hook for swipe/tap detection, a `useKeyboard` hook with DAS/ARR, and a layout refactor of `App.tsx` + `GameBoard.tsx`.

No new npm packages are required. All functionality is achievable with Canvas 2D APIs, CSS custom properties, CSS Grid media queries, and native browser touch events.

**Primary recommendation:** Build the animation state machine inside `CanvasRenderer` (not in React state) — flash durations are 50-100ms, far below React's re-render threshold. Wire all visual effects through existing engine events.

---

## Standard Stack

### Core (already installed — no new packages required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.0.0 | Component tree, display state, event handlers | Already installed; `useRef` for game loop |
| TypeScript 5 | ~5.7.2 | Type safety for animation state, touch handlers | Already installed |
| Vite 6 | ^6.2.0 | Dev server, build | Already installed |
| Canvas 2D API | Browser native | Rendering, neon glow, flash animations | Pre-baked offscreen textures already working |

### Supporting (no install needed)
| Tool | Purpose | When to Use |
|------|---------|-------------|
| CSS Custom Properties (`:root`) | Neon color tokens, spacing, breakpoints | Central palette definition for CSS and potentially JS |
| CSS Grid + `grid-template-areas` | Three-column desktop layout, single-column mobile | Named areas make layout readable and easy to change |
| `localStorage` | Personal best score persistence | No backend in Phase 2; simple `getItem`/`setItem` |
| Google Fonts CDN | Neon typography (`Orbitron` or `Press Start 2P`) | Free, self-contained, no build step |
| `OffscreenCanvas` | Already used for pre-baked glow textures | Add ghost outline texture as new offscreen canvas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla touch events | Hammer.js / React-use-gesture | Overkill for 4 gestures; adds dependency; vanilla is 30 lines |
| CSS Grid media query | Flexbox + media query | Grid with named areas is more readable for 3-zone layout |
| Google Fonts CDN | Self-hosted font files | CDN is simpler; self-host only if offline support needed (Phase 4 concern) |
| `localStorage` for high score | React state only | localStorage persists across sessions without backend |

**Installation:** No new packages required for Phase 2.

---

## Architecture Patterns

### Recommended Project Structure After Phase 2

```
src/
├── engine/          # Unchanged from Phase 1
│   ├── TetrisEngine.ts
│   ├── constants.ts  ← update PIECE_COLORS to synthwave palette
│   └── types.ts
├── renderer/
│   ├── CanvasRenderer.ts  ← add AnimationState machine
│   └── offscreen.ts       ← add ghost outline texture
├── hooks/
│   ├── useGameEngine.ts   ← add onLevelUp, onPieceLock animation triggers
│   ├── useKeyboard.ts     ← NEW: DAS/ARR, pause, extracted from GameBoard
│   └── useTouchControls.ts ← NEW: swipe/tap gesture handler
├── components/
│   ├── GameBoard.tsx      ← becomes layout shell only (board + panels)
│   ├── SidePanel.tsx      ← NEW: score/level/lines/next/hold display
│   └── VirtualControls.tsx ← NEW: mobile button row
├── App.tsx                ← CSS Grid layout shell
└── index.css              ← CSS custom properties, grid layout, media queries
```

### Pattern 1: Animation State Machine in CanvasRenderer

**What:** `CanvasRenderer` tracks a list of active flash animations as plain objects `{ type, elapsed, rows?, cells? }`. Each `render()` call advances elapsed time via a passed `dt` parameter and draws overlays.

**When to use:** Flash durations (50-100ms) are too short for React state (causes unnecessary re-renders). Keep in renderer.

**Key insight:** `render()` must receive `dt` (delta time) so the renderer can advance animation timers independently. The `useGameEngine` rAF loop already computes `dt` — pass it to `renderer.render(state, dt)`.

**Example:**
```typescript
// src/renderer/CanvasRenderer.ts

type AnimationType = 'lineClear' | 'lockFlash' | 'levelUp';

interface Animation {
  type: AnimationType;
  elapsed: number;
  duration: number;         // ms total
  rows?: number[];          // for lineClear: which rows to flash
  cells?: [number,number][]; // for lockFlash: locked mino positions
}

export class CanvasRenderer {
  private animations: Animation[] = [];

  triggerLineClear(rows: number[]): void {
    this.animations.push({ type: 'lineClear', elapsed: 0, duration: 100, rows });
  }

  triggerLockFlash(cells: [number,number][]): void {
    this.animations.push({ type: 'lockFlash', elapsed: 0, duration: 50, cells });
  }

  triggerLevelUp(): void {
    this.animations.push({ type: 'levelUp', elapsed: 0, duration: 300 });
  }

  render(state: GameState, dt: number): void {
    // Advance + prune completed animations
    this.animations = this.animations.filter(a => {
      a.elapsed += dt;
      return a.elapsed < a.duration;
    });

    // ... existing board render ...

    // Render active animations on top
    for (const anim of this.animations) {
      const progress = anim.elapsed / anim.duration; // 0.0 → 1.0
      switch (anim.type) {
        case 'lineClear':  this.drawLineClearFlash(anim.rows!, progress); break;
        case 'lockFlash':  this.drawLockFlash(anim.cells!, progress); break;
        case 'levelUp':    this.drawLevelUpFlash(progress); break;
      }
    }
  }

  private drawLineClearFlash(rows: number[], progress: number): void {
    const alpha = 1 - progress; // fade out
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
    rows.forEach(r => {
      this.ctx.fillRect(0, r * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
    });
  }

  private drawLockFlash(cells: [number,number][], progress: number): void {
    const alpha = 1 - progress;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    cells.forEach(([c, r]) => {
      this.ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
  }

  private drawLevelUpFlash(progress: number): void {
    const alpha = Math.sin(progress * Math.PI) * 0.4; // pulse in then out
    this.ctx.fillStyle = `rgba(255, 200, 255, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

**Wiring in `useGameEngine.ts`:**
```typescript
engine.on('onLineClear', (linesCleared, _score, _tSpin, _b2b) => {
  // rows is not directly in the callback — need to capture cleared row indices
  // Option: add clearedRows to onLineClear event, or pass via rendererRef
  rendererRef.current?.triggerLineClear(clearedRows);
  setDisplayState(prev => ({ ...prev, nextPieces: engineRef.current?.state.nextPieces ?? [] }));
});

engine.on('onPieceLock', (pieceType, _tSpin) => {
  // capture last locked mino positions from engine.state before spawnPiece overwrites
  rendererRef.current?.triggerLockFlash(lastLockedCells);
  setDisplayState(prev => ({ ...prev, nextPieces: engineRef.current?.state.nextPieces ?? [] }));
});

engine.on('onLevelUp', (_level) => {
  rendererRef.current?.triggerLevelUp();
  setDisplayState(prev => ({ ...prev, level: engineRef.current?.level ?? 1 }));
});
```

**CRITICAL NOTE:** The `onLineClear` event needs to pass the cleared row indices to the renderer. The engine's `clearLines()` returns a count, not indices. Either: (a) update `GameEvents.onLineClear` to include `clearedRows: number[]` and pass them from `TetrisEngine.lockPiece()`, or (b) capture `state.board` before clear and diff. Option (a) is cleaner.

### Pattern 2: Ghost Piece as Outline-Only

**What:** Instead of `globalAlpha=0.25` + filled texture, draw ghost minos using `strokeRect` with piece color as stroke and no fill.

**Offscreen approach:** Create a separate ghost texture per piece type in `offscreen.ts`:
```typescript
function preRenderGhost(type: PieceType): OffscreenCanvas {
  const size = CELL_SIZE;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  const { glow } = PIECE_COLORS[type];

  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 6;
  ctx.shadowColor = glow;
  // Draw border only, no fill
  ctx.strokeRect(2, 2, size - 4, size - 4);
  return canvas;
}
```

Then in `CanvasRenderer.drawPiece()`, when `alpha < 1` (ghost), use `GHOST_TEXTURES` instead of `TEXTURES`, draw at `globalAlpha = 1.0` (outline looks better at full alpha than dimmed).

### Pattern 3: DAS/ARR Keyboard Hook

**What:** Extracted `useKeyboard` hook with Delayed Auto Shift (133ms delay) and Auto Repeat Rate (33ms repeat).

**When to use:** Phase 1 keyboard handler fires once per keydown event. DAS/ARR makes the game feel responsive during held movement.

**Standard values (confirmed from tetris.wiki):**
- DAS = 133ms (TETR.IO default, competitive-friendly)
- ARR = 33ms (2 frames at 60fps)
- Soft drop: no DAS, repeat every frame while held

```typescript
// src/hooks/useKeyboard.ts
const DAS_DELAY = 133; // ms before auto-repeat starts
const ARR_INTERVAL = 33; // ms between auto-repeat ticks

export function useKeyboard(engineRef: React.RefObject<TetrisEngine | null>) {
  useEffect(() => {
    const held = new Map<string, { dasTimer: number; arrTimer: number; interval: ReturnType<typeof setInterval> | null }>();

    function startDAS(key: string, action: () => void) {
      if (held.has(key)) return;
      action(); // immediate first move
      const state = { dasTimer: 0, arrTimer: 0, interval: null as any };
      held.set(key, state);
      state.interval = setInterval(() => {
        state.dasTimer += ARR_INTERVAL;
        if (state.dasTimer >= DAS_DELAY) {
          action();
        }
      }, ARR_INTERVAL);
    }

    function stopDAS(key: string) {
      const state = held.get(key);
      if (state?.interval) clearInterval(state.interval);
      held.delete(key);
    }

    function onKeyDown(e: KeyboardEvent) {
      const engine = engineRef.current;
      if (!engine) return;
      if (['ArrowLeft','ArrowRight','ArrowDown',' '].includes(e.key)) e.preventDefault();

      switch (e.key) {
        case 'ArrowLeft':  startDAS('left',  () => engine.moveLeft()); break;
        case 'ArrowRight': startDAS('right', () => engine.moveRight()); break;
        case 'ArrowUp':    engine.rotate(true); break;
        case 'z': case 'Z': case 'Control': engine.rotate(false); break;
        case 'ArrowDown':  engine.softDrop(true); break;
        case ' ':          engine.hardDrop(); break;
        case 'c': case 'C': engine.hold(); break;
        case 'p': case 'P': engine.isPaused ? engine.resume() : engine.pause(); break;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.key === 'ArrowLeft')  stopDAS('left');
      if (e.key === 'ArrowRight') stopDAS('right');
      if (e.key === 'ArrowDown')  engine.softDrop(false);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      held.forEach(s => { if (s.interval) clearInterval(s.interval); });
    };
  }, [engineRef]);
}
```

**NOTE:** `engine.isPaused` — the engine has `_isPaused` as private. Either add a public getter `get isPaused()` to `TetrisEngine`, or track pause state in `displayState`.

### Pattern 4: Touch Swipe / Tap Detection

**What:** Custom hook on canvas element. Distinguishes swipe (>30px displacement) from tap (<30px displacement). Listens to `touchstart`/`touchmove`/`touchend`.

**CSS requirement:** `touch-action: none` on the canvas element prevents browser scroll/zoom.

```typescript
// src/hooks/useTouchControls.ts
const SWIPE_THRESHOLD = 30;   // px minimum to count as swipe
const TAP_MAX_MOVE = 15;      // px max displacement to still be a tap

export function useTouchControls(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  engineRef: React.RefObject<TetrisEngine | null>
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let startX = 0, startY = 0;
    let lastMoveX = 0;  // for continuous swipe tracking
    let moved = false;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault(); // must be called; requires passive:false
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      lastMoveX = t.clientX;
      moved = false;
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;
      const t = e.touches[0];
      const dx = t.clientX - lastMoveX;
      const dy = t.clientY - startY;

      // Horizontal swipe: move piece
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        if (dx > 0) engine.moveRight();
        else        engine.moveLeft();
        lastMoveX = t.clientX;
        moved = true;
      }
      // Swipe down: soft drop
      if (dy > SWIPE_THRESHOLD) {
        engine.softDrop(true);
        moved = true;
      }
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;

      engine.softDrop(false); // always cancel soft drop on lift

      const t = e.changedTouches[0];
      const totalDx = Math.abs(t.clientX - startX);
      const totalDy = Math.abs(t.clientY - startY);

      // Tap: minimal movement
      if (!moved && totalDx < TAP_MAX_MOVE && totalDy < TAP_MAX_MOVE) {
        engine.rotate(true); // CW
      }
    }

    // passive: false required to allow preventDefault()
    canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd,   { passive: false });

    return () => {
      canvas.removeEventListener('touchstart',  onTouchStart);
      canvas.removeEventListener('touchmove',   onTouchMove);
      canvas.removeEventListener('touchend',    onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [canvasRef, engineRef]);
}
```

**CRITICAL:** `{ passive: false }` is required for `preventDefault()` to work. Modern browsers default touch listeners to `passive: true` for performance, which blocks `preventDefault()`.

### Pattern 5: CSS Grid Layout with Media Query

**What:** Named grid areas for three-column desktop, single-column mobile. CSS custom properties for neon color palette.

```css
/* src/index.css */

:root {
  /* Synthwave neon palette — Claude's discretion colors */
  --color-bg:        #0a0a0f;
  --color-grid:      #1a1a2e;
  --color-border:    rgba(0, 240, 240, 0.25);
  --color-text:      #c0c0e0;
  --color-accent:    #00f0f0;

  /* Piece colors */
  --color-I:  #00f5ff;  /* electric cyan */
  --color-J:  #4d4dff;  /* electric blue */
  --color-L:  #ff8c00;  /* neon orange */
  --color-O:  #ffe600;  /* neon yellow */
  --color-S:  #00ff7f;  /* neon green */
  --color-T:  #bf00ff;  /* neon purple */
  --color-Z:  #ff2060;  /* hot pink/red */
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: 'Orbitron', monospace;
  margin: 0;
  height: 100vh;
  overflow: hidden; /* no scroll on desktop */
}

/* Desktop: 3-column layout */
.game-layout {
  display: grid;
  grid-template-areas: "left-panel board right-panel";
  grid-template-columns: 140px auto 160px;
  align-items: start;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  height: 100vh;
}

.panel-left  { grid-area: left-panel; }
.panel-board { grid-area: board; }
.panel-right { grid-area: right-panel; }

.virtual-controls { display: none; } /* hidden on desktop */

/* Mobile: single column */
@media (max-width: 600px) {
  body { overflow-y: auto; }

  .game-layout {
    grid-template-areas:
      "board"
      "right-panel"
      "left-panel";
    grid-template-columns: 1fr;
    height: auto;
    padding: 8px;
    gap: 8px;
  }

  .virtual-controls {
    display: flex;
    justify-content: space-around;
    padding: 12px 8px;
    gap: 8px;
    position: sticky;
    bottom: 0;
    background: rgba(10, 10, 15, 0.95);
  }
}
```

### Pattern 6: Canvas Scaling to Viewport

**What:** The canvas has fixed pixel dimensions (`300 × 600` for `COLS=10, ROWS=20, CELL_SIZE=30`). On mobile it may overflow. Scale via CSS without changing canvas resolution.

**Approach:** Wrap canvas in a container with `max-height`. Use CSS to scale:

```css
.board-canvas-container {
  display: flex;
  justify-content: center;
}

canvas#game-canvas {
  /* Fixed logical resolution: 300×600px */
  /* CSS scaling to fit — preserves pixel-perfect rendering */
  max-width: 100%;
  max-height: calc(100vh - 120px); /* leave room for panels on mobile */
  aspect-ratio: 10 / 20;
  object-fit: contain;
}
```

**Alternative:** Use CSS `transform: scale()` computed from `window.innerHeight`. More precise but requires JS + `ResizeObserver`. The CSS `max-width`/`aspect-ratio` approach is simpler and sufficient.

**IMPORTANT:** Canvas scaling via CSS does NOT change the canvas `width`/`height` attributes (which control the drawing buffer resolution). Only CSS dimensions change the display size. The canvas pixel resolution stays at `300×600` — no need to re-initialize the renderer on resize.

### Pattern 7: Personal Best in localStorage

```typescript
const STORAGE_KEY = 'tetris_personal_best';

function getPersonalBest(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
}

function updatePersonalBest(score: number): number {
  const current = getPersonalBest();
  if (score > current) {
    localStorage.setItem(STORAGE_KEY, String(score));
    return score;
  }
  return current;
}
```

### Anti-Patterns to Avoid

- **Flash animations in React state:** `useState({ flashActive: true })` at 50ms causes a React re-render before the flash is even visible. Keep animation timers inside `CanvasRenderer`, driven by the rAF `dt`.
- **`passive: true` touch listeners with `preventDefault()`:** Modern browsers ignore `preventDefault()` on passive listeners. Always pass `{ passive: false }` for game touch handlers.
- **CSS `overflow: hidden` globally on mobile:** Prevents page scrolling for the side panels. Use `overflow: hidden` only on the body for desktop; allow `overflow-y: auto` on mobile or use `position: fixed` for controls.
- **Canvas CSS scaling via `transform` without `transform-origin`:** Scaling from default `50% 50%` can push canvas off-center. Use `transform-origin: top left` or center the container instead.
- **Recreating ghost textures every frame:** Pre-bake ghost outline textures in `offscreen.ts` alongside solid textures. Same `initTextures()` call.
- **`setInterval` for DAS/ARR:** Can drift. Use a repeating `setInterval` only as a ticker; compute actual elapsed time from `Date.now()` if precision matters. For 33ms ARR, `setInterval` drift is acceptable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation timing | Custom timer class | `elapsed += dt` in render loop | The rAF dt is already computed; no separate scheduler needed |
| Gesture library | swipe detection framework | 30-line touchstart/touchend handler | Only 4 gestures needed; Hammer.js is 30KB+ |
| Font hosting | Custom font loading | Google Fonts CDN `<link>` in `index.html` | One-line, no build step, cached globally |
| Layout framework | Bootstrap grid | CSS Grid + `grid-template-areas` | No dependency; better control; synthwave is custom anyway |
| Score persistence | IndexedDB / cookie | `localStorage` getItem/setItem | Synchronous, 2-line API, sufficient for single score value |

**Key insight:** Phase 2 has no complex problems that require libraries. Every feature is achievable with native browser APIs in 30-50 lines of TypeScript.

---

## Common Pitfalls

### Pitfall 1: `passive: true` Blocking Touch preventDefault

**What goes wrong:** `addEventListener('touchmove', handler)` without `{ passive: false }` — `e.preventDefault()` silently fails, browser scrolls the page while swiping.

**Why it happens:** Chrome 51+ defaults touch listeners to passive for scroll performance. The warning in DevTools ("Unable to preventDefault inside passive event listener") is easy to miss.

**How to avoid:** Always add `{ passive: false }` to `touchstart`, `touchmove`, `touchend` listeners AND apply `touch-action: none` in CSS on the canvas element. Both are needed — CSS hint for pre-compositing, JS for runtime control.

**Warning signs:** Page scrolls while swiping on mobile. Canvas "jumps" during drag.

### Pitfall 2: `onLineClear` Without Cleared Row Indices

**What goes wrong:** The current `GameEvents.onLineClear` signature is `(linesCleared: number, score: number, tSpin, isB2B)` — no row indices. The renderer can't flash specific rows without knowing which ones.

**Why it happens:** Phase 1 only needed the count for scoring. The renderer needs actual row positions.

**How to avoid:** Update `GameEvents.onLineClear` signature to include `clearedRows: number[]`. Update `TetrisEngine.lockPiece()` to capture the indices from `board.clearLines()` before clearing. Also update `Board.clearLines()` to return the cleared row indices (not just the count).

**Warning signs:** Line-clear flash doesn't target the right rows, or flashes wrong rows.

### Pitfall 3: Canvas Logical vs CSS Size Mismatch

**What goes wrong:** Applying `width: 100%` in CSS to the canvas causes blurry rendering — browser scales the CSS display size but the canvas drawing buffer stays at `300×600`.

**Why it happens:** Canvas has two separate size concepts: `canvas.width` (drawing buffer pixels) and CSS width (display pixels). Scaling via CSS only affects display.

**How to avoid:** Keep `canvas.width = COLS * CELL_SIZE` and `canvas.height = ROWS * CELL_SIZE` set in `CanvasRenderer` constructor. Use `max-width: 100%; max-height: calc(100vh - Xpx)` in CSS. The canvas will display at correct aspect ratio without blurring.

**Warning signs:** Canvas content appears soft/blurry, especially on high-DPI mobile screens.

### Pitfall 4: High-DPI (devicePixelRatio) Blurriness

**What goes wrong:** On Retina/high-DPI screens (`window.devicePixelRatio = 2`), canvas with `width=300` CSS but `canvas.width=300` renders blurry because the physical pixel count is 600.

**Why it happens:** CSS 1px = 2 physical pixels on DPR=2 screens. Canvas drawing buffer at 300 logical pixels gets upscaled to 600 physical pixels → blurry.

**How to avoid:** Scale canvas drawing buffer by DPR:
```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width  = COLS * CELL_SIZE * dpr;
canvas.height = ROWS * CELL_SIZE * dpr;
canvas.style.width  = `${COLS * CELL_SIZE}px`;
canvas.style.height = `${ROWS * CELL_SIZE}px`;
ctx.scale(dpr, dpr); // all subsequent drawing in logical pixels
```
Then redraw offscreen textures at `CELL_SIZE * dpr`.

**Trade-off:** Doubles the drawing buffer area on Retina screens — minor GPU cost, but eliminates blurriness. For a fixed-resolution game like Tetris this is worth it.

**Warning signs:** Glow textures look fuzzy on iPhone/MacBook Retina screens.

### Pitfall 5: DAS Fires on Pause / Game Over

**What goes wrong:** Player holds left arrow, pauses, resumes — piece still auto-shifts because the `setInterval` in DAS wasn't cleared on pause.

**Why it happens:** DAS interval is running independently of game state. Engine calls `pause()` but `setInterval` isn't cleared.

**How to avoid:** In `useKeyboard`, check `engine.isPaused` and `engine.isGameOver` inside the DAS action callback before calling `engine.moveLeft()`. The engine already guards with `if (this._isPaused) return;` — but the interval still fires. Also clear all DAS intervals on blur event.

### Pitfall 6: Virtual Buttons on Desktop Pushing Layout

**What goes wrong:** Virtual buttons are always rendered in the DOM, pushing the canvas down on desktop.

**How to avoid:** CSS `display: none` on `.virtual-controls` in desktop breakpoint. The buttons only display in `@media (max-width: 600px)`.

### Pitfall 7: Swipe Threshold Too High on Small Screens

**What goes wrong:** 30px threshold feels sluggish on 320px-wide phones where the board is scaled down.

**How to avoid:** Scale threshold proportionally to canvas display width:
```typescript
const canvasDisplayWidth = canvas.getBoundingClientRect().width;
const scaleFactor = canvasDisplayWidth / (COLS * CELL_SIZE);
const effectiveThreshold = SWIPE_THRESHOLD / scaleFactor;
```

---

## Code Examples

Verified patterns from research and existing Phase 1 codebase:

### Ghost Piece Outline Texture (offscreen.ts addition)
```typescript
// Source: MDN CanvasRenderingContext2D.strokeRect + project offscreen.ts
const GHOST_TEXTURES = new Map<PieceType, OffscreenCanvas>();

function preRenderGhost(type: PieceType): OffscreenCanvas {
  const size = CELL_SIZE;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  const { glow } = PIECE_COLORS[type];

  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.shadowColor = glow;
  ctx.globalAlpha = 0.7;
  // 3px inset so stroke doesn't clip at edges
  ctx.strokeRect(3, 3, size - 6, size - 6);
  return canvas;
}

export function initTextures(): void {
  const types: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  types.forEach(type => {
    TEXTURES.set(type, preRenderPiece(type));
    GHOST_TEXTURES.set(type, preRenderGhost(type));
  });
}

export function getGhostTexture(type: PieceType): OffscreenCanvas {
  const tex = GHOST_TEXTURES.get(type);
  if (!tex) throw new Error(`Ghost texture not initialized for ${type}`);
  return tex;
}
```

### Synthwave Color Palette (constants.ts update)
```typescript
// Source: Synthwave Radiant Flux palette + research
// Claude's discretion: colors chosen for maximum vibrancy and distinctness
export const PIECE_COLORS: Record<PieceType, { fill: string; glow: string }> = {
  I: { fill: '#00f5ff', glow: '#00f5ff' }, // electric cyan
  J: { fill: '#4d4dff', glow: '#6666ff' }, // electric blue (brightened from Guideline dark blue)
  L: { fill: '#ff8c00', glow: '#ffaa00' }, // neon orange
  O: { fill: '#ffe600', glow: '#fff44f' }, // neon yellow
  S: { fill: '#00ff7f', glow: '#00ff9f' }, // neon green
  T: { fill: '#bf00ff', glow: '#d400ff' }, // neon purple
  Z: { fill: '#ff2060', glow: '#ff4080' }, // hot pink
};
```

### Prevent Body Scroll While Allowing Canvas Swipe
```css
/* Applied to canvas element */
canvas#game-canvas {
  touch-action: none; /* Source: MDN touch-action */
  display: block;
}
```

### localStorage High Score
```typescript
// Source: MDN Web Storage API
const BEST_SCORE_KEY = 'tetris_best';

export function loadBestScore(): number {
  return parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
}

export function saveBestScore(score: number): number {
  const current = loadBestScore();
  if (score > current) {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
    return score;
  }
  return current;
}
```

### isPaused Public Getter (TetrisEngine addition)
```typescript
// Add to TetrisEngine.ts (needed by keyboard hook for P-key toggle)
get isPaused(): boolean { return this._isPaused; }
get isGameOver(): boolean { return this._isGameOver; }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setInterval` for animations | `elapsed += dt` in rAF render loop | Standard since rAF adoption | No drift, no extra timers |
| CSS float-based game layout | CSS Grid with `grid-template-areas` | CSS Grid widely supported since 2017 | Named areas are readable, media queries are clean |
| Canvas global `shadowBlur` per frame | Pre-baked offscreen textures | Phase 1 locked in | Critical — avoids GPU paint storm at 60fps |
| Touch library (Hammer.js) | Native `touchstart`/`touchmove`/`touchend` | Libraries fell out of favor ~2020 | 0 dependencies, full control |
| Passive touch listeners | `{ passive: false }` for game canvas | Chrome 51+ passive default | Required to call `preventDefault()` |

**Deprecated/outdated:**
- `document.addEventListener('keydown')` without DAS/ARR: Phase 1 approach; feels unresponsive compared to modern Tetris feel
- `globalAlpha = 0.25` for ghost piece: valid approach but user wants outline-only per CONTEXT.md

---

## Open Questions

1. **Cleared Row Indices from Engine**
   - What we know: `Board.clearLines()` currently returns a count (number), not indices
   - What's unclear: Need to verify exact return value and whether refactoring `clearLines()` to return `number[]` breaks existing tests
   - Recommendation: Change `clearLines()` to return `number[]` (indices of cleared rows), update `TetrisEngine.lockPiece()` to pass them in `onLineClear` event. Update `Scorer.test.ts` if it checks `linesCleared` count.

2. **Canvas DPR Scaling Decision**
   - What we know: Retina screens benefit from DPR scaling; it doubles the offscreen texture size
   - What's unclear: Whether the user cares about retina sharpness vs keeping renderer simple
   - Recommendation: Implement DPR scaling in `CanvasRenderer` constructor. One-time setup, no ongoing cost. Offscreen textures also need to be initialized at `CELL_SIZE * dpr`.

3. **Pause Overlay Location: Canvas or React DOM**
   - What we know: Game-over overlay is currently drawn on canvas in `CanvasRenderer`. Pause could be canvas or DOM.
   - What's unclear: The user specified game-over as "darkened overlay on the board with final score and restart button (board stays visible)". This is best as a React DOM overlay (div positioned over canvas) rather than canvas text, for HTML button elements and high score display.
   - Recommendation: Move game-over from `CanvasRenderer.drawGameOverOverlay()` to a React `<div>` overlay positioned absolutely over the canvas. Pause screen similarly as a React overlay. Canvas only draws the game board.

4. **Virtual Button Sizing for Mobile**
   - What we know: Claude's discretion on button style and sizing
   - What's unclear: Minimum touch target size (Apple HIG recommends 44×44pt; Android 48×48dp)
   - Recommendation: Use `min-width: 56px; min-height: 56px` for buttons. 4 buttons in a row on narrow screens (320px) = 56px × 4 + gaps fits comfortably.

5. **Swipe Up = Hard Drop**
   - What we know: REQUIREMENTS.md CTR-02 says "swipe up = hard drop", but CONTEXT.md says always-visible hard drop button. Swipe up also maps to hard drop.
   - What's unclear: Whether swipe-up conflicts with tap-to-rotate if detection is ambiguous
   - Recommendation: Implement swipe up as hard drop (dy < -SWIPE_THRESHOLD). Distinguish from tap via total displacement. Tap = total displacement < TAP_MAX_MOVE in both axes.

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs: `touch-action` — CSS property values and game use case
- MDN Web Docs: Mobile Touch Controls (Games/Techniques/Control_mechanisms/Mobile_touch) — `preventDefault()` requirement, touch event pattern
- tetris.wiki/Tetris_Guideline — DAS 167ms, ARR 33ms (guideline spec), ghost piece spec, next queue spec
- tetris.wiki/DAS — DAS/ARR definitions; TETR.IO defaults of 133ms/33ms cited as competitive standard
- Phase 1 source code (verified by reading) — existing engine events, renderer architecture, types

### Secondary (MEDIUM confidence)
- WebSearch: DAS 133ms TETR.IO default — multiple forum sources agree; confirmed against tetris.wiki
- WebSearch + MDN: `{ passive: false }` required for `preventDefault()` in touch handlers — confirmed by MDN and Chrome docs
- WebSearch: CSS Grid `grid-template-areas` responsive layout pattern — confirmed by MDN common layouts guide
- Synthwave color palette research — hex values are Claude's discretion; selected from verified synthwave palette sources (Synthwave Radiant Flux, 8-Bit Synthwave Neon Horizon)

### Tertiary (LOW confidence)
- Animation state machine timing specifics (50ms lockFlash, 100ms lineClear, 300ms levelUp) — from CONTEXT.md user decisions, not external sources. These are the prescribed values and should be treated as requirements.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all Phase 1 stack verified working
- Architecture patterns: HIGH — canvas animation + CSS grid + touch events are stable browser APIs
- Animation timing: HIGH — values are locked decisions from CONTEXT.md (50ms lock, 100ms clear, ~300ms levelUp)
- DAS/ARR values: HIGH — confirmed from tetris.wiki Guideline (167ms spec) + TETR.IO defaults (133ms competitive)
- Pitfalls: HIGH — passive touch listener pitfall is well-documented; DPR is a known canvas gotcha

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (browser APIs are stable; 30-day window is conservative)
