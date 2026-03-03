# CLAUDE.md — Tetris Project Guide

<!-- Live URL: https://tetris-wheat-omega.vercel.app -->

AI assistant project guide. Read this before making any changes. Every decision here is locked — it was made for a specific reason documented below.

---

## Project Overview

Browser-based Tetris with a neon/synthwave aesthetic and a real global leaderboard powered by Firebase.
Stack: React 19 + Vite 6 + TypeScript 5.7 + HTML5 Canvas 2D + Firebase Auth + Cloud Firestore.
Hosted on Vercel. No game framework — Phaser/Pixi/Three are overkill for a 10×20 grid game.

---

## Commands

```bash
npm run dev      # Local dev server at localhost:5173
npm run build    # TypeScript check + Vite production build (tsc -b && vite build)
npm test         # Vitest unit tests
npm run lint     # ESLint
```

---

## Stack (Exact Versions)

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.7 |
| Build Tool | Vite 6 |
| Rendering | HTML5 Canvas 2D |
| Authentication | Firebase Auth (Google Sign-In via signInWithPopup) |
| Database | Cloud Firestore |
| Testing | Vitest |
| Hosting | Vercel |

Firebase SDK version: **12** (modular, tree-shakeable).
Import pattern: `import { getAuth } from 'firebase/auth'` — never the compat layer.

---

## Architecture Decisions — WHY

These are non-negotiable. Each decision has a reason. Do not change them without understanding the cost.

### Canvas, not DOM cells

CSS `box-shadow` glow on 200 DOM cells causes a browser paint storm on every frame — measured at ~40fps on mid-range Android. The Canvas renderer pre-bakes each tetromino color as an OffscreenCanvas texture (with `shadowBlur` applied once at startup), then composites them at render time with `drawImage`. Result: consistent 60fps on mobile.

### `useRef` for game state, not `useState`

Calling React's `setState` inside a `requestAnimationFrame` loop triggers ~60 component re-renders per second. At Tetris level 10+ this collapses performance entirely. The game engine and renderer live in `useRef` — they are mutated directly without triggering re-renders. React `useState` is used **only** for score/level/lines/gameOver display values, which update at human-perceptible frequency.

### `requestAnimationFrame` + delta-time, not `setInterval`

`setInterval` in JavaScript drifts by tens of milliseconds per tick due to the event loop. At Tetris level 10+, where a piece falls every ~83ms, this drift causes visibly erratic piece movement. `requestAnimationFrame` is the browser's native animation primitive — it fires before each paint and provides a high-resolution timestamp for accurate delta-time calculation.

### SRS rotation with full wall kick tables

The Super Rotation System (SRS) is the Tetris Guideline standard. Without wall kick tables, pieces get stuck when rotating near walls or the floor — immediately jarring to players familiar with modern Tetris (Tetris Effect, TETR.IO, etc.). This implementation uses the full Guideline wall kick tables for all pieces, with special I-piece offsets.

### Firebase modular SDK (tree-shakeable imports)

Named imports from `firebase/auth`, `firebase/firestore`, etc. are tree-shaken by Vite at build time — only the code you import is included in the bundle. The compat layer (`firebase/compat/*`) bundles the entire SDK, bypasses tree-shaking, and is deprecated.

### Firestore one-doc-per-user model

One document per UID in the `scores/` collection. `setDoc` with `{ merge: true }` is used — safe for first-time users (creates the document) and returning users (updates it). One doc per game would create unbounded collection growth and require aggregation queries.

---

## Never-Do List

Read this. Breaking any rule here will cause performance, security, or correctness problems.

1. **Never use `useState` for game loop state.** It causes ~60 re-renders/sec and collapses performance at higher levels. Use `useRef`.
2. **Never use `setInterval` for the game loop.** It drifts by tens of ms per tick. Use `requestAnimationFrame` + delta-time.
3. **Never apply CSS glow to DOM cells.** Paint storms on mobile (~40fps on mid-range Android). Canvas only — glow is pre-baked into OffscreenCanvas textures.
4. **Never add new Firestore fields without updating `firestore.rules`.** Security rules must be kept in sync with the data model — new fields are unprotected by default.
5. **Never import Firebase using the compat layer** (`firebase/compat/*`). Always use modular imports from `firebase/auth`, `firebase/firestore`, etc.
6. **Never commit `.env`.** Real API keys must never appear in git history. Use `.env.example` with blank values.
7. **Never set `shadowBlur` on the main Canvas at render time.** GPU paint cost is too high at 60fps across 200 cells. Pre-bake glow into OffscreenCanvas textures at startup only.

---

## File Map

```
src/engine/       — Pure TS game engine (no React dependencies):
                    Board, Piece, Scorer, TetrisEngine
src/renderer/     — Canvas 2D rendering:
                    CanvasRenderer, offscreen texture cache (OffscreenCanvas)
src/firebase/     — Firebase initialization, auth functions, Firestore leaderboard
src/hooks/        — useGameEngine (rAF loop + engine lifecycle), useKeyboard, useLeaderboard
src/components/   — React UI: GameBoard, SidePanel, Leaderboard, AuthHeader, VirtualControls
src/contexts/     — AuthContext (AuthProvider + useAuth hook)
firestore.rules   — Firestore security rules (keep in sync with data model)
.planning/        — GSD planning files: ROADMAP.md, STATE.md, phases/ (plans + summaries)
```

---

## Environment Variables

All Firebase config is in `.env` (gitignored). Copy `.env.example` to `.env` and fill in values from:
**Firebase Console → Project Settings → Your apps → Web app → SDK setup → Config**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The `VITE_` prefix is required — Vite only exposes variables with this prefix to client-side code.
All 6 keys are read via `import.meta.env.VITE_FIREBASE_*` in `src/firebase/config.ts`.

---

## GSD Workflow Notes

This project was planned and built using the GSD workflow (`/gsd:plan-phase`).

- Planning files live in `.planning/` — `ROADMAP.md`, `STATE.md`, `phases/`
- Each phase directory contains `PLAN.md` files and `SUMMARY.md` files after execution
- To continue development: open a new Claude session → `/gsd:plan-phase` → select next phase
- Each phase follows: discuss → research → plan → execute → verify
- Do **NOT** modify `.planning/` files manually during execution — use GSD commands
- Phase overview: Phase 1 (engine) → Phase 2 (React + visual) → Phase 3 (Firebase) → Phase 4 (deployment)
