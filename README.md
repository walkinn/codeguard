# codeguard

**your AI wrote the code — now let AI audit it.**

codeguard is a full-stack code review and security audit tool that catches vulnerabilities, bugs, and performance issues in vibe-coded applications. Paste code or drop a public GitHub PR URL, pick which checks to run, and get back a graded report with CWE/OWASP tags, impact analysis, and copy-pasteable fixes you can apply in one click.

---

## Why this exists

Vibe coding — prompting an LLM and shipping the output — gets you to a working app fast, but it also ships with surprising security holes: hardcoded keys, SQL injection, `eval`-based input handling, debug mode in production, N+1 queries, unauthenticated admin endpoints. Traditional linters miss most of this. codeguard wraps Anthropic Claude with a dedicated security-engineer prompt to catch what human review and static analysis commonly let slip through.

It is meant to be used *after* you've prompted your way to a working prototype and *before* you expose it to the internet.

---

## Features

- **OWASP Top 10 + vibe-code antipattern detection** — SQL injection, XSS, CSRF, RCE, hardcoded secrets, broken auth, insecure deserialization, SSRF
- **Bug detection** — null references, race conditions, unclosed resources, dead code, type mismatches, infinite-loop risks
- **Performance checks** — N+1 queries, sync-in-async blocking, missing pagination, memory leaks, catastrophic-backtracking regex
- **Style smells** — magic numbers, deep nesting, leftover debug code, missing error handling, inconsistent naming
- **Letter grade (A–F)** with a minimal score ring and a one-line verdict
- **Multiple fix alternatives** per issue, each tagged with its tradeoff
- **One-click apply** — "Apply Fix" on a single issue or "Apply All Fixes" to patch the whole editor
- **GitHub PR import** — paste a public PR URL, pick a changed file, review it
- **Markdown report download** — full audit including CWE/OWASP metadata and fix snippets
- **Category filters** — run only security, only bugs, or any combination
- **CWE + OWASP tagging** on every finding

---

## Quick start

```bash
git clone https://github.com/walkinn/codeguard.git
cd codeguard
cp server/.env.example server/.env    # add your ANTHROPIC_API_KEY
make install
make dev
```

Then open http://localhost:5173.

Click **Load Example** → **Run Review** to watch a deliberately-vulnerable Flask app get shredded.

### Without `make`

```bash
npm install
npm install --prefix client
npm install --prefix server
npm run dev    # concurrently runs client (5173) + server (3001)
```

---

## Configuration

`server/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...      # required
PORT=3001                         # optional, default 3001
```

Grab an API key from https://console.anthropic.com/.

---

## Deploying to Vercel

The project is Vercel-ready. The Express server in `server/` is only used for local dev; in production the same routes run as serverless functions under `api/` (configured in `vercel.json`).

```bash
npm i -g vercel
vercel                                    # link / create project, first deploy
vercel env add ANTHROPIC_API_KEY production
vercel --prod                             # redeploy with the env var
```

Vercel auto-detects `api/**/*.js` as Node serverless functions. Builds run `npm run vercel-build` (which installs client deps and produces `client/dist`). Functions have a 60s max duration — large GitHub PR reviews may hit this limit on the Hobby tier.

`vercel.json` at the repo root pins the build and function config, so `vercel` with default prompts works without extra tweaking.

---

## How it works

1. **Frontend** — Monaco editor in the left pane, results panel in the right. The user picks categories, clicks *Run Review*, and the code (or GitHub PR file contents) is POSTed to the backend.
2. **Backend** — `server/src/routes/review.js` prepends line numbers and hands the code to `services/analyzer.js`, which calls the Anthropic Messages API with a security-engineer system prompt.
3. **Model** — Claude returns structured JSON: issues with severity, category, line range, description, impact, CWE/OWASP tags, and one or more suggested fixes with tradeoff notes.
4. **Validation** — the backend validates the response shape and computes the letter grade and summary counts.
5. **Display** — issues render as cards grouped and filterable by category; each has tabbed fix alternatives you can preview, copy, or apply directly to the editor.

No database — everything lives in React state for the session.

---

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Monaco Editor
- **Backend:** Node.js + Express (ES modules)
- **AI:** Anthropic Claude via the official `@anthropic-ai/sdk`
- **Design:** monochrome glass UI with thin rainbow-dot accents (Linear / Raycast / Warp inspired)

---

## Project structure

```
codeguard/
├── client/                           # Vite + React frontend
│   └── src/
│       ├── components/               # CodeEditor, IssueCard, ScoreCard, FixTabs, ...
│       ├── hooks/useReview.js        # API call + result state
│       ├── utils/exampleCode.js      # the vulnerable Flask sample
│       ├── utils/exportReport.js     # markdown report builder + downloader
│       └── App.jsx
├── server/                           # Express API (local dev)
│   └── src/
│       ├── routes/review.js          # POST /api/review + /api/review/github
│       ├── services/analyzer.js      # Anthropic Claude call + JSON validation
│       ├── services/github.js        # public PR diff fetcher
│       ├── prompts/security-review.js# system prompt template
│       └── utils/lineNumberer.js
├── api/                              # Vercel serverless functions (production)
│   ├── health.js                     # GET  /api/health
│   ├── review.js                     # POST /api/review
│   └── review/github.js              # POST /api/review/github
├── vercel.json                       # Vercel build + function config
├── Makefile
└── package.json                      # root runner + shared deps
```

---

## API

### `POST /api/review`

```json
{
  "code": "…",
  "language": "python",
  "categories": ["security", "bugs", "performance", "style"]
}
```

Returns a JSON audit with `overall_grade`, `overall_score`, `verdict`, `summary`, and `issues[]`.

### `POST /api/review/github`

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "categories": ["security"]
}
```

Fetches all changed files in the public PR and audits them.

### `GET /api/health`

Liveness probe — returns `{ ok: true, service: "codeguard-ai", time }`.

---

## Scripts

From the repo root:

- `make install` — install root, client, and server deps
- `make dev` — run client and server concurrently
- `make client` — client only
- `make server` — server only

---

## Built by Danis Gabitov

- GitHub: [@walkinn](https://github.com/walkinn)
- LinkedIn: [danis-gabitov](https://linkedin.com/in/danis-gabitov)

---

## License

MIT
