# Frontend — Next.js App

The LangChoice frontend is a Next.js 16 app with App Router. It shows a grid of programming languages, lets users cast a vote with a username and reason, and shows a live leaderboard.

## Tech

- Next.js 16.2 with App Router
- React 19
- Tailwind CSS v4
- TypeScript

## Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── [...path]/
│   │       └── route.ts    Runtime API proxy — reads BACKEND_URL at request time
│   ├── globals.css          Global styles + CSS variables + keyframes
│   ├── layout.tsx           Root layout — fonts, metadata
│   └── page.tsx             Main page — nav, hero, tab switcher
├── components/
│   ├── LanguageGrid.tsx     Card grid of languages with vote bars
│   ├── Leaderboard.tsx      Ranked list with progress bars
│   └── VoteModal.tsx        Modal — username + comment form
├── lib/
│   ├── api.ts               API client functions (getLanguages, castVote, etc.)
│   └── types.ts             TypeScript interfaces
├── Dockerfile               3-stage build: deps → builder → runner
└── next.config.ts           output: standalone only
```

## Running locally

```bash
# Install dependencies
npm install

# Create local env file
echo 'BACKEND_URL="http://localhost:5000"' > .env.local

# Start dev server
npm run dev
# App runs on http://localhost:3000
```

Make sure the backend is also running on `:5000`.

## Environment variables

| Variable | Description |
|---|---|
| `BACKEND_URL` | Backend service URL — read at **runtime**, not build time |

Never commit `.env.local`. It is already in `.gitignore`. In Kubernetes this value comes from a ConfigMap.

## How the API proxy works

The frontend never calls the backend directly from the browser. Instead:

1. Browser calls `/api/languages` (same origin)
2. Next.js server receives the request at `app/api/[...path]/route.ts`
3. Route handler reads `process.env.BACKEND_URL` at request time
4. Forwards the request to `BACKEND_URL/api/languages`
5. Returns the response to the browser

This means the same Docker image works in every environment. You change `BACKEND_URL` in the ConfigMap and restart the pod — no rebuild needed.

This approach was chosen because `next.config.ts` rewrites run at **build time** — the destination URL gets compiled into `server.js` and cannot be changed at runtime.

## Docker build

```bash
docker build -t langchoice-frontend .
docker run -p 3000:3000 \
  -e BACKEND_URL=http://localhost:5000 \
  langchoice-frontend
```

The Dockerfile has three stages. Stage 1 (`deps`) installs npm dependencies — this layer is cached and skipped on subsequent builds unless `package.json` changes. Stage 2 (`builder`) copies source and runs `npm run build`. Stage 3 (`runner`) copies only the `.next/standalone` output, `.next/static`, and `public/` — the final image is around 180MB instead of 1GB+.


## Key design decisions

**No `NEXT_PUBLIC_*` variables** — these get baked into the bundle at build time. Using a server-side route handler instead lets the backend URL be injected at runtime from a ConfigMap.

**`output: standalone`** — Next.js standalone mode bundles the Node server with minimal dependencies, making the Docker image significantly smaller.