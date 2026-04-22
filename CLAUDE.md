# codeguard

> Inherits `C:\Coderanger\CLAUDE.md`. Only overrides/additions below.

## Project summary

**codeguard-ai** — AI-powered code review & security-audit tool. Detects OWASP Top 10 vulnerabilities in vibe-coded apps, proposes fix alternatives, offers one-click "Apply All Fixes" PR integration.

**Deployed:** [codeguard-ai.vercel.app](https://codeguard-ai.vercel.app)

## Layout — monorepo

| Folder | Purpose |
|---|---|
| `client/` | Vite + React + Tailwind frontend |
| `server/` | Shared backend logic (prompts, analyzers, formatters) — no HTTP layer |
| `api/` | Vercel serverless handlers that call into `server/` |

Never put HTTP handlers in `server/`. Never duplicate `server/` logic in `api/`.

## Key files

- `api/review.js` — main review endpoint (POST: analyse code, return findings + fixes)
- `api/review/github.js` — GitHub PR integration (webhook + comment-driven review)
- `server/src/services/analyzer.js` — core vulnerability detection pipeline
- `server/src/prompts/security-review.js` — Claude system prompt for review calls

## Design system

- Monochrome: black + white + glass / translucent panels
- Rainbow gradient dots are the **only** accent color — used sparingly as status/brand indicators
- **No emojis** anywhere — UI, code comments, commit messages, PRs
- No bold above font-weight 500
- Glass = `backdrop-blur` + semi-transparent — no drop shadows stacked on top

## Project-specific rules

- **`api/*` is load-bearing — STOP before editing.** Summarise intent, wait for approval
- `server/src/prompts/*.js` is load-bearing. Prompt edits reviewed before commit
- Model pin: `claude-sonnet-4-6`. Do not bump without approval
- `api/review.js` `max_tokens`: **4096** — do not raise
- `vercel.json` `maxDuration` for review endpoints: **60**
- GitHub webhook: verify signature, never log raw bodies

## Scripts

- `npm run dev --prefix client` — Vite dev server
- `npm run build --prefix client` — production bundle
- `npm test` — server test suite (when present)
