# Feature Research

**Domain:** Browser-based Tetris game (React + Firebase, neon aesthetic, desktop + mobile)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 7 standard tetrominoes (I, O, T, S, Z, J, L) | It's Tetris — any deviation is jarring | LOW | Use standard Tetromino Guideline shapes |
| Piece rotation (clockwise + counter-clockwise) | Core Tetris mechanic | MEDIUM | Use Super Rotation System (SRS) for wall kicks |
| Gravity / auto-drop | Pieces fall automatically | LOW | Speed increases with level |
| Hard drop (spacebar / swipe-up) | Power user expectation | LOW | Piece teleports to bottom instantly |
| Soft drop (down arrow / swipe-down) | Core mechanic, faster fall | LOW | Speeds up piece descent |
| Line clearing (1-4 lines at once) | The win condition | MEDIUM | Full row disappears, rows above fall |
| Tetris (4-line clear) bonus | Players expect the big score reward | LOW | Visual/sound feedback critical |
| Score display | Players need feedback | LOW | Show current score, level, lines cleared |
| Level progression | Game gets harder over time | LOW | Speed increases every 10 lines |
| Next piece preview | Standard since 1989 | LOW | Show 1-3 upcoming pieces |
| Game over state | Clear end state | LOW | Board fills to top, show final score |
| Restart / New Game | Obvious player expectation | LOW | Single button action |
| Ghost piece (drop shadow) | Modern Tetris standard, aids play | LOW | Semi-transparent preview where piece will land |
| Keyboard controls | Desktop users expect this | LOW | Arrow keys + spacebar |
| Touch/swipe controls | Mobile is half the target audience | MEDIUM | Swipe left/right/down, tap to rotate, swipe up = hard drop |
| Pause / Resume | Player must be able to step away | LOW | P key or tap pause button |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Neon/glow CSS aesthetic | Signature visual identity — what makes this game memorable | MEDIUM | CSS box-shadow, glow keyframes, near-black background |
| Piece color glow animations | Pieces feel alive, arcade atmosphere | MEDIUM | CSS animation on active piece, lock flash on placement |
| Hold piece (swap current piece) | Quality-of-life, loved by players | LOW | Hold one piece to use later — one swap per drop |
| 3-piece next preview | Shows 3 upcoming pieces instead of 1 | LOW | Increases strategy depth |
| Line-clear animation | Visual satisfaction for scoring | LOW | Rows flash/explode before clearing |
| Level-up animation | Celebration moment | LOW | Brief flash/effect when leveling up |
| Google login | Persistent identity across sessions | MEDIUM | Firebase Auth with Google provider |
| Global leaderboard | Competitive motivation to replay | MEDIUM | Firestore collection, ordered by score |
| Personal best tracking | Individual progress motivation | LOW | Store per-user high score in Firestore |
| Score submission prompt | Natural flow from game over to leaderboard | LOW | Only submit if score is meaningful |
| Responsive layout with virtual gamepad | Polished mobile experience | MEDIUM | On-screen D-pad for mobile, adapts layout |
| Combo scoring | Rewards consecutive line clears | LOW | Bonus multiplier for back-to-back clears |
| Background particle effects | Ambient neon atmosphere | HIGH | Canvas particles, could affect performance — optional |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multiplayer (head-to-head) | Fun concept | Requires WebSockets, server-side game state sync, session management — 10x complexity | Single-player with shared leaderboard gives competition without the cost |
| Sound effects / music | Game atmosphere | Browser autoplay restrictions, mobile audio context issues, file size bloat, user annoyance | Optional volume toggle if added later |
| AI opponent | "Computer player" novelty | Complex to implement well, distorts game balance | Leaderboard gives human competition |
| Custom themes / skins | Personalization | Scope creep, design complexity | Neon is the identity — commit to it |
| Replay system | Show last game | Complex state recording, significant storage | Not core to the loop |
| PWA / offline mode | "Install as app" | Service worker complexity, cache invalidation, Firebase offline sync issues | Responsive web already works on mobile |

## Feature Dependencies

```
Google Login (Firebase Auth)
    └──required by──> Global Leaderboard (needs user identity)
    └──required by──> Personal Best (needs user identity)

Board Engine (tetrominoes, physics, collision)
    └──required by──> Score System
    └──required by──> Level Progression
    └──required by──> Line Clear Animation
    └──required by──> Ghost Piece
    └──required by──> Hold Piece

Score System
    └──required by──> Leaderboard Submission
    └──required by──> Personal Best

Keyboard Controls
    └──enhances──> Hard Drop, Soft Drop, Rotation
Touch Controls
    └──enhances──> Hard Drop, Soft Drop, Rotation (mobile equivalent)
```

### Dependency Notes

- **Leaderboard requires Google Login:** Scores need user identity — anonymous leaderboard entries are meaningless
- **Ghost piece requires board collision detection:** Ghost piece is just running collision detection to find the bottom position
- **Hold piece is independent of auth:** Pure gameplay mechanic, no backend dependency
- **Line-clear animation requires board engine:** Must know which rows are cleared

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] All 7 tetrominoes with SRS rotation — it's Tetris, this is non-negotiable
- [ ] Auto-drop, soft drop, hard drop — complete movement system
- [ ] Line clearing + scoring (standard Tetris scoring) — the core loop
- [ ] Level progression — game needs to escalate
- [ ] Ghost piece — modern standard, dramatically improves UX
- [ ] Next piece preview (3 pieces) — increases engagement
- [ ] Hold piece — loved feature, low complexity
- [ ] Keyboard controls (desktop) — full desktop experience
- [ ] Touch/swipe controls (mobile) — required for mobile playability
- [ ] Neon/glow aesthetic — the project's identity
- [ ] Game over state + restart — complete game loop
- [ ] Google login — needed for leaderboard
- [ ] Global leaderboard (top 10) — core motivational feature
- [ ] Personal best display — shows players their progress
- [ ] Responsive layout — desktop + mobile

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Line-clear animations — enhances visual satisfaction (add when game loop is solid)
- [ ] Level-up visual effect — celebration moment
- [ ] Combo scoring — once base scoring is validated

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Sound effects / music — browser autoplay friction, defer to user demand
- [ ] Background ambient particles — performance risk on mobile
- [ ] Leaderboard filtering (weekly, monthly, all-time) — add if leaderboard gets populated
- [ ] Multiplayer — separate product decision

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Core game engine (7 tetrominoes, physics) | HIGH | MEDIUM | P1 |
| SRS rotation with wall kicks | HIGH | MEDIUM | P1 |
| Line clearing + standard scoring | HIGH | LOW | P1 |
| Ghost piece | HIGH | LOW | P1 |
| Keyboard controls | HIGH | LOW | P1 |
| Touch controls (mobile) | HIGH | MEDIUM | P1 |
| Neon/glow CSS aesthetic | HIGH | MEDIUM | P1 |
| Next piece preview | HIGH | LOW | P1 |
| Hold piece | MEDIUM | LOW | P1 |
| Level progression | HIGH | LOW | P1 |
| Google login | HIGH | MEDIUM | P1 |
| Global leaderboard | HIGH | MEDIUM | P1 |
| Responsive layout | HIGH | MEDIUM | P1 |
| Personal best tracking | MEDIUM | LOW | P1 |
| Line-clear animation | MEDIUM | LOW | P2 |
| Level-up animation | MEDIUM | LOW | P2 |
| Combo scoring | LOW | LOW | P2 |
| Sound effects | LOW | MEDIUM | P3 |
| Ambient particles | LOW | HIGH | P3 |

## Competitor Feature Analysis

| Feature | Jstris | Tetr.io | Our Approach |
|---------|--------|---------|--------------|
| Visual aesthetic | Clean/minimal | Dark, modern | Neon/synthwave glow — stronger identity |
| Auth | Optional account | Required | Google OAuth only, frictionless |
| Leaderboard | Yes (global) | Yes (complex ranking) | Simple top-10 global, personal best |
| Mobile | Partial | App | Full responsive + virtual controls |
| Hold piece | Yes | Yes | Yes |
| Ghost piece | Yes | Yes | Yes |
| Next preview | 1-6 pieces | 5 pieces | 3 pieces |

## Sources

- Tetris Guideline (official Tetris rules: SRS rotation, scoring formula, level speeds)
- Jstris.com — analyzed feature set
- Tetr.io — analyzed feature set
- Standard Tetris scoring: 100/300/500/800 for 1/2/3/4 lines, multiplied by level

---
*Feature research for: Browser-based Tetris game*
*Researched: 2026-03-01*
