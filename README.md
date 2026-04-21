# 🛡️ CodeGuard AI

**Your AI wrote the code — now let AI audit it.**

CodeGuard AI is a full-stack code review and security audit tool that catches vulnerabilities, bugs, and performance issues in vibe-coded applications. Paste code or drop a GitHub PR URL, pick which checks to run, and get back a graded report with CWE/OWASP tags, impact analysis, and copy-pasteable fixes.

## Why this exists

Vibe coding — prompting an LLM and shipping the output — gets you to a working app fast, but it also ships with security holes: hardcoded keys, SQL injection, `eval`-based input handling, debug mode in production. Linters miss most of this; CodeGuard wraps GPT-4o with a dedicated security-engineer prompt to catch what slips through.

## Features

- 🔒 OWASP Top 10 + vibe-code antipattern detection (SQLi, XSS, RCE, hardcoded secrets, broken auth, insecure deserialization)
- 🐛 Bug detection — null refs, race conditions, unclosed resources, dead code
- ⚡ Performance checks — N+1 queries, sync-in-async, missing pagination, memory leaks
- ✨ Style smells — magic numbers, leftover debug code, deep nesting
- 📐 Letter grade (A-F) with animated score ring
- 🧩 Multiple fix alternatives per issue with tradeoff notes
- 🎯 One-click "Apply Fix" and "Apply All Fixes" directly in the Monaco editor
- 🔗 GitHub public PR import — fetch changed files and review them
- 📄 Markdown report download with CWE/OWASP metadata
- 🌙 Dark theme, responsive, keyboard-friendly

<!-- TODO: add screenshots of the review panel and GitHub PR flow -->

## Quick start

```bash
git clone <this-repo> codeguard-ai
cd codeguard-ai
cp server/.env.example server/.env    # add your OPENAI_API_KEY
make install
make dev
```

Then open http://localhost:5173.

Click **Load Example** → **Run Review** to see the vulnerable Flask app get shredded.

## Tech stack

- **Frontend:** React 18 (Vite) + Tailwind CSS + Monaco Editor
- **Backend:** Node.js + Express (ES modules)
- **AI:** OpenAI GPT-4o via the official SDK
- **No database** — session-based, everything lives in React state

## Project structure

```
codeguard-ai/
├── client/                    # Vite + React frontend
│   └── src/
│       ├── components/        # CodeEditor, IssueCard, ScoreCard, etc.
│       ├── hooks/             # useReview (API + state)
│       ├── utils/             # exampleCode, exportReport
│       └── App.jsx
├── server/                    # Express API
│   └── src/
│       ├── routes/review.js           # POST /api/review + /api/review/github
│       ├── services/analyzer.js       # OpenAI call + JSON validation
│       ├── services/github.js         # Public PR diff fetcher
│       ├── prompts/security-review.js # System prompt template
│       └── utils/lineNumberer.js
├── Makefile
└── package.json               # concurrently runner
```

## API

### `POST /api/review`
```json
{
  "code": "...",
  "language": "python",
  "categories": ["security", "bugs", "performance", "style"]
}
```

### `POST /api/review/github`
```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "categories": ["security"]
}
```

## Built by Danis Gabitov

- GitHub: [@walkinn](https://github.com/walkinn)
- LinkedIn: [danis-gabitov](https://linkedin.com/in/danis-gabitov)
