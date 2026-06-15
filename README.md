# LogLens Frontend

Vite + React + TypeScript web UI for the LogLens observability platform.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **React Router** — routing
- **TanStack Query** — server state
- **Zustand** — auth persistence
- **Tailwind CSS** — dark theme (`#0A0D0F` / `#00FF9C`)

## Security

Never commit `.env` — it is gitignored. Copy `.env.example` to `.env` locally after cloning.


```bash
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173**

## Environment

Copy `.env.example` to `.env`. The dev server proxies API calls (avoids CORS):

| Variable | Purpose |
|----------|---------|
| `VITE_API_PROXY_TARGET` | Backend API (e.g. `https://api.madhavmaheshwaricreations.in`) |
| `VITE_INGEST_PROXY_TARGET` | Ingestor (e.g. `https://ingest.madhavmaheshwaricreations.in`) |

For a static production build without Vite proxy (requires CORS on API):

```env
VITE_API_BASE_URL=https://api.madhavmaheshwaricreations.in
VITE_INGEST_BASE_URL=https://ingest.madhavmaheshwaricreations.in
```

```bash
npm run build
npm run preview
```

## Features

| Page | Description |
|------|-------------|
| Auth | Login, register, join org |
| Dashboard | 24h stats, service overview, live feed |
| Search | Filters, log detail, permalinks, AI query |
| Live feed | WebSocket + polling fallback |
| Investigate | AI incident analysis (mock until backend) |
| Services | CRUD, API keys, SDK setup, test log ingest |
| Members | Invites, invite codes |
| Audit log | Mock until read API exists |

See `frontend.md` for the full API contract.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Notes

- AI features use mocks in `src/api/ai.ts` until the backend AI service is ready.
- Browser WebSocket cannot send JWT headers; live feed falls back to polling.
