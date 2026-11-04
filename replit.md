# Warehouse Portal

Mobile-first prototype resource hub for a promotional-products warehouse.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

An internal hub that complements, rather than replaces, the existing LMS. Employees access SOPs and e-learning; managers additionally access blank document templates and employee device registration. Content-editor managers manage shared resources.

## User preferences

- This is a proof of concept that the user's IT team will rebuild from scratch. Prioritize clear, realistic workflows and simple, readable code over production-grade security or scale.
- Authentication is intentionally simulated: seeded manager picker, no passwords, and manager-assisted employee device registration.
- Warehouse employees use phones on the floor. Aim for resources reachable within two taps of home.
- Managers keep completed assessments and meeting files on their own computers; the portal hosts only blank master copies.
- Archived resources are hidden, never deleted.

## Gotchas

- Demo manager entry is not secure company SSO. Do not use this prototype for confidential content or operational procedures without the IT rebuild.
- Seeded documents are marked demonstration content; e-learning requires an actual MeetQuinn share URL supplied by a content editor.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
