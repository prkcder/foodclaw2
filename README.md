# foodclaw2

AI-assisted food ordering autopilot MVP.

## MVP Goal
Order food so it arrives around the user's home-arrival time, while respecting dietary restrictions, preferences, schedule, and budget.

## Monorepo Structure

- `apps/api` — REST API + webhook endpoints
- `apps/worker` — scheduling + agent loop executor
- `packages/db` — Prisma schema + DB access
- `packages/shared` — shared types, enums, and utilities
- `docs` — architecture and API spec

## Core Flow (v1)
1. User connects calendar and one or more delivery providers.
2. User sets dietary restrictions/preferences, home location, and ordering policy.
3. Worker detects a likely "heading home" event window.
4. Planner builds candidate meals from provider menus and filters by restrictions.
5. Agent ranks candidates and decides:
   - auto-order if confidence high + policy allows
   - ask user quick confirmation otherwise
6. Provider adapter places order, tracks status, and pushes updates.

## Getting Started (scaffold)

```bash
cd foodclaw2
npm install
npm run dev
```

If `npm run dev` fails with `Cannot find package 'express'`, run `npm install` at the repo root (not inside `apps/api`) so npm workspace dependencies are linked correctly.

## Scripts
- `npm run dev` — run API + worker in watch mode
- `npm run build` — build all packages/apps
- `npm run lint` — lint workspace

## Notes
This scaffold includes a mock provider adapter for MVP demos. Real provider adapters can be added under `apps/api/src/providers`.
