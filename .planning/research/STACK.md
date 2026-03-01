# Stack Research: Browser-Based Tetris (React + Vite + Firebase)

**Research Type:** Project Research — Stack Dimension
**Date:** 2026-03-01
**Project:** Tetris with neon/glow aesthetic, Google Auth, Firestore leaderboard

---

## Decision Summary

| Layer | Choice | Version |
|-------|--------|---------|
| Build tool | Vite | 6.x |
| UI framework | React | 19.x |
| Language | TypeScript | 5.x |
| Game rendering | Canvas API (via `useRef` + `requestAnimationFrame`) | native |
| Game loop | Custom `requestAnimationFrame` hook | — |
| Animation (UI) | CSS keyframes + custom properties | native |
| Glow/neon effects | CSS `box-shadow` + `text-shadow` + `filter: drop-shadow` | native |
| Firebase SDK | firebase (modular v11) | 11.x |
| Auth | Firebase Authentication (Google provider) | v11 |
| Database | Cloud Firestore | v11 |
| Mobile touch | Pointer Events API + custom swipe/tap hook | native |
| Hosting | Vercel | — |
| Linting | ESLint 9 + `eslint-plugin-react-hooks` | 9.x |
| Formatting | Prettier | 3.x |

---

## Core Stack

### Vite 6.x

**Why:** Vite 6 is the standard bundler for React projects in 2026. Sub-100ms cold start, instant HMR, and first-class TypeScript support with zero config. The `@vitejs/plugin-react` plugin uses SWC under the hood (not Babel) for transforms, making it the fastest dev experience available. Rollup-based production builds are well-optimized for small game bundles.

**What NOT to use:** Create React App (CRA) is fully dead as of 2025 — unmaintained and slow. Next.js is overkill for a client-side game with no SSR needs; it adds unnecessary complexity and deployment constraints.

```bash
npm create vite@latest tetris -- --template react-ts
```

### React 19.x + TypeScript 5.x

**Why React 19:** The stable release of React 19 brings the Actions API and improved `useOptimistic` patterns, but more relevantly for a game: the reconciler improvements mean fewer unnecessary re-renders. TypeScript 5.x gives us satisfies operator, const type parameters, and excellent inference — particularly useful for typing the Tetris board grid (a 2D tuple array), tetromino shapes, and game state.

**Why TypeScript:** A Tetris game has non-trivial type surface — piece shapes, rotation matrices, board cell states, Firestore document shapes, score records. TypeScript prevents a class of bugs at the boundary between game logic and rendering, and at the Firebase data layer.

**What NOT to use:** Plain JavaScript is fine for tiny projects but the game logic here (piece collision, rotation, line clearing, level progression) is complex enough that type safety pays for itself immediately.

---

## Rendering: Canvas API (NOT CSS/DOM)

### Decision: Canvas

**Use the HTML5 Canvas API for the game board and falling pieces. Use CSS/DOM for all surrounding UI (score panel, leaderboard, login button, mobile controls overlay).**

### Rationale

**Performance:** A Tetris game board is a 10x20 grid that redraws every frame (typically 60fps). Canvas renders the entire board as a bitmap each frame — `clearRect` + redraw is extremely fast. DOM-based rendering requires React to diff and patch the DOM for each cell state change; with 200 cells potentially changing per frame, this creates substantial reconciler overhead even with memoization.

**Glow effects on Canvas:** CSS `filter: drop-shadow` applied to the `<canvas>` element itself creates a uniform glow over everything drawn on it. For per-piece glow, `ctx.shadowBlur` and `ctx.shadowColor` are Canvas 2D API properties that apply glow effects to individual drawn shapes. This gives precise neon control per piece color.

**Simplicity of game loop:** The game loop runs outside React's render cycle — a `requestAnimationFrame` loop updates game state in a ref, then draws to canvas. React state is only updated for score/level/status changes that affect the surrounding UI. This clean separation avoids React trying to own 60fps updates.

**When CSS/DOM is better:** For static or low-frequency UI (menus, score display, leaderboard table, buttons) CSS/DOM is superior because you get CSS animations, accessibility, and React's component model for free. The hybrid approach — Canvas for the game board, React components for everything else — is the correct split.

### Implementation Pattern

```typescript
// Game loop lives entirely outside React's reconciler
const canvasRef = useRef<HTMLCanvasElement>(null);
const gameStateRef = useRef<GameState>(initialState);
const animFrameRef = useRef<number>(0);

useEffect(() => {
  const canvas = canvasRef.current!;
  const ctx = canvas.getContext('2d')!;

  const loop = (timestamp: number) => {
    update(gameStateRef.current, timestamp); // mutate ref — no re-render
    draw(ctx, gameStateRef.current);          // imperative canvas draw
    animFrameRef.current = requestAnimationFrame(loop);
  };

  animFrameRef.current = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(animFrameRef.current);
}, []);
```

React state (`useState`) is only updated when score, level, lines, or game-over status change — not every frame.

**What NOT to use:** `react-konva`, `react-three-fiber`, Phaser, or PixiJS are all unnecessary. Phaser and Pixi bring large bundle sizes (~500KB+) for a game whose rendering needs are trivially met by the native Canvas 2D API. A Tetris game does not need a scene graph, physics engine, or WebGL.

---

## Game Loop

### Custom `requestAnimationFrame` Hook

No library needed. A Tetris game loop is straightforward:

1. Compute delta time since last frame
2. If delta > current drop interval (decreases with level), move piece down
3. Check collision; if landed, lock piece, clear lines, spawn next piece
4. Draw frame

```typescript
// useGameLoop.ts
export function useGameLoop(callback: (delta: number) => void, running: boolean) {
  const savedCallback = useRef(callback);
  const lastTime = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (!running) return;
    const tick = (time: number) => {
      const delta = lastTime.current ? time - lastTime.current : 0;
      lastTime.current = time;
      savedCallback.current(delta);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [running]);
}
```

**What NOT to use:** `useRaf` from various hook libraries adds abstraction with no benefit. `setInterval` is wrong for game loops — it drifts and doesn't sync with the display refresh rate.

---

## CSS Glow / Neon Aesthetic

### CSS Custom Properties + `box-shadow` + `filter`

All glow effects use native CSS. No additional libraries needed.

**Piece colors defined as CSS custom properties:**

```css
:root {
  --neon-cyan:    #00f5ff;
  --neon-yellow:  #f5e642;
  --neon-purple:  #bf5fff;
  --neon-green:   #39ff14;
  --neon-red:     #ff2b4e;
  --neon-orange:  #ff8c00;
  --neon-blue:    #1e90ff;
  --bg-dark:      #0a0a0f;
  --glow-blur:    12px;
}
```

**Canvas glow per piece:**
```javascript
// In draw() function — set shadow before drawing each piece
ctx.shadowColor = pieceColor;
ctx.shadowBlur = 16;
ctx.fillStyle = pieceColor;
ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
ctx.shadowBlur = 0; // reset after
```

**CSS glow for surrounding UI elements:**
```css
.score-value {
  color: var(--neon-cyan);
  text-shadow:
    0 0 8px var(--neon-cyan),
    0 0 20px var(--neon-cyan),
    0 0 40px var(--neon-cyan);
}

.game-border {
  border: 2px solid var(--neon-cyan);
  box-shadow:
    0 0 10px var(--neon-cyan),
    inset 0 0 10px rgba(0, 245, 255, 0.1);
}
```

**Pulsing glow animation:**
```css
@keyframes neon-pulse {
  0%, 100% { opacity: 1; filter: brightness(1); }
  50%       { opacity: 0.85; filter: brightness(1.3); }
}

.piece-ghost {
  animation: neon-pulse 2s ease-in-out infinite;
}
```

**Line clear flash effect:**
```css
@keyframes line-clear-flash {
  0%   { background: rgba(255, 255, 255, 0.9); }
  100% { background: transparent; }
}
```

**What NOT to use:** Styled-components or Emotion add runtime overhead and complexity. For a game with a fixed aesthetic, plain CSS modules (`*.module.css`) or a single global stylesheet are sufficient. No CSS-in-JS needed.

---

## Firebase SDK v11 (Modular)

### Version

Use `firebase@^11.0.0`. The modular (tree-shakeable) SDK has been stable since v9 and v11 is the current major in 2026. Import only what you use — Firestore and Auth modules are tree-shaken in production builds.

### Setup Pattern

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

### Auth (Google Sign-In)

```typescript
// useAuth.ts
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser); // unsubscribes on cleanup
  }, []);

  const signIn  = () => signInWithPopup(auth, googleProvider);
  const signOut_ = () => signOut(auth);

  return { user, signIn, signOut: signOut_ };
}
```

### Firestore Leaderboard

**Collection structure:** `scores/{docId}` with fields `{ uid, displayName, photoURL, score, timestamp }`.

**Write (on game over, only if score is a new personal best):**

```typescript
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

async function submitScore(user: User, score: number) {
  // Only submit if it's a new personal best
  const existing = await getDocs(
    query(collection(db, 'scores'), where('uid', '==', user.uid), orderBy('score', 'desc'), limit(1))
  );
  const best = existing.docs[0]?.data().score ?? 0;
  if (score <= best) return;

  await addDoc(collection(db, 'scores'), {
    uid:         user.uid,
    displayName: user.displayName,
    photoURL:    user.photoURL,
    score,
    timestamp:   serverTimestamp(),
  });
}
```

**Read (leaderboard — top 10 globally):**

```typescript
const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(10));
const snapshot = await getDocs(q);
const leaders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
```

**Firestore Security Rules:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{docId} {
      allow read: if true;                              // leaderboard is public
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.score is number
        && request.resource.data.score > 0;
      allow update, delete: if false;                  // immutable after write
    }
  }
}
```

**What NOT to use:** Realtime Database (RTDB) is legacy — Firestore has better querying and offline support. Firebase Hosting is optional since Vercel is preferred and simpler.

---

## Mobile Touch Controls

### Pointer Events API + Custom Hook (No Library)

Touch controls for Tetris require:
- **Swipe left/right** → move piece
- **Swipe down** → soft drop
- **Tap** → rotate
- **Long-press down** → hard drop (optional)

The Pointer Events API unifies mouse, touch, and stylus. Use it instead of the legacy `touchstart`/`touchmove` API.

```typescript
// useTouchControls.ts
export function useTouchControls(
  onMoveLeft: () => void,
  onMoveRight: () => void,
  onRotate: () => void,
  onSoftDrop: () => void,
  onHardDrop: () => void,
) {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 30; // px

  const onPointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      onRotate(); // tap
    } else if (Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? onMoveLeft() : onMoveRight();
    } else {
      dy > 0 ? onSoftDrop() : onHardDrop();
    }

    startPos.current = null;
  };

  return { onPointerDown, onPointerUp };
}
```

**Alternative — on-screen D-pad buttons:** For the clearest mobile UX, render visible touch buttons (left arrow, right arrow, rotate, down) as a fixed overlay below the canvas. This is more discoverable than swipe gestures for new players. Both approaches can coexist.

**Prevent scroll:** Apply `touch-action: none` on the canvas element to prevent scroll interference.

```css
canvas {
  touch-action: none;
  user-select: none;
}
```

**What NOT to use:** `react-use-gesture` / `@use-gesture/react` adds ~20KB for gesture handling that is trivially implemented with Pointer Events for a game with 4 possible gestures. Hammer.js is legacy and unmaintained.

---

## Responsive Layout

### CSS Grid + Viewport Units

No UI component library needed. The layout is simple: a centered game column with the canvas board and a sidebar (score, next piece, level, leaderboard).

```css
.game-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

@media (max-width: 600px) {
  .game-layout {
    grid-template-columns: 1fr;   /* stack vertically on mobile */
  }

  canvas {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 2;          /* 10-wide × 20-tall board */
  }
}
```

**What NOT to use:** Tailwind CSS, MUI, Chakra UI, etc. are unnecessary for a single-page game with a fixed aesthetic. They add bundle weight and fight against the custom neon design. Plain CSS with custom properties is the right tool.

---

## Project Structure

```
tetris/
├── src/
│   ├── game/
│   │   ├── constants.ts       # BOARD_WIDTH, BOARD_HEIGHT, PIECES, COLORS, SPEEDS
│   │   ├── board.ts           # Board manipulation (createBoard, clearLines, etc.)
│   │   ├── pieces.ts          # Tetromino definitions and rotation matrices
│   │   ├── collision.ts       # Collision detection
│   │   └── scoring.ts        # Score/level progression formula
│   ├── hooks/
│   │   ├── useAuth.ts         # Firebase auth state
│   │   ├── useGameLoop.ts     # requestAnimationFrame loop
│   │   ├── useTouchControls.ts
│   │   └── useLeaderboard.ts  # Firestore reads
│   ├── components/
│   │   ├── GameCanvas.tsx     # The canvas element + draw logic
│   │   ├── ScorePanel.tsx
│   │   ├── NextPiece.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── LoginButton.tsx
│   │   └── MobileControls.tsx
│   ├── lib/
│   │   └── firebase.ts        # Firebase init
│   ├── styles/
│   │   ├── global.css         # Custom properties, resets, neon variables
│   │   └── components/        # Per-component CSS modules
│   ├── App.tsx
│   └── main.tsx
├── .env.local                 # VITE_FIREBASE_* keys (gitignored)
├── index.html
├── vite.config.ts
└── tsconfig.json
```

---

## What NOT to Use — Summary

| Library | Why Not |
|---------|---------|
| Phaser.js | 1MB+ bundle, scene graph/physics overkill for Tetris |
| PixiJS | WebGL rendering unnecessary, complex API for simple shapes |
| react-konva | Canvas abstraction adds overhead, no benefit for a game loop |
| Three.js | 3D rendering — wrong tool entirely |
| Redux / Zustand | Overkill for game state held in refs; React state sufficient for UI slice |
| react-query / SWR | Firestore has its own real-time listener pattern; these don't add value |
| Styled-components / Emotion | Runtime CSS-in-JS overhead; plain CSS is faster and simpler |
| Tailwind CSS | Fights the custom neon aesthetic; not worth config overhead |
| Hammer.js | Legacy, unmaintained touch library |
| @use-gesture/react | 20KB for 4 gestures easily covered by Pointer Events |
| Create React App | Deprecated and unmaintained since 2023 |
| Next.js | SSR framework for a pure client-side game |
| Realtime Database | Legacy Firebase product; Firestore is superior |

---

## Environment Variables

All Firebase config values are public (they identify the project, not grant access — security is enforced by Firestore rules). Standard practice is to commit them via environment variables for CI/CD safety.

```
# .env.local (gitignored)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Set the same vars in Vercel's project settings for production deployment.

---

## Hosting: Vercel

**Why Vercel over Netlify:** Both work equally well for Vite static output. Vercel has faster edge CDN in 2026 and the DX (GitHub integration, instant preview URLs) is marginally better. Either is a valid choice — the `dist/` folder from `vite build` is deployed as-is.

**Build command:** `npm run build`
**Output directory:** `dist`
**No server-side configuration needed** — the game is fully client-side, Firebase handles all data.

---

## Quality Gate Checklist

- [x] Versions are current (2026): Vite 6, React 19, Firebase 11, TypeScript 5
- [x] Rationale explains WHY: Canvas vs DOM decision addressed with performance reasoning
- [x] Canvas vs CSS/DOM decision: Canvas for game board, CSS/DOM for surrounding UI
- [x] Firebase Auth + Firestore setup approach covered with code examples
- [x] Mobile touch control approach covered: Pointer Events API + optional D-pad overlay

---

*Research conducted: 2026-03-01*
*Feeds into: ROADMAP.md*
