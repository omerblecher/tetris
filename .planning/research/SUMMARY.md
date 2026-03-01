# Project Research Summary

**Project:** Browser-Based Tetris with Neon/Glow Aesthetic
**Domain:** Browser game — React + Firebase, desktop + mobile
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

This is a well-understood product domain with mature tooling and documented pitfalls. A browser Tetris game in 2026 is best built with React 19 + Vite 6 + TypeScript 5 for the shell, the Canvas 2D API for the game board renderer, and Firebase (Auth + Firestore) for identity and leaderboard. The architecture separates cleanly into four independent layers — pure game engine, React UI, Firebase Auth, and Firestore leaderboard — each of which can be built and tested in isolation. The critical architectural decision is made at day one: game state must live in `useRef`, not `useState`, and the board must render on Canvas, not the DOM. Both are non-negotiable for acceptable performance on mobile.

The recommended build order mirrors the dependency graph. The game engine (pure functions, no React, no Firebase) comes first and is testable from the browser console before any UI exists. React wiring and the game loop come second, producing a fully playable local game. Firebase Auth comes third, followed by Firestore leaderboard. Polish — animations, mobile controls, responsive layout — is the final layer applied to a working game. This sequence means every phase delivers a working, testable artifact rather than accumulated untested pieces.

The most dangerous pitfalls are architectural, not implementation-level. Choosing the wrong rendering approach (DOM cells with CSS glow on every cell) or the wrong game state strategy (React state as the game loop driver) causes performance failures that are expensive to fix retroactively. These decisions must be locked in before Phase 1 is complete. Firebase security rules for the leaderboard must also be hardened before the app goes public — permissive rules lead to immediate leaderboard corruption that is difficult to undo.

---

## Key Findings

### Recommended Stack

The stack is lean and dependency-minimal by design. Vite 6 is the build tool (CRA is dead, Next.js adds SSR complexity with no benefit for a client-side game). React 19 + TypeScript 5 provide the shell — TypeScript is not optional here given the non-trivial type surface of board cells, piece rotation matrices, Firestore document shapes, and score records. The Canvas 2D API handles the game board renderer — no game framework (Phaser, PixiJS, react-konva) is warranted for a game whose rendering needs are trivially met by native Canvas. Firebase SDK v11 (modular, tree-shaken) covers auth and leaderboard. All touch/gesture handling uses the native Pointer Events API — no gesture library needed for four gestures.

The CSS stack is intentionally thin: CSS custom properties and plain CSS for the neon aesthetic, no CSS-in-JS, no Tailwind. This choice is especially important because CSS-in-JS runtime overhead fights the neon aesthetic's heavy use of `box-shadow` and `filter`, and Tailwind's utility classes conflict with the custom neon design system.

**Core technologies:**
- **Vite 6 + React 19 + TypeScript 5:** App shell and component layer — fastest dev experience, best TypeScript inference for game types
- **Canvas 2D API:** Game board renderer — 60fps redraws with per-piece `shadowBlur` glow, no DOM reconciler overhead
- **`requestAnimationFrame` + delta-time loop:** Game loop — drift-free, pauses on tab hide, frame-rate independent
- **`useReducer` + React Context:** Game state — all transitions in one auditable reducer, no external state library needed
- **Firebase Auth (Google provider):** Authentication — zero-backend identity, familiar OAuth flow
- **Cloud Firestore (modular v11):** Leaderboard persistence — `onSnapshot` for real-time updates, free tier sufficient for this scale
- **CSS custom properties + `box-shadow` + Canvas `shadowBlur`:** Neon/glow aesthetic — native browser APIs, no library overhead
- **Pointer Events API:** Mobile touch controls — unifies mouse/touch/stylus, no library needed for four gestures
- **Vercel:** Hosting — static `dist/` output from Vite, no server configuration needed

### Expected Features

The feature set is well-researched against the Tetris Guideline and competitor analysis (Jstris, Tetr.io). All 15 table-stakes features are P1 for launch. The differentiators that provide meaningful competitive advantage without multiplying complexity are: the neon/glow aesthetic (the game's identity), Google login + global leaderboard (the social hook), hold piece, 3-piece next preview, and responsive mobile layout with virtual controls. Multiplayer, sound, custom themes, and PWA/offline are explicitly deferred — each adds disproportionate complexity relative to its value.

**Must have (table stakes):**
- All 7 tetrominoes with SRS rotation (Super Rotation System, including wall kicks) — non-negotiable
- Auto-drop, soft drop, hard drop — complete movement system
- Line clearing with standard Tetris scoring (100/300/500/800 for 1/2/3/4 lines × level)
- Level progression — gravity speeds up every 10 lines
- Ghost piece (drop shadow) — modern standard, dramatically improves UX
- Next piece preview (3 pieces)
- Hold piece
- Keyboard controls (desktop) + touch/swipe controls (mobile)
- Pause / resume
- Game over state + restart

**Should have (differentiators):**
- Neon/glow CSS + Canvas aesthetic — the game's visual identity
- Google login — required for leaderboard attribution
- Global top-10 leaderboard via Firestore — core replay motivation
- Personal best tracking per user
- Responsive layout with on-screen virtual gamepad for mobile
- Line-clear and level-up animations (v1.x, after core loop is stable)
- Combo scoring bonus (v1.x)

**Defer (v2+):**
- Sound effects / music — browser autoplay restrictions, mobile audio context issues
- Background ambient particle effects — performance risk on mobile
- Leaderboard time filtering (weekly/monthly) — only valuable once leaderboard is populated
- Multiplayer — separate product decision, 10x complexity

### Architecture Approach

The architecture is a strict four-layer separation: (1) a pure game engine with no React or Firebase dependencies, implemented as pure functions called from a `useReducer`; (2) a React UI layer that only dispatches actions and renders state; (3) a thin Firebase Auth layer providing user identity via `onAuthStateChanged`; and (4) a Firestore leaderboard layer that reads/writes scores only at game-over. Data flows in one direction: input → reducer → React render → (on game-over) → Firestore → leaderboard UI. There is no back-channel from Firestore into game state.

**Major components:**
1. **Game Engine (`src/game/`)** — Pure functions: `rotatePiece`, `movePiece`, `lockPiece`, `clearLines`, `spawnPiece`, `isGameOver`, `computeScore`. Testable without browser or React.
2. **`gameReducer` + `useGameLoop`** — Bridges the engine to React. Reducer handles all `GameAction` types (`TICK`, `MOVE_LEFT`, `ROTATE`, `HARD_DROP`, `PAUSE`, `RESET`, `GAME_OVER`). Loop dispatches `TICK` on the gravity interval; keyboard/touch input dispatches move actions independently of the loop.
3. **`<GameCanvas />`** — Holds the `<canvas>` ref, runs the Canvas 2D draw function each frame from a `useRef` game state, applies `shadowBlur`/`shadowColor` for per-piece neon glow.
4. **`AuthProvider` / `useAuth`** — Wraps `onAuthStateChanged`, exposes `{ user, loading, signIn, signOut }` via context. Auth is optional for playing; required only for score submission.
5. **`useLeaderboard` / `useSubmitScore`** — Firestore integration. `onSnapshot` for real-time leaderboard reads. Score writes are write-once, deduplicated per user (personal best only), with security rules enforcing schema and uid match.

### Critical Pitfalls

**Top 5 — all are either phase-blocking or architecturally irreversible:**

1. **React state as game loop driver** — Calling `setState` inside the tight game loop causes React to schedule 60 re-renders/second. Performance collapses at higher levels, especially on mobile. Prevention: hold game state in `useRef`, draw to Canvas imperatively, only update React state for score/level display changes. Decision must be made in Phase 1 before any state wiring begins; refactoring after the fact is high-cost.

2. **`setInterval` instead of `requestAnimationFrame` with delta-time** — `setInterval` drifts by tens of milliseconds per tick, causing erratic piece fall speeds at higher levels and bugs when switching tabs. Prevention: use `rAF` + accumulated delta-time for the game loop from day one. Also handle `visibilitychange` to pause/reset on tab hide.

3. **Missing SRS wall kicks in rotation** — The naive rotation algorithm (rotate matrix → reject if collision) makes the game feel broken to any experienced Tetris player — pieces cannot rotate near walls or the floor. Prevention: implement the full Super Rotation System offset tables (different tables for JLSTZ vs. I-piece). Must be built with the engine in Phase 1, not retrofitted.

4. **DOM board cells with per-cell CSS `box-shadow` glow** — Applying `box-shadow` to all 200 board cells causes paint storms. Mid-range Android devices drop below 40fps immediately. Prevention: render the board on a Canvas element, use Canvas `shadowBlur` for per-piece glow. This is an architectural decision locked in Phase 1 — migrating a DOM-based renderer to Canvas is a full rewrite.

5. **Permissive Firestore security rules** — `allow write: if request.auth != null` lets any authenticated user submit any score, immediately corrupting the leaderboard. Prevention: enforce schema in rules (score type, score cap ≤ 999,999, uid match, write-once immutability). Rules must be hardened and unit-tested before the leaderboard goes live (Phase 3). Fixing a corrupted leaderboard requires a one-time Cloud Function purge — high recovery cost.

---

## Implications for Roadmap

Based on the dependency graph, architecture constraints, and pitfall prevention requirements, four phases are the correct structure. The build order from ARCHITECTURE.md is validated by PITFALLS.md: every critical pitfall that is "never acceptable" is addressable only in Phase 1 (game engine architecture). Deferring architectural decisions to later phases means high-cost retrofits.

### Phase 1: Core Game Engine

**Rationale:** All critical pitfalls (React state as game loop driver, `setInterval` drift, missing SRS wall kicks, CSS glow paint storms, collision off-by-ones, game over detection bugs) are Phase 1 concerns. The engine must be correct and the rendering architecture must be decided before any UI is wired up. Getting this wrong means rewrites, not patches.

**Delivers:** A pure TypeScript game engine (board, pieces, collision, rotation with SRS, line clearing, scoring, game-over detection) driveable from the browser console. The Canvas-vs-DOM rendering decision is locked. A `requestAnimationFrame` + delta-time game loop hook is implemented.

**Addresses from FEATURES.md:** All 7 tetrominoes with SRS rotation, auto-drop/soft-drop/hard-drop mechanics, line clearing, level progression, scoring formula, game over state.

**Locks in:** Canvas rendering approach (prevents DOM paint storm pitfall), `useRef`-based game state (prevents React re-render performance collapse), `rAF` + delta-time (prevents `setInterval` drift), SRS wall kicks (prevents rotation feel complaint).

**Research flag:** Standard patterns — well-documented SRS spec from Tetris Guideline, established Canvas 2D API. No additional research needed.

---

### Phase 2: React Game Loop + Board Rendering

**Rationale:** Once the engine is pure and correct, wiring it to React is mechanical. The `useReducer` + `GameContext` structure is established, the Canvas renderer is built, and all gameplay mechanics (ghost piece, hold piece, next preview, keyboard controls) are implemented. This phase produces a fully playable Tetris game with no backend — a standalone deliverable that can be tested end-to-end before any Firebase work begins.

**Delivers:** A playable Tetris game in the browser. Neon/glow aesthetic on Canvas with `shadowBlur`. Keyboard controls. Ghost piece. Hold piece. 3-piece next preview. Score/level display. Game over and restart flow.

**Addresses from FEATURES.md:** Ghost piece, hold piece, next piece preview, keyboard controls, neon/glow aesthetic, score display, pause/resume, restart.

**Avoids from PITFALLS.md:** Mobile touch conflict (design touch handling from scratch, not as a retrofit). Board re-render on every tick (memoize `<ScorePanel>` etc., Canvas handles board independently).

**Uses from STACK.md:** Canvas 2D API, `useReducer` + Context, CSS custom properties for neon variables, Pointer Events API for touch.

**Research flag:** Standard patterns — React `useReducer` and Canvas 2D are well-documented. Mobile touch handling (`touch-action: none`, `{ passive: false }`, `100dvh`) has documented patterns in MDN. No additional research needed.

---

### Phase 3: Firebase Integration (Auth + Leaderboard)

**Rationale:** Auth and leaderboard are dependencies of each other (leaderboard needs user identity) but have no dependency on the game engine beyond receiving the final score. Building them after a working game ensures the integration is additive, not intertwined with core game logic. Firestore security rules must be written and tested in this phase before any data is written.

**Delivers:** Google Sign-In via Firebase Auth. Score submission to Firestore on game over (personal best dedup — one document per user). Global top-10 leaderboard with `onSnapshot` real-time updates. Personal best display per user.

**Addresses from FEATURES.md:** Google login, global leaderboard, personal best tracking, score submission prompt at game over.

**Avoids from PITFALLS.md:** Firebase Auth race condition (use `onAuthStateChanged`-stored user reference, never `auth.currentUser` synchronously). Permissive Firestore rules (enforce schema, score cap, uid match, write-once). Unbounded leaderboard collection growth (one document per user via personal-best dedup with `setDoc` + merge or transaction).

**Uses from STACK.md:** Firebase SDK v11 modular (`getAuth`, `getFirestore`, tree-shaken imports), `signInWithPopup` with Google provider, `onSnapshot` for real-time leaderboard.

**Research flag:** Firebase Auth and Firestore patterns are well-documented. Firestore security rules unit testing with `@firebase/rules-unit-testing` is the one area worth a focused implementation check — ensure the rules test harness is set up correctly against the emulator.

---

### Phase 4: Polish + Mobile

**Rationale:** Polish is applied to a fully working game with backend. Mobile controls, responsive layout, visual animations, and performance validation on real devices are all most effectively done when the complete feature set is stable. Discovering mobile performance issues here is low-cost; discovering them in Phase 1 before the Canvas architecture is locked would be worse.

**Delivers:** Responsive layout (desktop sidebar + mobile stacked). On-screen virtual gamepad for mobile. Touch/swipe controls with gesture disambiguation. Line-clear flash animation. Level-up visual effect. Vercel deployment. Performance validated at >55fps on mid-range mobile.

**Addresses from FEATURES.md:** Responsive layout with virtual gamepad, line-clear animation, level-up animation, combo scoring. Full mobile experience.

**Avoids from PITFALLS.md:** Touch events conflicting with browser scroll/navigation (`touch-action: none`, `e.preventDefault()` with `{ passive: false }`, `100dvh` viewport). Missing level progression feedback (level-up notification). No ghost piece (already done in Phase 2, verified here on mobile).

**Research flag:** Standard patterns for responsive CSS Grid and Pointer Events. The `100dvh` / dynamic viewport height for iOS Safari address bar is a known pattern. No additional research needed.

---

### Phase Ordering Rationale

- **Engine before UI:** All critical pitfalls are Phase 1 decisions. The rendering architecture (Canvas vs DOM) and game state strategy (`useRef` vs `useState`) are irreversible once the UI layer is built on top of them.
- **Playable game before Firebase:** Firebase adds no value until the game works. Building Firebase in parallel with the game engine creates integration complexity that obscures which layer is broken when things go wrong.
- **Auth before Leaderboard:** Firestore leaderboard requires user identity. This is a hard dependency from FEATURES.md.
- **Polish last:** Animations, mobile controls, and visual effects are applied to a stable, tested game. This avoids re-polishing features that change during core development.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Game Engine):** SRS rotation is fully specified in the Tetris Guideline; Canvas 2D API and `rAF` patterns are MDN-documented. No research needed.
- **Phase 2 (React + Rendering):** `useReducer` patterns and Canvas integration with React are well-documented. No research needed.
- **Phase 3 (Firebase):** Firebase Auth and Firestore patterns are thoroughly documented. Firestore security rules unit testing setup may benefit from a focused implementation check.
- **Phase 4 (Polish + Mobile):** Mobile touch event handling patterns are well-documented (MDN, iOS Safari quirks are known). No research needed.

**No phases require `/gsd:research-phase`.** The research corpus is comprehensive and the patterns are well-established.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vite 6, React 19, Firebase 11 are current stable releases with verified rationale. Canvas vs DOM decision is backed by performance reasoning and competitor analysis. |
| Features | HIGH | Feature set validated against Tetris Guideline (official spec), Jstris, and Tetr.io. Table stakes vs differentiators distinction is well-supported. |
| Architecture | HIGH | Four-layer separation is a well-documented pattern for browser games with Firebase. `useReducer` + Canvas + `rAF` is the standard approach for this class of game. |
| Pitfalls | HIGH | Pitfalls are sourced from the Tetris Guideline (SRS), MDN (rAF, touch events), Firebase docs (auth race, security rules), and documented community post-mortems. Recovery costs are accurately rated. |

**Overall confidence:** HIGH

### Gaps to Address

- **Score cap value (999,999):** The Firestore rules research suggests capping at 999,999 as a "realistic" maximum. This should be validated during Phase 1 by checking the theoretical maximum score achievable with the planned level cap and scoring formula before hardcoding it into security rules.
- **Firestore free tier headroom:** The free tier supports 50K reads/day and 20K writes/day. With `onSnapshot` real-time listeners, each connected user generates continuous reads. The per-user personal-best dedup model (one document per user) helps significantly, but if the leaderboard table is shown on the main game screen and uses `onSnapshot`, read costs scale with concurrent users. This should be evaluated after launch — switchable to a TTL-cached fetch if needed.
- **Firebase App Check (bot protection):** PITFALLS.md recommends enabling App Check with reCAPTCHA v3 for production to block automated score submission via the REST API. This is marked optional for v1 but should be a Phase 3 decision checkpoint — it is far easier to enable at launch than retroactively.
- **Lock delay implementation:** ARCHITECTURE.md mentions lock delay (a piece that touches the floor gets ~500ms before locking, reset by rotation or horizontal movement) as an optional polish feature. This is a Tetris Guideline requirement for competitive play but is complex to implement correctly. Flag for explicit scope decision at Phase 1.

---

## Sources

### Primary (HIGH confidence)
- Tetris Guideline (The Tetris Company) — SRS rotation tables, wall kick offsets, scoring formula (100/300/500/800 × level), level speed curve, 7-bag randomizer specification
- MDN Web Docs — `requestAnimationFrame`, Canvas 2D API, Pointer Events API, `touch-action` CSS property, `100dvh` dynamic viewport height
- Firebase documentation — Firebase Auth `onAuthStateChanged`, `authStateReady()`, Firestore security rules reference, `onSnapshot` real-time listeners, modular SDK v11 tree-shaking
- React documentation — `useReducer`, `useRef`, `useEffect` cleanup patterns

### Secondary (MEDIUM confidence)
- Jstris.com — feature set analysis (hold piece, ghost piece, preview count, leaderboard structure)
- Tetr.io — feature set analysis (auth model, leaderboard complexity)
- Firebase App Check documentation — reCAPTCHA v3 provider setup
- `@firebase/rules-unit-testing` documentation — emulator-based security rules testing

### Tertiary (inferred/community consensus)
- Community post-mortems on common Tetris clone bugs — validated the SRS and collision detection pitfalls
- Firestore pricing model — free tier limits (50K reads/day, 20K writes/day) used to inform leaderboard data model recommendation

---

*Research completed: 2026-03-01*
*Ready for roadmap: yes*
