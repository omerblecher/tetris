# Requirements: Tetris

**Defined:** 2026-03-01
**Core Value:** A beautiful, playable Tetris experience with a real global leaderboard — the neon aesthetic and smooth gameplay make it worth coming back to.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Game Engine

- [ ] **ENG-01**: Player can move pieces left, right, and down using keyboard arrow keys
- [x] **ENG-02**: Player can rotate pieces clockwise and counter-clockwise using keyboard (Up = CW, Z/Ctrl = CCW)
- [x] **ENG-03**: All 7 standard tetrominoes (I, O, T, S, Z, J, L) spawn and rotate using Super Rotation System (SRS) with wall kicks
- [ ] **ENG-04**: Pieces fall automatically; fall speed increases with level (gravity)
- [ ] **ENG-05**: Player can hard drop (spacebar) to instantly place piece at lowest valid position
- [ ] **ENG-06**: Player can soft drop (hold down arrow) to accelerate piece fall
- [ ] **ENG-07**: Ghost piece shows semi-transparent preview of where current piece will land
- [ ] **ENG-08**: Player can hold the current piece (C key / hold button) and swap with held piece once per drop
- [ ] **ENG-09**: Game displays next 3 upcoming pieces in a preview panel
- [x] **ENG-10**: Collision detection prevents pieces from moving through walls, floor, or locked cells
- [ ] **ENG-11**: Game detects and handles game over when a newly spawned piece cannot be placed (board is full)

### Line Clearing & Scoring

- [ ] **SCR-01**: Complete horizontal rows are cleared; rows above fall down to fill gaps
- [x] **SCR-02**: Score uses standard Tetris formula: 100/300/500/800 points for 1/2/3/4 lines × current level
- [x] **SCR-03**: Back-to-back Tetris (4-line clear) and combo bonuses apply multiplier to score
- [x] **SCR-04**: Level increases every 10 lines cleared; gravity (fall speed) scales with level
- [x] **SCR-05**: Hard drop adds 2 points per cell dropped; soft drop adds 1 point per cell
- [ ] **SCR-06**: Current score, level, and lines cleared are displayed in real time during gameplay

### Visual & Aesthetic

- [ ] **VIS-01**: Game board renders on HTML5 Canvas with neon/glow effect — each tetromino type has a distinct neon color rendered via `ctx.shadowBlur` / `ctx.shadowColor`
- [ ] **VIS-02**: Background is near-black (#0d0d1a or similar); board lines are subtle dark grid
- [ ] **VIS-03**: Line-clear animation: cleared rows flash/pulse before disappearing
- [ ] **VIS-04**: Level-up visual effect: brief screen flash or glow burst on level increase
- [ ] **VIS-05**: Active piece has brightest glow; ghost piece is dim/translucent version of the same color
- [ ] **VIS-06**: Lock-in flash: brief bright flash when a piece locks into place

### Controls & UX

- [ ] **CTR-01**: All gameplay functions work with keyboard on desktop (arrows, spacebar, Z/C keys)
- [ ] **CTR-02**: Touch/swipe controls work on mobile: swipe left/right = move, swipe down = soft drop, swipe up = hard drop, tap = rotate clockwise
- [ ] **CTR-03**: On-screen virtual buttons visible on mobile for discoverability (rotate CW/CCW, hard drop, hold)
- [ ] **CTR-04**: Player can pause and resume the game (P key or pause button)
- [ ] **CTR-05**: Game over screen displays final score, personal best, and options to play again or view leaderboard

### Responsive Layout

- [ ] **LAY-01**: Layout adapts to desktop (landscape): game board centered, panels left/right
- [ ] **LAY-02**: Layout adapts to mobile (portrait): game board top, score/next panel compact below, virtual controls at bottom
- [ ] **LAY-03**: Game canvas scales to fit viewport without overflow or scroll on any device
- [ ] **LAY-04**: No keyboard or hardware dependency on mobile — game is fully playable via touch alone

### Authentication

- [ ] **AUTH-01**: Player can sign in with Google account (Firebase Auth, `signInWithPopup`)
- [ ] **AUTH-02**: Player can sign out at any time
- [ ] **AUTH-03**: Auth state persists across browser sessions (player stays logged in)
- [ ] **AUTH-04**: Player can play without logging in (guest mode); leaderboard submission requires auth
- [ ] **AUTH-05**: Display name from Google account is shown on the leaderboard

### Leaderboard

- [ ] **LDB-01**: Global leaderboard displays top 10 all-time scores with player name and score
- [ ] **LDB-02**: Player's personal best score is stored in Firestore per UID and displayed on game over screen
- [ ] **LDB-03**: After game over (authenticated players), score is submitted to Firestore only if it beats personal best
- [ ] **LDB-04**: Leaderboard is readable by all (including guests); write is restricted to authenticated user's own record
- [ ] **LDB-05**: Firestore security rules enforce: authenticated writes only, UID matches auth user, score is a number within valid range, records are write-once-update (score only increases)

### Developer & Project

- [ ] **DEV-01**: CLAUDE.md file created with project rules, coding conventions, and AI development guidelines
- [ ] **DEV-02**: After each phase completes, all changed files are committed to git and pushed to remote GitHub repository
- [ ] **DEV-03**: Project deployed to Vercel or Netlify with auto-deploy on push to main branch
- [ ] **DEV-04**: Firebase config stored in environment variables (never hardcoded), `.env` in `.gitignore`

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Audio

- **AUD-01**: Sound effects on line clear, piece lock, level up, and game over
- **AUD-02**: Background music with volume toggle
- **AUD-03**: Mute/unmute control persists in localStorage

### Enhanced Leaderboard

- **LDB-06**: Leaderboard filters: all-time / this week / today
- **LDB-07**: Player's own rank shown even if not in top 10

### Animations

- **ANI-01**: Ambient background particle system (neon synthwave atmosphere)
- **ANI-02**: Piece entry animation (brief scale-in on spawn)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multiplayer / head-to-head | 10x complexity, separate product decision, WebSocket server required |
| Email/password auth | Google OAuth is sufficient for v1; adds auth complexity |
| PWA / offline mode | Service worker + Firebase offline sync complexity; mobile web already works |
| AI opponent | Complex to implement well, leaderboard provides competition |
| Custom piece skins / themes | Neon is the identity — consistency over customization |
| Replay system | Complex state recording, not core to the play loop |
| Lock delay (Tetris Guideline standard) | Adds implementation complexity; can be added post-launch |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-01 | Phase 1 | Pending |
| ENG-02 | Phase 1 | Complete |
| ENG-03 | Phase 1 | Complete |
| ENG-04 | Phase 1 | Pending |
| ENG-05 | Phase 1 | Pending |
| ENG-06 | Phase 1 | Pending |
| ENG-07 | Phase 1 | Pending |
| ENG-08 | Phase 1 | Pending |
| ENG-09 | Phase 1 | Pending |
| ENG-10 | Phase 1 | Complete |
| ENG-11 | Phase 1 | Pending |
| SCR-01 | Phase 1 | Pending |
| SCR-02 | Phase 1 | Complete |
| SCR-03 | Phase 1 | Complete |
| SCR-04 | Phase 1 | Complete |
| SCR-05 | Phase 1 | Complete |
| SCR-06 | Phase 1 | Pending |
| VIS-01 | Phase 2 | Pending |
| VIS-02 | Phase 2 | Pending |
| VIS-03 | Phase 2 | Pending |
| VIS-04 | Phase 2 | Pending |
| VIS-05 | Phase 2 | Pending |
| VIS-06 | Phase 2 | Pending |
| CTR-01 | Phase 2 | Pending |
| CTR-02 | Phase 2 | Pending |
| CTR-03 | Phase 2 | Pending |
| CTR-04 | Phase 2 | Pending |
| CTR-05 | Phase 2 | Pending |
| LAY-01 | Phase 2 | Pending |
| LAY-02 | Phase 2 | Pending |
| LAY-03 | Phase 2 | Pending |
| LAY-04 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| AUTH-05 | Phase 3 | Pending |
| LDB-01 | Phase 3 | Pending |
| LDB-02 | Phase 3 | Pending |
| LDB-03 | Phase 3 | Pending |
| LDB-04 | Phase 3 | Pending |
| LDB-05 | Phase 3 | Pending |
| DEV-01 | Phase 4 | Pending |
| DEV-02 | Phase 4 | Pending |
| DEV-03 | Phase 4 | Pending |
| DEV-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation — traceability expanded to individual requirement IDs; count corrected to 46*
