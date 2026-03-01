# Pitfalls Research

**Domain:** Browser-based Tetris game — React + Vite + Firebase (Auth + Firestore) + CSS neon/glow aesthetic, desktop + mobile
**Researched:** 2026-03-01
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: React State as Game Loop Driver (Re-render Performance Collapse)

**What goes wrong:**
The game loop runs via `setInterval` or `requestAnimationFrame` and drives piece fall by calling `setState` every tick. At 60 fps or even 10 fps, React re-renders the entire board on each tick. At higher levels (faster fall speed) the render queue backs up, input lag appears, and the game stutters or freezes entirely. On mobile it becomes unplayable within a minute.

**Why it happens:**
React is a UI rendering library, not a game engine. Developers reach for `useState`/`setState` because that is how React works, without realizing that triggering dozens of state updates per second causes React to schedule and flush renders far more than necessary. The board is typically a 10×20 array, and re-creating it on every tick is expensive.

**How to avoid:**
Use `useRef` to hold the authoritative game state (board matrix, active piece, score) that the game loop reads and writes directly — no re-renders triggered by the loop itself. Drive the visual display from a separate rendering step: either a Canvas 2D context drawn directly from the ref, or a scheduled `setState` that fires only when visual state actually changes (e.g., a single `setRenderTick` counter increment, or selectively updating only changed display values). The game loop should never call `setState` inside the tight timing loop.

```
// Wrong — triggers re-render every tick
const [board, setBoard] = useState(emptyBoard());
useEffect(() => {
  const id = setInterval(() => setBoard(drop(board)), 50);
  return () => clearInterval(id);
}, [board]);

// Correct — ref holds truth, display read separately
const gameRef = useRef({ board: emptyBoard(), piece: null, ... });
const [displayScore, setDisplayScore] = useState(0);
useEffect(() => {
  const id = requestAnimationFrame(function loop(ts) {
    tick(gameRef.current, ts);          // mutates ref, draws canvas
    setDisplayScore(gameRef.current.score); // only re-renders score UI
    rafRef.current = requestAnimationFrame(loop);
  });
  return () => cancelAnimationFrame(id);
}, []);
```

**Warning signs:**
- Chrome DevTools Performance tab shows React renders > 30/second during normal play
- Frame time spikes visible in the rendering flame chart
- Piece movement is choppy or lags behind key presses on desktop
- Mobile Safari reports "Slow Script" warnings

**Phase to address:** Phase 1 (game engine foundation) — the architecture decision must be made before any state wiring begins.

---

### Pitfall 2: `setInterval` Drift in the Game Loop Instead of `requestAnimationFrame` with Timestamp Delta

**What goes wrong:**
Using `setInterval(tick, 50)` for piece gravity causes timing drift. Browser intervals are not guaranteed to fire at exact intervals — they slip by tens of milliseconds per fire, especially when the tab is backgrounded, the main thread is busy, or the device is under load. Over 30 seconds of play the board clock drifts visibly from wall time, causing pieces to fall faster or slower than intended and making the level speed curve feel wrong.

**Why it happens:**
`setInterval` is the obvious "repeat every N ms" primitive. Most tutorial-grade Tetris implementations use it because it is simple, and it works fine in toy demos that never run long enough to notice drift.

**How to avoid:**
Use `requestAnimationFrame` with an accumulated delta-time approach. Track `lastTimestamp`, accumulate `delta`, and only drop the piece when the accumulated delta exceeds the current level's gravity interval. This is frame-rate independent and drift-free.

```
function loop(timestamp) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  accumulated += delta;
  if (accumulated >= gravityInterval(level)) {
    accumulated -= gravityInterval(level);
    dropPiece();
  }
  render();
  rafId = requestAnimationFrame(loop);
}
```

Also call `document.addEventListener('visibilitychange', ...)` to pause the loop when the tab is hidden and reset `lastTimestamp` on resume to prevent a massive delta dump.

**Warning signs:**
- Pieces fall faster after switching tabs and coming back
- At level 15+ the fall speed feels erratic
- Console.log of tick times shows variance > ±20ms

**Phase to address:** Phase 1 (game engine foundation).

---

### Pitfall 3: Incorrect Rotation Algorithm — Missing Wall Kicks (SRS Not Implemented)

**What goes wrong:**
The naive rotation algorithm rotates the piece matrix and checks if it fits. If it doesn't fit (collision), the rotation is rejected entirely. This means pieces cannot rotate when they are flush against a wall or near the floor, which is wrong per standard Tetris behavior. Players find the game frustratingly broken when an I-piece cannot rotate near the right wall, or when an S/Z piece locks in an unintended orientation.

**Why it happens:**
The basic rotation check (rotate → collision test → reject if blocked) is described in most beginner tutorials. Wall kick offsets are a more advanced concept from the Tetris Guideline (Super Rotation System, SRS) that beginners don't know to look for.

**How to avoid:**
Implement the Super Rotation System (SRS) wall kick tables. For each rotation transition (0→R, R→2, 2→L, L→0 and back), maintain a list of offset tests. Try each offset in order; use the first one that does not collide. The official SRS offset tables for J, L, S, T, Z pieces are different from the I-piece offsets.

SRS offset tables (J/L/S/T/Z, clockwise transitions):
```
0→R: (0,0), (-1,0), (-1,+1), (0,-2), (-1,-2)
R→2: (0,0), (+1,0), (+1,-1), (0,+2), (+1,+2)
2→L: (0,0), (+1,0), (+1,+1), (0,-2), (+1,-2)
L→0: (0,0), (-1,0), (-1,-1), (0,+2), (-1,+2)
```

I-piece has its own separate offset table. O-piece never needs wall kicks.

**Warning signs:**
- Rotating an I-piece flush against the right wall does nothing (should wall kick left)
- T-spin detection is impossible without correct rotation (not in scope for v1, but still a sign)
- Playtesters complain that rotation feels wrong or broken

**Phase to address:** Phase 1 (game engine / piece mechanics).

---

### Pitfall 4: Collision Detection Off-by-One on Board Boundaries

**What goes wrong:**
Pieces clip through the floor or right wall by one cell, or pieces lock one row above where they visually appear to rest. Line-clear detection fires on the wrong row. These bugs are subtle and appear only with specific piece orientations or near-boundary positions.

**Why it happens:**
The board is typically addressed as `board[row][col]` with row 0 at the top. Coordinate systems get mixed: some code uses `(x, y)` with y increasing downward, other code uses `(row, col)`. The active piece position is often stored as top-left of its bounding box, but some piece rotations have empty top rows that must be accounted for in spawn position and floor detection.

**How to avoid:**
- Pick one coordinate convention (`row` increases downward, `col` increases rightward) and enforce it everywhere with no aliasing.
- The collision function must check: `col < 0`, `col >= BOARD_WIDTH`, `row >= BOARD_HEIGHT`, and `board[row][col] !== 0` — all four conditions.
- Write unit tests for collision detection covering: left wall, right wall, floor, other pieces, and spawn position for each of the 7 tetrominoes in all 4 rotations.
- Test the I-piece horizontal specifically — it is the widest and most likely to expose off-by-one boundary bugs.

**Warning signs:**
- A piece "sticks out" one column past the visible board edge
- Pieces lock in mid-air one row above the stack
- Line-clear fires on a row that is not fully filled

**Phase to address:** Phase 1 (game engine) — add unit tests before building UI.

---

### Pitfall 5: Firestore Security Rules That Are Too Open (Leaderboard Score Manipulation)

**What goes wrong:**
With permissive rules like `allow write: if request.auth != null`, any authenticated user can write any score — including 9,999,999 — directly via the Firestore SDK or a simple `fetch` call to the REST API. The leaderboard immediately fills with fake scores. There is no server-side validation of score legitimacy.

**Why it happens:**
Firebase security rules are easy to get wrong. The default "if authenticated" rule feels correct because you want logged-in users to submit scores. Developers forget that rules are the only server-side enforcement — there is no backend to validate scores.

**How to avoid:**
Layer defenses:

1. **Schema validation in rules:** Enforce that `score` is a number, `uid` matches the authenticated user, `displayName` is a string under 50 chars, `timestamp` is `request.time`.
```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.uid
        && request.resource.data.score is int
        && request.resource.data.score >= 0
        && request.resource.data.score <= 999999  // realistic cap
        && request.resource.data.displayName is string
        && request.resource.data.displayName.size() <= 50
        && request.resource.data.timestamp == request.time;
      allow update, delete: if false; // scores are immutable once written
    }
  }
}
```

2. **Score cap:** Choose a realistic max score for v1 (e.g., 999,999) and enforce it in both client and rules.

3. **Rate limiting via Cloud Functions (optional for v1):** Move score submission to a Cloud Function that can apply additional heuristics (time-played validation, session token checks).

4. **Never allow `update` or `delete` on score documents** — scores are write-once.

**Warning signs:**
- Firestore rules emulator shows rules passing for a score document where `uid != auth.uid`
- No `score` type check in rules
- The rules test suite (if any) does not test unauthenticated writes

**Phase to address:** Phase 3 (Firebase / leaderboard integration) — rules must be written and tested before the leaderboard goes live.

---

### Pitfall 6: Firestore Leaderboard Query Costs and Missing Index

**What goes wrong:**
The leaderboard query `collection('scores').orderBy('score', 'desc').limit(10)` works fine in development. In production with thousands of score documents, Firestore requires a composite index for this query. Without it, the query fails silently or returns an error that is swallowed. Additionally, every score submission creates a new document — with 10k users playing multiple games, the collection grows unbounded, making page loads slower and Firestore read costs non-trivial.

**Why it happens:**
Firestore's query model is not obvious. Single-field orderBy queries use automatic indexes, but if you add any filter (e.g., `where('level', '>=', 5).orderBy('score', 'desc')`) a composite index is required. Developers discover this in production when users report a broken leaderboard.

**How to avoid:**
- Design the leaderboard to store only the **top score per user**, not every game. This caps the collection at one document per user. Use `setDoc` with merge, or check-and-update in a transaction: only write if `newScore > existingScore`.
- Test the query in the Firestore emulator under the `firebase emulators:start` environment.
- For the simple `orderBy('score', 'desc').limit(10)` query, Firestore creates the single-field index automatically — verify this in Firebase Console before launch.
- Consider a separate `leaderboard` collection with only the top 100 records, maintained via a Cloud Function trigger on score writes.

**Warning signs:**
- Firestore Console shows "Missing index" errors in the query log
- Leaderboard shows stale or empty results after the first few writes
- Firestore document count in the scores collection is growing linearly with games played (not capped per user)

**Phase to address:** Phase 3 (Firebase / leaderboard integration).

---

### Pitfall 7: CSS `box-shadow` / `filter: blur()` Glow on Every Board Cell Causes Paint Storms

**What goes wrong:**
Each tetromino cell on the board gets a CSS glow via `box-shadow: 0 0 10px #color, 0 0 20px #color` or `filter: drop-shadow(...)`. With a 10×20 board that is up to 200 cells. Each frame during piece movement, the browser must repaint every glowing cell. On mobile (especially mid-range Android) this causes sustained paint times of 16–32ms per frame, dropping the game to 30fps or below. The neon aesthetic defeats itself by making the game unplayable on the devices that most need it.

**Why it happens:**
CSS `box-shadow` and `filter: blur()` are expensive to paint because they cannot be composited on the GPU without promotion to a separate layer. On a DOM-based board, every cell is a separate element, and glow on each one means hundreds of expensive paint operations per frame.

**How to avoid:**

Option A (preferred for this project): **Render the board on a Canvas element.** Draw glow programmatically using Canvas 2D `shadowBlur` and `shadowColor`. Canvas rendering happens entirely outside React's reconciliation, eliminating paint storms. A single Canvas element composited on the GPU layer performs dramatically better than 200 DOM elements with box-shadow.

Option B (if sticking with DOM): **Reduce glow scope.** Apply glow only to the active falling piece (4 cells max), not to the locked board cells. Locked cells use a flat fill with just a border, no shadow. This reduces live glow from up to 200 elements to 4.

Option C: **Use `will-change: transform` on glowing elements** to promote them to GPU layers, but be cautious — promoting all 200 cells simultaneously exhausts GPU memory on mobile.

Additional best practice: Use a single `filter: drop-shadow()` on a container SVG or Canvas rather than per-cell shadows.

**Warning signs:**
- Chrome DevTools Paint Flashing shows the entire board flashing green on every tick
- Layers panel shows 200+ layers promoted
- Firefox "Stencil Buffer" warnings in about:performance
- Frame rate on mid-range mobile (e.g., Android with Mali GPU) below 40fps during normal play

**Phase to address:** Phase 1 (choose Canvas vs DOM rendering) — this decision is architectural and must be made before building the board renderer. Phase 2 (visual polish) should validate performance on a real mobile device before shipping.

---

### Pitfall 8: Mobile Touch Controls Conflicting With Browser Scroll and Gesture Navigation

**What goes wrong:**
The game's touch controls (swipe left/right to move, swipe down to soft drop, tap to rotate) conflict with the browser's built-in touch handling: vertical swipe scrolls the page, horizontal swipe triggers back/forward navigation on iOS Safari, and the address bar appears/disappears during play, causing layout shifts that resize the game canvas mid-game.

**Why it happens:**
Touch events on mobile browsers have default behaviors (scroll, navigation) that must be explicitly suppressed. Developers add `touchstart`/`touchmove` listeners but forget to call `e.preventDefault()`, or call it only sometimes, or call it on the wrong element. iOS Safari requires `passive: false` to allow `preventDefault` on touch events.

**How to avoid:**
- Call `e.preventDefault()` on `touchstart` and `touchmove` for the game canvas/container. Register the listener as non-passive: `element.addEventListener('touchmove', handler, { passive: false })`.
- Add to the game container's CSS: `touch-action: none` — this tells the browser not to handle any touch gestures on that element, with no JS required for the most common cases.
- Use `position: fixed` or `height: 100dvh` (dynamic viewport height) for the game wrapper to prevent address-bar-induced layout shifts.
- Add `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` to prevent pinch-zoom during play.
- Handle the gesture disambiguation explicitly: track `touchstart` coordinates, compute delta on `touchmove`, and decide move/drop/rotate only on `touchend` (or after a threshold distance) to avoid misfires.

**Warning signs:**
- Swiping left on the game board triggers Safari's "back" navigation
- The page scrolls when the player tries to move a piece down
- The canvas/game area resizes when the iOS address bar collapses
- `touchmove` events are firing but `preventDefault` has no effect (passive listener)

**Phase to address:** Phase 2 (UI + mobile controls) — design touch handling from the start, not as a retrofit.

---

### Pitfall 9: Spawning New Pieces in an Already-Occupied Space (Game Over Detection Bug)

**What goes wrong:**
Game over is detected too late or not at all. A new piece spawns, overlaps existing locked cells, and the game continues rendering an impossible board state — pieces overlap, clipping through each other. In some implementations the game never ends; in others it crashes with a null reference when the active piece tries to move into an occupied cell.

**Why it happens:**
The spawn position (row 0 or row -1 for the hidden zone above the board) is checked against the board state after the piece is placed, not before. Or the check exists but uses the wrong coordinate system (off by one on the spawn row). Game over should be: "attempted to spawn a new piece and the spawn position is already occupied."

**How to avoid:**
- After locking a piece and clearing lines, immediately attempt to spawn the next piece.
- Run a collision check at the spawn position before placing the piece.
- If collision is detected at spawn: trigger game over, stop the loop, show the game-over screen.
- The standard spawn row for most pieces is row 0 (or row 19 of a 20-row visible board — whichever the implementation uses for the top). I-pieces and O-pieces often spawn at row -1 (one above the visible board).

**Warning signs:**
- Two pieces visually overlap on the board
- After a very tall stack, the game loop continues instead of ending
- Score keeps incrementing after the stack has reached the top

**Phase to address:** Phase 1 (game engine / game-over logic).

---

### Pitfall 10: Firebase Auth State Race — Leaderboard Written Before Auth is Ready

**What goes wrong:**
The game ends, the score submission fires immediately, but `firebase.auth().currentUser` is `null` because the Firebase Auth SDK has not yet completed its async initialization. The Firestore write fails silently (or throws, which is uncaught), and the score is lost. The player sees no confirmation and their score never appears on the leaderboard.

**Why it happens:**
Firebase Auth initialization is asynchronous. `onAuthStateChanged` fires once on startup with the persisted auth state, but there is a brief window between app load and that first callback where `currentUser` is null even for a logged-in user. Code that accesses `currentUser` synchronously at game-over time may hit this window.

**How to avoid:**
- Never use `auth.currentUser` synchronously outside of an `onAuthStateChanged` callback.
- Store the current user in React state via `onAuthStateChanged`, and use that stored reference at score-submission time.
- Before submitting a score, check if the stored user is non-null. If null, offer the player a login prompt before their score is lost.
- Use the Firebase `authStateReady()` promise (available in Firebase JS SDK v9.22+) to await auth initialization on app mount.

```javascript
// In your auth context provider:
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);   // store in context state
    setAuthLoading(false);
  });
  return unsubscribe;
}, []);
```

**Warning signs:**
- Score submission works after a full page reload but fails immediately after login
- `console.log(auth.currentUser)` prints null during the first second of app load
- Firestore write errors appear in the console only on the first game after login

**Phase to address:** Phase 3 (Firebase / auth integration).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use `useState` for all game state including board matrix | Fast to implement, familiar React pattern | Frame drops, input lag, unplayable at higher levels | Never — establish `useRef`-based game state in Phase 1 |
| Skip SRS wall kicks, use simple rotation rejection | Simpler code, faster to ship | Game feels broken to experienced players; rotation near walls fails | Never for a public game |
| Write all scores as new documents (no per-user dedup) | One-line Firestore write | Unbounded collection growth, Firestore read cost, easy score manipulation by spamming low scores | Only in a private dev/demo environment |
| Use permissive Firestore rules (`allow write: if request.auth != null`) during development | No friction while building | Any authenticated user can write any score; leaderboard is trivially exploitable | Only locally with the emulator, never deployed |
| Apply CSS glow to all board cell DOM elements | Simple CSS, visually correct | Paint storms on mobile, 20-30fps gameplay | Only for desktop-only demos, never if mobile support is required |
| `setInterval` instead of `requestAnimationFrame` | Simple, works at low tick rates | Timing drift at higher levels, tab-switch bugs, input lag | Acceptable only for very early prototyping, replace before alpha |
| No `touch-action: none` on the game container | No explicit touch config needed | Page scrolls during play, iOS back-navigation fires mid-game | Never if mobile is a requirement |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firebase Auth + React | Reading `auth.currentUser` synchronously at app startup before `onAuthStateChanged` fires | Store user in state via `onAuthStateChanged`, gate all auth-dependent actions on that state being loaded |
| Firestore + leaderboard | Writing a new document per game, no per-user high-score dedup | Use `setDoc` with merge on a user-keyed document to store only the personal best; query that collection for the leaderboard |
| Firestore security rules | Testing rules only via the Firebase Console "Rules Playground" and not with automated tests | Use `@firebase/rules-unit-testing` with the local emulator to write pass/fail tests covering all access patterns |
| Firebase Emulator Suite | Forgetting to point the app at the emulator in development | Set `connectFirestoreEmulator(db, 'localhost', 8080)` and `connectAuthEmulator(auth, 'http://localhost:9099')` behind a dev-only env flag |
| Vite + Firebase | Bundling the entire Firebase SDK instead of the modular v9+ API | Import only what you use (`import { getFirestore } from 'firebase/firestore'`) — the modular API tree-shakes to ~30KB vs ~200KB for compat mode |
| Vercel/Netlify + Vite | Committing Firebase config (API key etc.) to the repo in plaintext | Use Vite `import.meta.env.VITE_*` environment variables, set secrets in Vercel/Netlify dashboard, never in the repository |
| Canvas 2D + React | Creating a new Canvas context on every render | Store the canvas context in a `useRef`, initialize once in a `useEffect` with an empty dependency array |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| DOM-based board with per-cell CSS glow | Paint time > 10ms/frame, jank on mobile, low fps in DevTools | Use Canvas rendering; or limit glow to the active piece only | Any mid-range Android or iPhone below XS; also noticeable on desktop at level 15+ |
| Re-rendering the entire board React tree on every tick | React profiler shows 60 renders/second, main thread blocked | Use `useRef` for game state, draw on Canvas, only update display-only React state (score, level) | Immediately at game start on any device |
| Leaderboard queried on every render without caching | Excessive Firestore reads, billing accumulates, perceived lag | Query once on mount, use a Firestore `onSnapshot` listener (real-time) or cache result in state with a TTL | At ~50 simultaneous users, Firestore free tier read limits hit |
| Importing Firebase full compat bundle | 200KB+ JS bundle, slow TTI on mobile | Use Firebase v9+ modular API with named imports | At any scale — it's a day-one problem |
| Calculating piece ghost (shadow) position on every render in JS | CPU spike before each render when ghost position recalculates | Cache ghost position in the game ref, recalculate only when piece moves horizontally or board changes | At level 10+ when pieces fall fast and renders are frequent |
| Canvas redrawn fully every frame even when nothing changed | Unnecessary GPU work, battery drain on mobile | Track a dirty flag; skip Canvas redraw if game state has not changed since last frame | Continuous at 60fps even on idle — wastes battery |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Firestore rule `allow write: if request.auth != null` on scores collection | Any authenticated user submits arbitrary scores; leaderboard permanently corrupted | Add schema validation (score type, range, uid match), use `allow create` (not update), block delete |
| No score cap in Firestore rules | Integer overflow-style exploits (`score: 99999999`) trivially dominate the leaderboard | Set a maximum score in rules: `request.resource.data.score <= 999999` |
| Allowing `update` and `delete` on score documents | Players delete competitors' scores or update their own score retroactively | Score documents must be write-once: `allow update, delete: if false` |
| Storing the Firebase service account key in the client bundle | Full admin access to all Firebase resources exposed to anyone with DevTools | Service account keys are server-only. Client apps use the public Firebase config (API key + project ID) which is safe to expose — the security is in Firestore rules |
| No Firebase App Check | Automated bots submit scores via the REST API bypassing any client-side logic | Enable Firebase App Check with the reCAPTCHA v3 provider for production to verify requests come from the real app |
| Exposing user emails on the leaderboard | PII leak — user emails visible to all readers | Store only `displayName` (from Google profile) on the score document, never `email` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual or audio feedback on line clear | Players miss that lines were cleared; game feels unresponsive | Flash cleared rows white/bright before removing them (100–150ms animation), play a sound effect |
| No ghost piece (piece shadow showing drop position) | Players cannot predict where the piece will land; game feels unfair and hard | Render the ghost piece as a faint outline at the lowest valid position below the active piece |
| Mobile touch controls using swipe gesture with no threshold | Accidental micro-swipes move pieces unintentionally | Require minimum swipe distance (e.g., 10px) before committing to a move direction |
| No "pause" functionality | Phone call, notification, or interruption locks the player into losing | Implement pause on `visibilitychange` event (page hidden) and explicit pause button |
| Score submitted instantly after game over before player sees final score | Player is confused — they lose focus reading the final score while submission happens | Show game-over screen first, then submit score in the background; show confirmation when saved |
| Leaderboard shows raw Firebase UIDs or empty display names | Players see "undefined" or long UID strings on the leaderboard | Fall back to "Anonymous Player" if displayName is null; validate on write |
| No level progression feedback | Players don't know they leveled up; progression feels invisible | Show a "Level Up!" notification when level increases, change background color hue slightly per level |

---

## "Looks Done But Isn't" Checklist

- [ ] **Game loop:** Verify the loop uses `requestAnimationFrame` with delta-time accumulation — not `setInterval`. Check that tab-hide/show resets the timestamp correctly.
- [ ] **Rotation:** Test the I-piece against the right wall in horizontal orientation — it should wall-kick left. Test the T-piece in a tight corner — it should floor-kick. If either fails, SRS is not implemented.
- [ ] **Collision detection:** Test a piece positioned at column 9 (rightmost) — it must not be able to move right. Test a piece on row 19 (bottom) — it must lock and not fall through.
- [ ] **Line clear:** Fill exactly one row, verify it clears. Fill two rows simultaneously, verify both clear at once. Fill a row with a gap, verify it does NOT clear.
- [ ] **Scoring:** Verify that clearing 4 lines simultaneously (Tetris) awards more than 4× single-line score per the standard scoring table.
- [ ] **Game over:** Stack pieces to the top — the game must stop and show the game-over screen. The loop must not continue. The score must not increment further.
- [ ] **Firebase security rules:** Run the rules unit test suite covering: anonymous write (must fail), authenticated write with wrong uid (must fail), authenticated write with score > cap (must fail), authenticated write with correct data (must pass), read by anyone (must pass).
- [ ] **Leaderboard dedup:** Play two games with the same account — only the higher score should appear on the leaderboard, not two entries.
- [ ] **Mobile touch:** Open on iOS Safari — swipe left on the game area and confirm the browser does NOT navigate back. Swipe down on the game area and confirm the page does NOT scroll.
- [ ] **Auth state:** Log in, hard-refresh the page, play a game and submit the score — confirm the score is attributed to the correct user without requiring a second login.
- [ ] **Environment variables:** Confirm `VITE_FIREBASE_API_KEY` and related vars are set in Vercel/Netlify dashboard and not committed to the repository. Check `.gitignore` includes `.env.local`.
- [ ] **Performance on mobile:** Open Chrome on a mid-range Android device. Enable DevTools remote debugging. Confirm frame rate stays above 55fps during normal play with glow effects active.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| React state driving game loop (performance collapse) | HIGH | Refactor game state to `useRef`, decouple render from game tick, switch to Canvas or targeted setState — this touches the core game engine and affects all dependent code |
| `setInterval` drift | LOW | Replace with `requestAnimationFrame` + delta accumulation; the change is localized to the loop function |
| Missing wall kicks | MEDIUM | Implement SRS offset tables and retrofit the rotation function; regression test all 7 pieces × 4 rotations × near-wall positions |
| Open Firestore rules in production | CRITICAL — IMMEDIATE | Update and deploy new security rules immediately (Firestore Console → Rules tab, no deploy needed for rules); audit existing score data and purge anomalous entries |
| CSS glow paint storm discovered after DOM architecture chosen | HIGH | If already DOM-based, migrate renderer to Canvas; this is a full renderer rewrite. Alternatively, strip glow from locked cells as a stopgap |
| Touch events conflicting with scroll | MEDIUM | Add `touch-action: none` to game container CSS (often sufficient), add `{ passive: false }` to event listeners, and call `e.preventDefault()` |
| Auth race losing scores | LOW–MEDIUM | Implement `onAuthStateChanged`-based auth state, hold pending score in local state, submit after auth is confirmed |
| Leaderboard filled with fake scores | HIGH | Deploy tightened Firestore rules, write a one-time Cloud Function to delete documents where `score > cap` or `uid` mismatch, then rebuild leaderboard from clean data |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| React state as game loop driver | Phase 1: Game engine architecture decision | React DevTools profiler shows ≤ 5 re-renders/second during active gameplay |
| `setInterval` drift | Phase 1: Game loop implementation | Measure actual tick times with `performance.now()` — variance < 5ms per tick |
| Missing SRS wall kicks | Phase 1: Piece rotation system | Manual test: I-piece against right wall rotates successfully; T-piece floor-kick works |
| Collision detection off-by-one | Phase 1: Collision engine + unit tests | Unit test suite passes for all pieces × all rotations × boundary positions |
| Game over detection bug | Phase 1: Game state machine | Stacking to the ceiling always triggers game over within one piece |
| Firebase Auth race | Phase 3: Auth integration | Hard-refresh test: score submitted on first game after reload is correctly attributed |
| Firestore open security rules | Phase 3: Firebase setup | Rules unit tests pass; unauthenticated and uid-mismatch writes are rejected |
| Firestore leaderboard unbounded growth | Phase 3: Leaderboard data model | Verify only one document per user exists after three games; query uses correct index |
| CSS glow paint storms | Phase 1 (architecture): Canvas vs DOM decision; Phase 2 (validation): mobile perf test | Chrome DevTools on mobile shows > 55fps sustained during play |
| Touch event / scroll conflicts | Phase 2: Mobile UI implementation | iOS Safari test: swipe gesture on game area does not trigger navigation or scroll |
| Firebase App Check (score bot protection) | Phase 3 (optional for v1) or post-launch | Firebase Console shows App Check enforcement enabled |

---

## Sources

- Tetris Guideline (The Tetris Company) — official SRS rotation and wall kick specification
- MDN Web Docs: `requestAnimationFrame` and game loop timing patterns
- Firebase documentation: Firestore Security Rules reference, `onAuthStateChanged` lifecycle, `authStateReady()`
- Firebase documentation: App Check with reCAPTCHA v3
- Google Chrome DevTools: Performance panel, Layers panel, Paint Flashing tool
- CSS `touch-action` property — MDN Web Docs, W3C Pointer Events specification
- Community post-mortem: "Why Your Tetris Clone Sucks" (HN discussion threads on common Tetris bugs)
- Known issues: iOS Safari passive event listener requirement (`{ passive: false }` for touchmove preventDefault)
- Firestore pricing model: read/write costs, free tier limits (50K reads/day, 20K writes/day)
- React documentation: useRef for mutable values that should not trigger re-renders

---
*Pitfalls research for: Browser-based Tetris — React + Vite + Firebase + CSS neon/glow, desktop + mobile*
*Researched: 2026-03-01*
