# Phase 4: Deployment + Developer Setup - Research

**Researched:** 2026-03-03
**Domain:** Vercel deployment, Vite environment variables, CLAUDE.md authoring, GitHub git workflow
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Deploy to **Vercel** (not Netlify)
- Default Vercel URL is fine — no custom domain
- Auto-deploy from `main` branch; push to main triggers redeploy
- Setup via **Vercel dashboard** (browser import from GitHub) — not CLI
- Firebase Console → Authentication → Authorized Domains must include the Vercel URL (required for Google sign-in popup to work in production) — include this as an explicit deploy step
- Move Firebase config to **`.env` file with `VITE_` prefix** (e.g., `VITE_FIREBASE_API_KEY`) for local dev; Vite exposes them via `import.meta.env`
- `.env` is gitignored (no secrets in repo)
- **Commit `.env.example`** with all variable names and blank values so contributors know what's needed
- Add env vars to Vercel via **Vercel dashboard** (Environment Variables UI) — not CLI
- Update `firebaseConfig` in code to read from `import.meta.env.*`
- CLAUDE.md primary focus: **architecture + stack decisions** — the locked "why" behind Canvas vs DOM, `useRef` vs `useState`, SRS rotation, Firebase modular SDK, Firestore model
- Include explicit **"never-do" list**: never use `useState` for game loop state, never use `setInterval` (use rAF + delta-time), never put CSS glow on DOM cells (Canvas only), never add new Firestore fields without updating security rules
- Include **GSD workflow notes**: how this project uses GSD, phase structure, where `.planning/` files live, how to continue dev with `/gsd:plan-phase`
- Include a **live URL placeholder** section: `<!-- Live URL: https://YOUR-URL.vercel.app -->` for me to fill in after first deploy
- **Public** repository
- **Preserve full commit history** — all phase commits stay, showing project evolution
- Plan includes a **final commit + push** at end of Phase 4: `git push origin main`
- Include a **detailed README.md** with: project name/description, live Vercel URL placeholder, features list, tech stack (React 19, TypeScript, Vite, Firebase, Canvas 2D), architecture notes (why useRef, Canvas, SRS), local setup instructions (`npm install && npm run dev`), env var setup, contribution guide

### Claude's Discretion
- Exact CLAUDE.md structure and section ordering
- README tone and formatting style
- Whether to add a `vercel.json` config file (only if needed for SPA routing)
- Exact `.gitignore` additions (`.env`, `node_modules`, `dist`)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEV-01 | CLAUDE.md file created with project rules, coding conventions, and AI development guidelines | CLAUDE.md authoring patterns documented; exact sections prescribed |
| DEV-02 | After each phase completes, all changed files are committed to git and pushed to remote GitHub repository | Git remote setup workflow documented; branch rename from master to main covered |
| DEV-03 | Project deployed to Vercel or Netlify with auto-deploy on push to main branch | Vercel + Vite deployment fully documented from official docs; SPA routing decision made |
| DEV-04 | Firebase config stored in environment variables (never hardcoded), `.env` in `.gitignore` | Already implemented in src/firebase/config.ts — verified; env var dashboard workflow for Vercel documented |
</phase_requirements>

---

## Summary

Phase 4 is primarily a configuration, documentation, and deployment phase — not a code-writing phase. The heavy lifting (game engine, UI, Firebase) is done. This phase has four concerns: (1) write CLAUDE.md and README.md as developer documentation, (2) confirm Firebase env vars are correctly migrated (already done in Phase 3 — `src/firebase/config.ts` already uses `import.meta.env.VITE_*`), (3) deploy to Vercel via dashboard, and (4) set up a public GitHub remote and push the full commit history.

The most critical non-obvious step is the Firebase Authorized Domains configuration. After deploying to Vercel, the production `.vercel.app` URL must be added to Firebase Console → Authentication → Authorized Domains, otherwise `signInWithPopup` will fail silently with an OAuth domain error in production. This step is easy to forget and is not part of Vercel setup — it is a Firebase Console step done after the first deploy URL is known.

The Tetris app has no client-side router (no React Router, no deep routes — it is a pure single-page game). Therefore, `vercel.json` with SPA rewrites is NOT needed. Vercel's zero-configuration Vite detection handles the build and serves `index.html` correctly. The local `master` branch should be renamed to `main` before pushing to GitHub to match the GitHub default and Vercel's production branch detection.

**Primary recommendation:** Rename local branch master → main, create public GitHub repo, push full history, deploy via Vercel dashboard (import from GitHub, set env vars, deploy), then add Vercel URL to Firebase Authorized Domains.

---

## Current State Assessment (Pre-Phase 4)

Before planning tasks, the current project state matters:

| Item | Current State | Action Required |
|------|--------------|-----------------|
| `src/firebase/config.ts` | Already uses `import.meta.env.VITE_*` for all 6 keys | No code change needed — DEV-04 is structurally complete |
| `.env` | Exists locally with real values | Already gitignored — verified in `.gitignore` |
| `.env.example` | Exists with 6 keys, blank values | Already committed — verify it's in git |
| `.gitignore` | Has `.env`, `node_modules`, `dist`, `dist-ssr` | No changes needed |
| Git branch | Local `master` branch, no remote | Rename to `main`, create GitHub remote, push |
| `CLAUDE.md` | Does not exist | Must create |
| `README.md` | Does not exist | Must create |
| `vercel.json` | Does not exist | NOT needed (no client-side routing) |

---

## Standard Stack

### Core (No new packages needed)
| Tool | Version/Method | Purpose | Why |
|------|----------------|---------|-----|
| Vercel | Dashboard (free tier) | Hosting + auto-deploy | Zero-config Vite detection, GitHub webhook, instant CDN |
| Vite | 6.x (existing) | Build tool | `import.meta.env.VITE_*` is the standard env var pattern |
| Firebase SDK | 12.x (existing) | Auth + Firestore | Already configured with env vars |
| GitHub | Public repo | Source hosting | Required for Vercel's GitHub integration |

### No New Installations Required
Phase 4 adds no npm dependencies. All tooling already exists in the project.

### Alternatives Considered
| Instead of | Could Use | Why Vercel Was Chosen |
|------------|-----------|----------------------|
| Vercel | Netlify | User locked Vercel; Netlify equivalent but not chosen |
| GitHub dashboard import | Vercel CLI | User locked dashboard approach |

---

## Architecture Patterns

### Pattern 1: Vite Environment Variables (Already Implemented)
**What:** Vite only exposes variables prefixed with `VITE_` to client-side code via `import.meta.env`.
**Status:** Already implemented in `src/firebase/config.ts` — no code change needed.

```typescript
// src/firebase/config.ts — ALREADY CORRECT, verified
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
// Source: Verified by reading src/firebase/config.ts directly
```

### Pattern 2: Vercel Dashboard Deployment Flow (No CLI)
**What:** Import GitHub repo into Vercel via browser; Vercel auto-detects Vite, sets build command `tsc -b && vite build` (matches `npm run build`), output dir `dist`.
**Steps:**
1. Go to vercel.com → Add New Project → Import Git Repository
2. Select the GitHub repo
3. Framework preset: Vite (auto-detected)
4. Build Command: `npm run build` (or `tsc -b && vite build` — equivalent)
5. Output Directory: `dist`
6. Add all 6 `VITE_FIREBASE_*` environment variables in the Environment Variables section
7. Deploy

**After first deploy:**
- Note the production URL (format: `https://tetris-XXXXX.vercel.app` or similar)
- Add that URL to Firebase Console → Authentication → Settings → Authorized Domains

### Pattern 3: Git Branch Rename master → main
**What:** The local repo uses `master` (older default). GitHub creates new repos with `main`. Vercel's production branch defaults to `main`. Must rename before pushing.

```bash
# Rename local branch
git branch -m master main

# After GitHub repo is created and remote added:
git remote add origin https://github.com/USERNAME/REPONAME.git
git push -u origin main
```

### Pattern 4: Vercel SPA Routing Decision
**What:** This Tetris app has NO client-side router. All content renders at the root URL `/`. No `vercel.json` is needed.
**Confidence:** HIGH — verified by reading `App.tsx` (no React Router, no BrowserRouter, no route definitions).

**If the app DID use React Router**, vercel.json would be needed:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
**For this project: do not create vercel.json.** Vercel's zero-config Vite preset handles everything.
Source: Vercel official docs (vercel.com/docs/frameworks/frontend/vite)

### Pattern 5: CLAUDE.md Structure
**What:** A concise, authoritative project guide for AI coding assistants. Target: under 200 lines.

Recommended sections for this project:
1. **Project Overview** — one paragraph on what this is and its core value
2. **Stack** — exact versions (React 19, Vite 6, TypeScript 5.7, Firebase 12, Canvas 2D)
3. **Architecture Decisions** — the "why" behind the locked choices
4. **Never-Do List** — explicit prohibitions with reasons
5. **Commands** — `npm run dev`, `npm run build`, `npm test`, `npm run lint`
6. **File Map** — brief guide to src/ directory structure
7. **GSD Workflow** — how to continue development with `/gsd:plan-phase`
8. **Live URL** — placeholder comment

**Key principle:** CLAUDE.md is read at the start of every session. Keep it under 200 lines. Each line competes for context window space. Avoid restating what ESLint/TypeScript already enforces.

### Anti-Patterns to Avoid
- **CLI-based Vercel setup:** User explicitly chose dashboard. Do not add Vercel CLI steps.
- **vercel.json for non-routing apps:** This app has no client-side routes; adding rewrites is unnecessary noise.
- **Committing `.env`:** Already gitignored. Never include real values in `.env.example`.
- **New npm packages in Phase 4:** Zero new dependencies. This is config + docs only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Branch rename + remote setup | Manual git config editing | `git branch -m master main` + `git remote add` | Standard git commands |
| Vite env var exposure | Custom webpack/vite plugin | Built-in `import.meta.env.VITE_*` | Already working in this project |
| Deployment config | Custom CI/CD | Vercel GitHub integration | Webhooks, preview URLs, rollbacks all free |

**Key insight:** Phase 4 is about executing well-known operations correctly in the right order, not building new systems.

---

## Common Pitfalls

### Pitfall 1: Missing Firebase Authorized Domain
**What goes wrong:** After deploying to Vercel, clicking "Sign in with Google" produces a Firebase error: "auth/unauthorized-domain" — the popup opens but immediately closes or shows an error. Authentication completely broken in production.
**Why it happens:** Firebase Auth's `signInWithPopup` only works from domains explicitly whitelisted in Firebase Console. `localhost` and the Firebase project's default domain are pre-authorized, but the Vercel deployment URL is not.
**How to avoid:** After first successful Vercel deploy, copy the production URL (e.g., `tetris-abc123.vercel.app`), go to Firebase Console → Authentication → Settings → Authorized Domains → Add Domain. Note: if the URL starts with `https://`, add only the domain portion (without `https://`).
**Warning signs:** Google sign-in popup opens and immediately closes; browser console shows `auth/unauthorized-domain`.

### Pitfall 2: Wrong Branch Name for Vercel Production
**What goes wrong:** Vercel defaults to tracking `main` as the production branch. If the repo is pushed as `master`, Vercel will either error or treat `master` as a preview (non-production) branch.
**Why it happens:** The local repo uses the older `master` default (created pre-2021 Git convention).
**How to avoid:** Rename to `main` BEFORE pushing: `git branch -m master main`. Do this before connecting to Vercel.
**Warning signs:** Vercel dashboard shows deployments as "Preview" not "Production".

### Pitfall 3: Env Vars Not Set Before First Deploy
**What goes wrong:** Vercel deploys successfully (build passes) but Firebase throws `"Firebase: Error (auth/invalid-api-key)"` at runtime — all 6 `VITE_FIREBASE_*` vars are undefined because they were not added in the dashboard before deploying.
**Why it happens:** Vite bakes `import.meta.env.*` values at BUILD time. If env vars are not present during the Vercel build, they become `undefined` in the output bundle.
**How to avoid:** Add ALL 6 env vars in Vercel Project Settings → Environment Variables BEFORE clicking Deploy. If they were missed, add them then trigger a redeploy from the Vercel dashboard.
**Warning signs:** App loads but game over screen shows no Firebase errors in normal use; only appears when trying to sign in or submit a score.

### Pitfall 4: `.env.example` Already Exists — Don't Overwrite
**What goes wrong:** Planning creates `.env.example` from scratch, overwriting the existing one.
**Current state:** `.env.example` ALREADY EXISTS and is correctly formatted with all 6 keys.
**How to avoid:** Verify the existing file before touching it. Only create if missing. The existing file is correct.

### Pitfall 5: Pushing `.env` to GitHub
**What goes wrong:** Real Firebase API keys are pushed to the public GitHub repo.
**Why it happens:** Forgetting to verify `.gitignore` before pushing.
**How to avoid:** Run `git status` before every `git add`. The `.gitignore` already has `.env` listed — confirm it's tracked as ignored, not modified/untracked.
**Warning signs:** `git status` shows `.env` as a tracked modified file (means it was previously committed — this should not be the case here).

### Pitfall 6: Firebase App Check Not Configured
**What the STATE.md says:** "Decide on Firebase App Check (reCAPTCHA v3) before Phase 4 deployment — easier to enable at launch than retroactively."
**Decision for Phase 4:** App Check is a DEFERRED concern. The CONTEXT.md has no decision about App Check. Phase 4 scope is deployment + docs, not security hardening. The Firestore rules already enforce auth checks, UID validation, and score caps. App Check adds an additional layer but is not required for launch.
**Recommendation:** Do not add App Check in Phase 4. Document it as a v2 follow-up in README or STATE.md.

---

## Code Examples

### .env.example (already exists — verify contents)
```bash
# Firebase configuration — copy this file to .env and fill in your values
# Get these from: Firebase Console -> Project Settings -> Your apps -> Web app -> Config
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
# Source: Verified by reading /c/code/Claude/Tetris/.env.example
```

### Git Branch Rename and Remote Setup
```bash
# Step 1: Rename local branch
git branch -m master main

# Step 2: Add GitHub remote (user creates repo on GitHub first)
git remote add origin https://github.com/USERNAME/tetris.git

# Step 3: Push with upstream tracking
git push -u origin main
# Source: git-scm.com official docs + GitHub docs
```

### CLAUDE.md Skeleton (Claude's Discretion for exact ordering)
```markdown
# Tetris — CLAUDE.md

## Project Overview
Browser-based Tetris with neon/synthwave aesthetic, global leaderboard via Firebase.
React 19 + Vite 6 + TypeScript 5.7 + Canvas 2D + Firebase Auth + Firestore.

<!-- Live URL: https://YOUR-PROJECT.vercel.app -->

## Commands
- `npm run dev` — local dev server (localhost:5173)
- `npm run build` — TypeScript check + Vite production build
- `npm test` — Vitest unit tests
- `npm run lint` — ESLint

## Stack (exact versions)
- React 19, Vite 6, TypeScript 5.7
- Firebase 12 (modular SDK — tree-shakeable imports only)
- Canvas 2D (no game framework)
- CSS custom properties (no CSS-in-JS)

## Architecture Decisions (WHY)
[Canvas not DOM, useRef not useState, rAF not setInterval, SRS wall kicks, Firestore one-doc-per-user]

## Never Do
- Never use useState for game loop state (causes 60 re-renders/sec)
- Never use setInterval for game loop (use rAF + delta-time)
- Never apply CSS glow to DOM cells (Canvas only — prevents paint storms on mobile)
- Never add Firestore fields without updating security rules

## File Map
src/engine/   — pure TS game engine (no React dependencies)
src/renderer/ — Canvas 2D rendering
src/firebase/ — Auth and Firestore integration
src/hooks/    — useGameEngine, useAuth
src/components/ — React UI components
src/contexts/ — AuthContext

## GSD Workflow
This project was built with /gsd:plan-phase.
Planning files live in .planning/.
To continue: /gsd:plan-phase → select next phase.
```

### README.md Structure
```markdown
# Tetris

> Neon synthwave Tetris with a real global leaderboard.
> Live: [https://YOUR-PROJECT.vercel.app](https://YOUR-PROJECT.vercel.app)

## Features
- All 7 tetrominoes with SRS rotation + wall kicks
- Hold piece, next piece preview (3 ahead)
- Ghost piece, hard drop, soft drop
- Back-to-back Tetris and combo bonuses
- Neon glow rendering via Canvas 2D
- Google sign-in + global leaderboard (top 10)
- Mobile touch controls

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.7 |
| Build | Vite 6 |
| Rendering | HTML5 Canvas 2D |
| Auth | Firebase Auth (Google) |
| Database | Cloud Firestore |
| Hosting | Vercel |

## Local Setup
[npm install, cp .env.example .env, fill in values, npm run dev]

## Environment Variables
[List of 6 VITE_FIREBASE_* keys with where to find them]

## Architecture Notes
[Why useRef not useState, Why Canvas not DOM, Why SRS]

## Contributing
[fork, branch, PR instructions]
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Project |
|--------------|-----------------|------------------------|
| Hardcode Firebase config in source | `import.meta.env.VITE_*` + `.env` gitignored | ALREADY DONE in Phase 3 |
| `process.env` (Create React App) | `import.meta.env` (Vite) | Already using correct pattern |
| `master` as default branch | `main` as default branch | Must rename before push |
| Netlify for React SPAs | Vercel equally capable, zero-config Vite support | User chose Vercel |

**Deprecated/outdated:**
- `REACT_APP_*` prefix: Only for Create React App. This project uses Vite — use `VITE_*` prefix only.
- `process.env.REACT_APP_*` references: Should never appear in this codebase.

---

## Open Questions

1. **GitHub repo name**
   - What we know: User will create the repo manually
   - What's unclear: Exact repo name (affects remote URL)
   - Recommendation: Plan should use `USERNAME/REPONAME` as placeholder; user fills in during execution

2. **Vercel project name / final URL**
   - What we know: Will be `PROJECT-NAME.vercel.app` format
   - What's unclear: Exact subdomain (assigned by Vercel or chosen during import)
   - Recommendation: Plan must include an explicit step to copy the URL and add it to Firebase Authorized Domains after first deploy; README should use placeholder

3. **Firebase App Check**
   - What we know: STATE.md flagged this as a pre-deploy decision
   - Resolution: Out of scope for Phase 4 — do not implement; document as v2 follow-up

---

## Sources

### Primary (HIGH confidence)
- Vercel official docs (vercel.com/docs/frameworks/frontend/vite) — Vite on Vercel, SPA routing, env vars, zero-config detection
- Vercel official docs (vercel.com/docs/git/vercel-for-github) — GitHub integration, auto-deploy, production branch behavior
- Direct file reads — `src/firebase/config.ts`, `.env.example`, `.gitignore`, `App.tsx`, `package.json` — verified current state

### Secondary (MEDIUM confidence)
- WebSearch: Firebase Authorized Domains + Vercel URL — multiple sources confirm `auth/unauthorized-domain` is a common production pitfall; Firebase Console path verified from memory of Firebase Auth docs structure
- WebSearch: CLAUDE.md best practices — humanlayer.dev blog (verified against Claude Code official docs pattern); builder.io guide

### Tertiary (LOW confidence)
- WebSearch: GitHub master → main rename workflow — standard git commands, widely documented, LOW only because not verified against official git-scm docs directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via official Vercel docs and direct file reads
- Architecture patterns (env vars, routing): HIGH — official Vite docs + direct code verification
- SPA routing decision (no vercel.json): HIGH — verified App.tsx has no router
- Firebase Authorized Domains pitfall: HIGH — multiple independent sources confirm, consistent with Firebase Auth behavior
- CLAUDE.md structure: MEDIUM — community best practices, no single authoritative spec
- Git branch rename workflow: MEDIUM — standard git operation, widely documented

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days — stable tooling: Vercel/Vite/Firebase all mature)
