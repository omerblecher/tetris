# Tetris

## What This Is

A browser-based Tetris game with a neon/glow aesthetic on a near-black background. Players can log in with Google, compete on a global leaderboard, and play on any device — desktop or mobile. Built with React + Vite, Firebase for auth and data, and deployed to Vercel or Netlify.

## Core Value

A beautiful, playable Tetris experience with a real global leaderboard — the neon aesthetic and smooth gameplay make it worth coming back to.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Classic Tetris gameplay (7 tetrominoes, rotation, line clearing, scoring, levels, game over)
- [ ] Neon/glow visual aesthetic — pieces glow and pulse on a near-black background
- [ ] Responsive layout — fully playable on desktop and mobile (touch controls on mobile)
- [ ] Google login via Firebase Auth (display name shown on leaderboard)
- [ ] Global leaderboard — all players ranked by high score, stored in Firestore
- [ ] Score tracking — current score, level, lines cleared displayed during play
- [ ] CLAUDE.md created with project rules for AI-assisted development
- [ ] After each phase: commit all changes and push to remote GitHub repository

### Out of Scope

- Multiplayer / head-to-head mode — high complexity, not core to the vision
- Custom piece skins / themes — neon is the aesthetic, keep it consistent
- Offline-first / PWA — nice to have later, not v1
- Email/password auth — Google login is sufficient for v1

## Context

- No existing codebase — greenfield project
- Stack: React + Vite (component state maps well to Tetris game loop), Firebase (Auth + Firestore), CSS with glow/neon effects
- Hosting: Vercel or Netlify (auto-deploy from GitHub)
- Remote GitHub repo: not yet created — will be added before first push
- CLAUDE.md rules file must be created and maintained for AI development guidance

## Constraints

- **Tech Stack**: React + Vite + Firebase — chosen for Google Auth integration and global leaderboard without managing a server
- **Hosting**: Vercel or Netlify — free tier, deploys from git
- **Aesthetic**: Neon/synthwave on near-black — all UI decisions should reinforce this
- **Mobile**: Touch controls required — no keyboard dependency for gameplay on mobile
- **Git**: Commit + push to remote GitHub after every phase completes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite over vanilla JS | Game UI has real state complexity (board, active piece, score, level, leaderboard) — components keep it manageable | — Pending |
| Firebase over Supabase | Google Auth is Firebase-native, fewer moving parts | — Pending |
| Vercel/Netlify over GitHub Pages | Vite apps need a build step, Vercel/Netlify auto-build from push | — Pending |
| Canvas vs CSS/DOM for game board | TBD during Phase 1 research — canvas gives pixel control, CSS is more styleable | — Pending |

---
*Last updated: 2026-03-01 after initialization*
