# Hosting the frontend at a2aconnect.dev

Primary site stack is **Node.js (Next.js)** in `apps/web`.

## Option A — Cursor App Hosting (fastest)

From this agent chat, use **Publish** on the `apps/web` app (slug `a2aconnect`).

1. Open the Publish dialog on the agent (Cursor 3.29.8+ or [cursor.com/agents](https://cursor.com/agents)).
2. Accept publishing terms.
3. Choose visibility: **private**, **public**, or **team** (if offered).
4. Confirm. The preview pill opens the live app.

Local preview while deciding: `http://127.0.0.1:4783`.

## Option B — Vercel (custom domain a2aconnect.dev)

```bash
cd apps/web
npm ci
npm run build
```

- Framework preset: Next.js
- Root directory: `apps/web`
- Build command: `npm run build`
- Install: `npm ci`
- Point **a2aconnect.dev** (and `www`) DNS to Vercel

`apps/web/vercel.json` is included for framework hints.

## Option C — Docker / VPS

```bash
docker build -t a2aconnect-web .
docker run -p 8000:8000 a2aconnect-web
```

Or:

```bash
cd apps/web && npm ci && npm run build
HOSTNAME=0.0.0.0 PORT=8000 npx next start -H 0.0.0.0 -p 8000
```

## Local

```bash
cd apps/web
npm install
npm run dev
# → http://127.0.0.1:4783
```

## Health

`GET /healthz` → `ok`

## Documentation hub

See [docs/README.md](./README.md).
