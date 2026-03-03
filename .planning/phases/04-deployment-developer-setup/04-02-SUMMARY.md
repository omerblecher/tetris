---
phase: 04-deployment-developer-setup
plan: 02
subsystem: infra
tags: [git, github, vercel, firebase, deployment]

# Dependency graph
requires:
  - phase: 04-deployment-developer-setup/04-01
    provides: CLAUDE.md and README.md committed to git
provides:
  - Public GitHub repository with full project history (72 commits)
  - Live Vercel deployment at tetris-wheat-omega.vercel.app
  - Auto-deploy from main branch via Vercel GitHub integration
  - Firebase Authorized Domains updated for production Google sign-in
affects: []

# Tech tracking
tech-stack:
  added: [vercel, github-remote]
  patterns: [git-push-to-deploy, vercel-env-vars, firebase-authorized-domains]

key-files:
  created: []
  modified:
    - CLAUDE.md (live URL updated)
    - README.md (live URL updated)
    - .gitignore (.claude/ added)

key-decisions:
  - "Branch named 'main' (not master) — all pushes go to origin/main"
  - "Live URL: tetris-wheat-omega.vercel.app — updated in CLAUDE.md and README.md"
  - "Firebase Authorized Domains must include Vercel domain for Google sign-in to work in production"

patterns-established:
  - "Push to main triggers Vercel auto-deploy — CI/CD established"

requirements-completed:
  - DEV-02
  - DEV-03

# Metrics
duration: 10min
completed: 2026-03-03
---

# Phase 04-02: Git + GitHub + Vercel Deploy Summary

**Full project history pushed to public GitHub repo; live at tetris-wheat-omega.vercel.app with auto-deploy and working Google sign-in**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-03-03
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Local branch renamed to `main`; 72 commits (all 4 phases) pushed to https://github.com/omerblecher/tetris
- Vercel project deployed from GitHub with auto-deploy on push to `main`
- Live game accessible at https://tetris-wheat-omega.vercel.app
- Firebase Authorized Domains updated — Google sign-in works in production
- Live URL placeholder replaced in CLAUDE.md and README.md

## Task Commits

1. **Task 1: Rename branch, commit Phase 4 files, prepare push** - `b0f7428` (chore)
2. **URL update: Replace placeholder with actual Vercel URL** - `b4133a2` (docs)

## Files Created/Modified
- `CLAUDE.md` — live URL comment updated to `tetris-wheat-omega.vercel.app`
- `README.md` — live URL link updated to `tetris-wheat-omega.vercel.app`
- `.gitignore` — added `.claude/` entry

## Decisions Made
- Branch is `main` — Vercel GitHub integration tracks `main` for auto-deploy
- All 6 `VITE_FIREBASE_*` env vars added to Vercel project settings before first deploy

## Deviations from Plan
None — plan executed exactly as written. Checkpoint completed successfully by user.

## Issues Encountered
None

## User Setup Required
None — all external steps completed during checkpoint.

## Next Phase Readiness
Phase 4 is complete. All 4 phases of the v1.0 milestone are done.
- Full project live and publicly accessible
- Auto-deploy configured
- Google sign-in and leaderboard functional in production

---
*Phase: 04-deployment-developer-setup*
*Completed: 2026-03-03*
