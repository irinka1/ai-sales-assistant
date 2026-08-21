# AI Sales Assistant (MVP)

Monorepo with Telegram Bot + Telegram Mini App + API.

## Stack

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Fastify, Prisma, PostgreSQL
- Telegram: grammY
- AI: OpenAI API

## Project Structure

- apps/web - Telegram Mini App (manager MVP UI)
- apps/api - Fastify API + Prisma
- apps/bot - Telegram bot (commands /start and /app)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Fill environment variables in root `.env` (already created from template).

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run in dev mode (web + api + bot):

```bash
npm run dev
```

## Notes

- API runs on `http://localhost:3000`
- Web runs on `http://localhost:5173`
- Bot uses `TELEGRAM_BOT_TOKEN` and opens Mini App URL from `TELEGRAM_WEBAPP_URL`
- For database migrations, ensure PostgreSQL is running and use:

```bash
npm run prisma:migrate
```
