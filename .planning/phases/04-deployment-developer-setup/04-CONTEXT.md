# Phase 4: Deployment + Developer Setup - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Get the Tetris game live on a public Vercel URL with auto-deploy on push to `main`, Firebase config secured in environment variables, CLAUDE.md documenting stack decisions and AI dev rules, a detailed README, `.env.example` for contributors, and the complete project committed and pushed to a public GitHub repository.

</domain>

<decisions>
## Implementation Decisions

### Hosting platform
- Deploy to **Vercel** (not Netlify)
- Default Vercel URL is fine — no custom domain
- Auto-deploy from `main` branch; push to main triggers redeploy
- Setup via **Vercel dashboard** (browser import from GitHub) — not CLI
- Firebase Console → Authentication → Authorized Domains must include the Vercel URL (required for Google sign-in popup to work in production) — include this as an explicit deploy step

### Environment variable setup
- Move Firebase config to **`.env` file with `VITE_` prefix** (e.g., `VITE_FIREBASE_API_KEY`) for local dev; Vite exposes them via `import.meta.env`
- `.env` is gitignored (no secrets in repo)
- **Commit `.env.example`** with all variable names and blank values so contributors know what's needed
- Add env vars to Vercel via **Vercel dashboard** (Environment Variables UI) — not CLI
- Update `firebaseConfig` in code to read from `import.meta.env.*`

### CLAUDE.md content
- Primary focus: **architecture + stack decisions** — the locked "why" behind Canvas vs DOM, `useRef` vs `useState`, SRS rotation, Firebase modular SDK, Firestore model
- Include explicit **"never-do" list**: never use `useState` for game loop state, never use `setInterval` (use rAF + delta-time), never put CSS glow on DOM cells (Canvas only), never add new Firestore fields without updating security rules
- Include **GSD workflow notes**: how this project uses GSD, phase structure, where `.planning/` files live, how to continue dev with `/gsd:plan-phase`
- Include a **live URL placeholder** section: `<!-- Live URL: https://YOUR-URL.vercel.app -- >` for me to fill in after first deploy

### GitHub repo + commit strategy
- **Public** repository
- **Preserve full commit history** — all phase commits stay, showing project evolution
- Plan includes a **final commit + push** at end of Phase 4: `git push origin main`
- Include a **detailed README.md** with: project name/description, live Vercel URL placeholder, features list, tech stack (React 19, TypeScript, Vite, Firebase, Canvas 2D), architecture notes (why useRef, Canvas, SRS), local setup instructions (`npm install && npm run dev`), env var setup, contribution guide

### Claude's Discretion
- Exact CLAUDE.md structure and section ordering
- README tone and formatting style
- Whether to add a `vercel.json` config file (only if needed for SPA routing)
- Exact `.gitignore` additions (`.env`, `node_modules`, `dist`)

</decisions>

<specifics>
## Specific Ideas

- Firebase Authorized Domains step must be called out explicitly in the plan — easy to miss and blocks Google sign-in in production
- `.env.example` should show all required `VITE_FIREBASE_*` keys with empty values — safe to commit, guides contributors
- README should be detailed enough to function as portfolio documentation, not just a quick-start guide

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-deployment-developer-setup*
*Context gathered: 2026-03-03*
