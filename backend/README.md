# shortly backend

Node.js URL shortener API — Postgres for storage, Redis for cache-aside reads and click counts.

## Endpoints

- `POST /shorten` — body is the raw long URL; returns `{"code", "short_url"}`
- `GET /r/:code` — redirects to the long URL (301/302 per `REDIRECT_STATUS`), counts the click
- `GET /stats/:code` — `{"code", "clicks"}`
- `GET /health` — `{"ok": true}`

## Run via Docker Compose

From the repo root:

```sh
docker compose up -d backend pg redis
```

## Run locally

```sh
cp .env.example .env   # adjust PGHOST/REDISHOST to localhost if pg/redis run in Docker with ports exposed
npm install
npm run dev             # nodemon, restarts on change
```

## Layout

```
src/
  config/     env var loading/defaults
  db/         Postgres pool + Redis client
  routes/     one file per endpoint group
  utils/      base62 encoding, header-safety checks
  app.js      Express app + route mounting
  server.js   entry point
```
