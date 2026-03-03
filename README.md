# Tetris

> Neon synthwave Tetris with a real global leaderboard.
>
> **Live:** [https://tetris-wheat-omega.vercel.app](https://tetris-wheat-omega.vercel.app)

A browser-based Tetris implementation featuring the full Tetris Guideline ruleset (SRS rotation with wall kicks, 7-bag randomizer, lock delay, T-spin detection), a neon/synthwave aesthetic rendered entirely on HTML5 Canvas, and a Firebase-powered global leaderboard with Google authentication.

---

## Features

- All 7 standard tetrominoes (I, O, T, S, Z, J, L) with correct SRS rotation + wall kick tables
- 7-bag randomizer for balanced piece distribution
- Hold piece (C key), next 3-piece preview panel
- Ghost piece, hard drop (Space), soft drop (arrow down)
- Back-to-back Tetris bonus, combo multiplier, T-spin detection
- Guideline scoring: 100 / 300 / 500 / 800 x level for 1 / 2 / 3 / 4 line clears
- Neon glow rendering at 60fps via Canvas 2D (pre-baked OffscreenCanvas textures)
- Google sign-in (Firebase Auth) with session persistence
- Global top-10 leaderboard with real-time updates (Firestore onSnapshot)
- Personal best tracking — scores submitted only when they beat your record
- Keyboard controls + mobile touch controls (swipe gestures + virtual buttons)
- Pause / resume (P key)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.7 |
| Build Tool | Vite 6 |
| Rendering | HTML5 Canvas 2D |
| Authentication | Firebase Auth (Google Sign-In) |
| Database | Cloud Firestore |
| Hosting | Vercel |

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Google Auth enabled

### Steps

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/USERNAME/tetris.git
   cd tetris
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Open .env and fill in your Firebase config values
   ```

3. Start the development server:
   ```bash
   npm run dev
   # Open http://localhost:5173
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server (localhost:5173) |
| `npm run build` | TypeScript check + production build |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint |

---

## Environment Variables

All Firebase configuration is stored in a `.env` file (gitignored). Copy `.env.example` to `.env` and fill in values from:

**Firebase Console → Project Settings → Your apps → (your web app) → SDK setup and configuration → Config**

```bash
VITE_FIREBASE_API_KEY=          # Web API key
VITE_FIREBASE_AUTH_DOMAIN=      # projectid.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=       # Your Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET=   # projectid.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=  # Sender ID from project settings
VITE_FIREBASE_APP_ID=           # Web app ID
```

Note: The `VITE_` prefix is required — Vite only exposes variables with this prefix to client-side code.

---

## Architecture Notes

### Why Canvas, not DOM cells?

Applying CSS `box-shadow` glow to 200 DOM cells causes a browser paint storm on each frame — measured at ~40fps on mid-range Android devices. The Canvas approach pre-renders each tetromino color as an OffscreenCanvas texture (with `shadowBlur` baked in at startup), then composites them each frame with `drawImage`. Result: consistent 60fps on mobile.

### Why `useRef`, not `useState`, for game state?

Calling React's `setState` inside a `requestAnimationFrame` loop causes the component to re-render ~60 times per second. At higher Tetris levels this collapses performance. The game engine and renderer live in `useRef` — they are mutated directly without triggering React re-renders. React `useState` is used only for the score / level / lines / gameOver display values, which update at human-perceptible frequency.

### Why `requestAnimationFrame` + delta-time?

`setInterval` in JavaScript drifts by tens of milliseconds per tick due to the event loop. At Tetris level 10+, where a piece falls every ~83ms, this drift causes visibly erratic piece movement. `requestAnimationFrame` is the browser's native animation primitive — it fires before each paint and provides a high-resolution timestamp for accurate delta-time calculation.

### Why SRS rotation with wall kick tables?

The Super Rotation System (SRS) is the Tetris Guideline standard used by all modern Tetris implementations. Without wall kick tables, pieces get stuck when rotating near walls or the floor — a jarring experience for players familiar with modern Tetris. This implementation uses the full Guideline wall kick tables for all pieces (with special I-piece offsets).

---

## Firestore Security

Firestore rules enforce:

- Authenticated writes only (no anonymous writes)
- The UID in the document path must match the authenticated user's UID
- Score must be a number in range `[0, 10,000,000]`
- Score can only increase (no score rollbacks)
- No document deletions

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the architecture decisions in CLAUDE.md
4. Run tests: `npm test`
5. Run lint: `npm run lint`
6. Submit a pull request

See CLAUDE.md for architecture decisions, coding conventions, and the never-do list.

---

## License

MIT
