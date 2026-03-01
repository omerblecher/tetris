# Architecture Research: Browser-Based Tetris with React + Firebase

**Dimension:** Architecture
**Project:** Browser-based Tetris game
**Tech Stack:** React + Vite + Firebase (Auth + Firestore)
**Date:** 2026-03-01

---

## Summary

A browser Tetris game in React separates cleanly into four layers: a pure game engine (logic, no React), a React UI layer (board render, controls), a Firebase auth layer, and a Firebase leaderboard layer. Game state is managed with `useReducer` at the top, the game loop runs via `requestAnimationFrame`, and Firestore writes happen only at game-over. Build order follows the separation: engine first, then UI, then auth, then leaderboard.

---

## Component Boundaries

### 1. Game Engine (Pure Logic — no React, no Firebase)

The game engine is the most important boundary to establish. It must be completely decoupled from React and Firebase so it can be tested in isolation and reasoned about independently.

**Responsibilities:**
- Board state: a 2D array (10 columns x 20 rows) of cell values (empty or color/piece ID)
- Piece definitions: the 7 tetrominoes (I, O, T, S, Z, J, L) as rotation matrices
- Active piece state: current piece type, rotation index, position (x, y)
- Collision detection: bounds checking and overlap with locked cells
- Movement: left, right, down, rotate (with wall-kick attempts)
- Line clearing: detect full rows, remove them, shift board down, return line count
- Gravity: advance piece downward on tick; lock piece when it can't move down
- Scoring: compute score delta from lines cleared (using official Tetris scoring)
- Piece spawning: pull next piece from queue, add new piece to queue (bag randomizer)
- Game-over detection: new piece spawns and immediately collides

**Implementation pattern — pure functions + reducer:**
```
// Pure engine functions
function rotatePiece(piece, board): piece | null
function movePiece(piece, dx, dy, board): piece | null
function lockPiece(piece, board): board
function clearLines(board): { board, linesCleared }
function spawnPiece(queue): { piece, queue }
function isGameOver(piece, board): boolean
function computeScore(linesCleared, level): number

// All state transitions go through a reducer action
type GameAction =
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'MOVE_DOWN' }
  | { type: 'HARD_DROP' }
  | { type: 'ROTATE' }
  | { type: 'TICK' }          // driven by game loop
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'GAME_OVER' }
```

### 2. React UI Layer

The UI layer consumes game state and dispatches actions. It does not contain game logic.

**Components:**
- `<App />` — root; holds auth state, routes between lobby/game/leaderboard
- `<GameProvider />` — owns `useReducer(gameReducer, initialState)`, exposes context
- `<GameBoard />` — renders the 10x20 board grid from state; pure display
- `<ActivePiece />` — renders the falling piece and ghost piece overlay
- `<NextPiece />` — shows preview of next piece(s) in queue
- `<HoldPiece />` — shows held piece slot
- `<ScorePanel />` — displays score, level, lines cleared
- `<GameOverlay />` — start screen, pause screen, game-over screen
- `<Controls />` — keyboard listener component (attaches event listeners, dispatches actions)

**Key rule:** Components never call engine functions directly. They dispatch actions; the reducer calls engine functions.

### 3. Auth Layer (Firebase Auth)

A thin integration layer between Firebase Auth and the React app.

**Responsibilities:**
- Listen to `onAuthStateChanged` and expose `user` to app via context
- Provide `signInWithGoogle()` and `signOut()` helpers
- Gate the game start or leaderboard submission behind auth state
- Store minimal user profile (uid, displayName, photoURL) — no game state here

**Components/hooks:**
- `<AuthProvider />` — wraps app, provides `AuthContext`
- `useAuth()` — hook to read `{ user, loading, signIn, signOut }`
- Auth is optional for playing; required only for leaderboard submission

### 4. Leaderboard Layer (Firebase Firestore)

Read/write scores from Firestore. Entirely separate from game logic.

**Responsibilities:**
- Write a score document on game-over (if user is authenticated)
- Read top N scores for leaderboard display
- Real-time updates via `onSnapshot` listener on the leaderboard query

**Firestore data model:**
```
scores/{scoreId}
  uid: string
  displayName: string
  photoURL: string
  score: number
  linesCleared: number
  level: number
  createdAt: Timestamp
```

**Components/hooks:**
- `useLeaderboard()` — subscribes to `query(collection('scores'), orderBy('score','desc'), limit(10))`
- `useSubmitScore()` — writes score doc after game-over
- `<LeaderboardTable />` — displays top scores

---

## State Management Approach

**Recommendation: `useReducer` for game state, `useState` for simple UI state, React Context for sharing.**

Rationale:
- Tetris game state has many interdependent fields (board, piece, score, level, status). A reducer co-locates all transitions, making them auditable and testable.
- `useState` per field would create synchronization problems (e.g., updating board and score must be atomic).
- Zustand is an option if the app grows complex, but for a single game screen `useReducer` + Context is sufficient and has no extra dependencies.
- Redux is overkill for this scope.

**Game state shape:**
```typescript
interface GameState {
  board: Cell[][];           // 20 rows x 10 cols
  activePiece: Piece | null;
  ghostPiece: Piece | null;  // computed, not stored — derived in reducer
  nextQueue: PieceType[];    // next 1–5 pieces
  heldPiece: PieceType | null;
  holdUsed: boolean;         // can only hold once per piece
  score: number;
  level: number;
  linesCleared: number;
  status: 'idle' | 'playing' | 'paused' | 'gameover';
}
```

Ghost piece (drop preview) is computed inside the reducer on every state change — never stored independently, derived from `activePiece` + `board`.

**Context split:**
- `GameContext` — provides `{ state, dispatch }` from `useReducer`
- `AuthContext` — provides `{ user, loading, signIn, signOut }`

---

## Game Loop Pattern

**Pattern: `requestAnimationFrame` with delta-time gravity.**

```typescript
// Inside a custom hook: useGameLoop(dispatch, status)
useEffect(() => {
  if (status !== 'playing') return;

  let lastTime = 0;
  let accumulatedTime = 0;
  let animFrameId: number;

  const GRAVITY_INTERVAL_MS = Math.max(100, 1000 - (level - 1) * 100); // speeds up per level

  const loop = (timestamp: number) => {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    accumulatedTime += delta;

    if (accumulatedTime >= GRAVITY_INTERVAL_MS) {
      dispatch({ type: 'TICK' });        // reducer applies gravity (MOVE_DOWN or lock+spawn)
      accumulatedTime -= GRAVITY_INTERVAL_MS;
    }

    animFrameId = requestAnimationFrame(loop);
  };

  animFrameId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(animFrameId);
}, [status, level, dispatch]);
```

**Key points:**
- The loop only dispatches `TICK`. All logic (move down, lock piece, clear lines, spawn next, check game-over) lives in the reducer responding to `TICK`.
- Gravity interval decreases as level increases (standard Tetris speed curve).
- Pause/resume is handled by changing `status` — the effect cleans up and re-runs.
- Input (keyboard) is handled separately in `useKeyboard(dispatch)` — it dispatches move/rotate/drop actions outside the loop, giving responsive controls independent of gravity.
- Hard drop: immediately move piece down until it locks, then trigger normal post-lock flow (clear lines, spawn).
- Lock delay (optional, for polish): a piece that touches the ground gets ~500ms before locking, reset by any successful rotation or horizontal move.

**Soft drop:** While the down arrow is held, gravity interval is shortened (e.g., 50ms), implemented by passing a `softDrop` flag into the loop interval calculation.

---

## Firebase Integration Points

### Auth Integration

| Event | Action |
|---|---|
| App mounts | Call `onAuthStateChanged`, update `AuthContext` |
| User clicks "Sign in with Google" | Call `signInWithPopup(googleProvider)` |
| Auth state resolves | Show/hide "Submit Score" button |
| User signs out | Clear local user state; no game state change |

Auth state does **not** affect the game engine. The game runs the same whether the user is signed in or not. Auth only gates leaderboard submission.

### Firestore Integration

| Event | Action |
|---|---|
| Game status transitions to `'gameover'` | If user is authenticated, call `useSubmitScore()` |
| `useSubmitScore()` | `addDoc(collection(db, 'scores'), { uid, displayName, score, level, linesCleared, createdAt: serverTimestamp() })` |
| Leaderboard screen mounts | `useLeaderboard()` subscribes via `onSnapshot` |
| Leaderboard screen unmounts | Unsubscribe (cleanup in `useEffect` return) |

**When to write:** Write exactly once, on game-over, after final score is computed. Do not write partial/in-progress scores.

**Security rules (Firestore):**
```
match /scores/{scoreId} {
  allow read: if true;                          // public leaderboard
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.uid  // own score only
    && request.resource.data.score is number;
  allow update, delete: if false;               // immutable
}
```

---

## Data Flow

```
Keyboard input
      |
      v
useKeyboard(dispatch)
      |
      | dispatch({ type: 'MOVE_LEFT' | 'ROTATE' | etc. })
      v
gameReducer(state, action)
      |
      |--- calls pure engine functions (movePiece, rotatePiece, etc.)
      |--- computes new board, piece, score, level, status
      |
      v
New GameState (immutable)
      |
      +---> <GameBoard />    (renders board cells)
      +---> <ActivePiece />  (renders piece + ghost)
      +---> <ScorePanel />   (renders score/level)
      +---> <NextPiece />    (renders queue)
      |
      | (when status === 'gameover')
      v
useSubmitScore()
      |
      | addDoc(db, 'scores', { ...finalScore })
      v
Firestore: scores collection
      |
      | onSnapshot (leaderboard listener)
      v
useLeaderboard() state
      |
      v
<LeaderboardTable />
```

Game state flows one direction: input -> reducer -> React render -> (on game-over) -> Firestore -> leaderboard UI. There is no back-channel from Firestore into game state.

---

## Suggested Build Order

Building in this order ensures every step produces a working, testable artifact.

### Phase 1 — Core Game Engine (no React, no Firebase)
- Define board data structure and piece definitions
- Implement all pure engine functions (move, rotate, lock, clear, score, spawn)
- Write unit tests for each function
- Implement bag randomizer (7-bag) for piece queue

**Deliverable:** A game engine you can drive from the browser console.

### Phase 2 — React Game Loop + Board Render
- Set up `useReducer` with `gameReducer` wiring all engine functions
- Implement `requestAnimationFrame` game loop in `useGameLoop`
- Render the board and active piece as a CSS grid or canvas
- Add keyboard controls via `useKeyboard`
- Add ghost piece (drop shadow)
- Add hold piece mechanic

**Deliverable:** A playable Tetris game in the browser with no auth or leaderboard.

### Phase 3 — Firebase Auth
- Initialize Firebase project (Auth + Firestore)
- Add `AuthProvider` with Google sign-in
- Add sign-in / sign-out UI button in header
- Gate "submit score" flow behind auth check

**Deliverable:** Users can sign in with Google.

### Phase 4 — Leaderboard (Firestore)
- Define Firestore schema and security rules
- Implement `useSubmitScore` — writes score on game-over
- Implement `useLeaderboard` — reads top 10 with `onSnapshot`
- Build `<LeaderboardTable />` component
- Add navigation between game and leaderboard views

**Deliverable:** Scores persist and are displayed publicly.

### Phase 5 — Polish
- Level system (gravity speeds up, level shown)
- Sound effects (Web Audio API or howler.js)
- Animations (line-clear flash, piece lock animation)
- Mobile touch controls
- Responsive layout
- Performance: memoize board rows (`React.memo`) to avoid full re-renders on every tick

---

## Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Build tool | Vite | Fast HMR, minimal config, first-class React support |
| Game state | `useReducer` + Context | All transitions in one reducer; no extra deps |
| Game loop | `requestAnimationFrame` | Native, precise, pauses when tab is hidden |
| Rendering | CSS Grid (div cells) | Simple to implement and style; canvas if performance issues emerge |
| Auth | Firebase Auth (Google provider) | Zero-backend auth, familiar OAuth flow |
| Persistence | Firebase Firestore | Real-time leaderboard with `onSnapshot`; free tier sufficient |
| Styling | CSS Modules or Tailwind | Either works; Tailwind speeds up layout work |
| TypeScript | Recommended | Board/piece types prevent a class of bugs |

---

## Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Game loop and React render coupling | Keep loop in a custom hook; reducer is pure — no side effects inside it |
| Score submitted multiple times on game-over | Use a `useRef` flag or check `status` transition (only dispatch once when entering `gameover`) |
| Firestore security: users submitting inflated scores | Server-side validation is not possible without Cloud Functions; accept as out-of-scope for MVP, add Cloud Function score validator in polish phase |
| Board re-renders on every tick | Memoize `<GameBoard />` rows; only changed cells re-render |
| Mobile performance | CSS Grid with fixed cell sizes; avoid layout thrashing |

---

## References

- [Tetris Guideline (official rules)](https://tetris.wiki/Tetris_Guideline) — rotation system, scoring, level speed
- [React `useReducer` docs](https://react.dev/reference/react/useReducer)
- [Firebase Auth — Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Firestore — Real-time updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [requestAnimationFrame MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
