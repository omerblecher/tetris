# Phase 3: Firebase Auth + Leaderboard - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Google sign-in via popup, Firestore personal best tracking, and a global top-10 leaderboard with hardened security rules. Guests can play fully and view the leaderboard; only authenticated players can submit scores. Creating posts, social features, and scheduled data are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Auth UI & placement
- Sign-in button lives in the header / top of page — always visible, not gated to game-over
- Signed-in state: display name + sign-out button, text only (no Google avatar)
- Mobile: auth header stays at the top, compact row above the game board
- A secondary "Sign in with Google to save your score" button also appears on the game-over overlay for guests (in addition to the persistent header button)

### Leaderboard display
- Side panel next to the board — always visible during play, not a modal
- Each row shows: rank + name + score (clean, minimal — no level or date)
- Real-time via Firestore `onSnapshot`; rows animate/reorder live when new scores arrive
- The current authenticated player's row is highlighted (neon accent color/glow) if they appear in the top 10

### Score submission flow
- Auto-submit only if the score beats the player's personal best — no prompt, no button
- Firestore write happens silently; personal best doc and leaderboard entry update in the same operation, so the leaderboard reflects the new score immediately
- Game-over screen shows a "New personal best!" banner only when the player beats their PB; nothing extra is shown otherwise
- Silent fail on network errors — no error message, don't disrupt the game-over experience

### Guest experience
- Guests have full gameplay — no restrictions, no persistent banners
- Leaderboard side panel is fully visible to guests (read access open, write requires auth)
- Phase 2's localStorage best score continues to display for guests as their personal best
- Game-over overlay shows a prominent "Sign in with Google to save your score" button (not a text link), but guests can restart without signing in

### Claude's Discretion
- Exact neon highlight styling for the player's leaderboard row
- Animation specifics for row reordering (slide duration, easing)
- Firestore data model structure (single `scores` collection vs subcollections)
- Compression/ordering of the top-10 query

</decisions>

<specifics>
## Specific Ideas

- The sign-in button and signed-in state should match the neon/synthwave header aesthetic from Phase 2
- "New personal best!" should feel celebratory — a neon flash or banner, not a subtle message
- The side panel leaderboard and the local-best display should be visually distinct (global vs personal)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-firebase-auth-leaderboard*
*Context gathered: 2026-03-02*
