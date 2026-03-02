# Phase 2: React Shell + Visual Polish - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

React wrapper around the Phase 1 engine — adds visual presentation (neon/synthwave rendering), keyboard controls, touch controls, and responsive layout. No backend. Auth and leaderboard are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Neon palette & atmosphere
- Neon synthwave palette (departs from Guideline colors) — hot pink, electric blue, neon green, purple; each piece gets a vivid, distinct synthwave color
- Background: near-black (#0a0a0f) — maximum contrast for neon glow
- Subtle grid lines (e.g. very faint ~#1a1a2e) — visible enough to aid piece placement, not distracting
- Ghost piece: dim outline only (border in piece's color, no fill)

### Animations
- Line-clear: flash then collapse — cleared rows flash bright neon, then instantly disappear and rows fall
- Line-clear duration: ~100ms flash before collapse — snappy, minimal interruption to gameplay
- Lock-in: brief bright flash on the locked cells (~50ms) — confirms piece placement
- Level-up: full board flash — entire board flashes briefly to celebrate the level milestone

### Side panels
- Info shown: Score, Level, Lines, Next piece (1 piece), Hold piece, High score (local best)
- Desktop layout: Left panel = Hold | Center = Board | Right panel = Score + Next + Level + Lines + High score
- Next piece preview shows 1 piece only
- Game-over screen: darkened overlay on the board with final score and restart button (board stays visible underneath)

### Mobile controls
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

</decisions>

<specifics>
## Specific Ideas

No specific references mentioned — open to standard synthwave/neon approaches for color and atmosphere.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-react-shell-visual-polish*
*Context gathered: 2026-03-02*
