# AI Sales Assistant

Monorepo MVP: Telegram bot + Mini App + API that helps a sales manager track leads and get AI-assisted suggestions during a deal.

## Features

- Telegram bot as the entry point (`/start`, `/app`) that opens a Mini App for the manager.
- Fastify API backed by PostgreSQL (Prisma ORM) for leads/deals data.
- OpenAI-powered assistant for sales suggestions.
- React + TypeScript + Tailwind Mini App UI.

## Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Fastify, Prisma, PostgreSQL
- **Telegram:** grammY
- **AI:** OpenAI API

## Project Structure

```
apps/web  — Telegram Mini App (manager UI)
apps/api  — Fastify API + Prisma
apps/bot  — Telegram bot (/start, /app)
```

## Setup

```bash
npm install
cp .env.example .env      # fill in your values
npm run prisma:generate
npm run prisma:migrate
npm run dev                # runs web + api + bot together
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for AI suggestions |
| `OPENAI_MODEL` | OpenAI model name |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_MANAGER_CHAT_ID` | Manager's chat id for notifications |
| `TELEGRAM_WEBAPP_URL` | Public HTTPS URL of the Mini App |
| `API_BASE_URL` | Base URL the bot/web use to reach the API |
| `JWT_SECRET` | Secret for signing auth tokens |

## Dev ports

- API: `http://localhost:3000`
- Web: `http://localhost:5173`
