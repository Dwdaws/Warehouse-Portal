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

E-learning viewing records identify the signed-in person and browser, with first/last open times and repeat-open counts. Managers access the Viewing Report through Manager Toolkit.

## User preferences

- This is a proof of concept that the user's IT team will rebuild from scratch. Prioritize clear, realistic workflows and simple, readable code over production-grade security or scale.
- Authentication is intentionally simulated: seeded manager picker, no passwords, and manager-assisted employee device registration.
- Warehouse employees use phones on the floor. Aim for resources reachable within two taps of home.
- The portal is an on-demand reference tool, not a learning "have-to": employees should be able to look something up when they need help doing their work. Prioritize finding practical answers over course assignments, completion targets, or compliance-driven prompts.
- The portal should fit Hit Promotional Products' branding while remaining a practical internal warehouse reference tool, not a promotional-products sales catalog.
- The user approved the Hit-branded desktop and phone designs for the live portal. Retain that direction rather than reverting to the original generic yellow hazard-stripe identity.
- Distinguish people by job level: Frontline Employee, Lead, Supervisor, and Manager, rather than showing their warehouse area as the home-page identity label.
- Display a safety disclaimer telling employees not to use the portal while operating heavy machinery or in the path of moving equipment, and to stop in a safe location before using their device.
- Employees should be able to read Word reference documents directly in the app rather than being required to download them. The user is also willing to supply PDFs when exact document layout matters.
- Managers keep completed assessments and meeting files on their own computers; the portal hosts only blank master copies.
- Archived resources are hidden, never deleted.
- Managers need additional areas such as Talent Management. Talent Management resources are manager-only.
- Content groups classify resources by substance separately from area and audience: Inbound, Putaway and Storage, Orders and Transfers, Distribution Outbound, Inventory Accuracy, and System How-Tos and References. Editors may also enter additional group names.
- Viewing records count e-learning page opens, not viewing progress, attention, or completion. The existing LMS remains the completion source of truth.
- The user expects MeetQuinn to email them when an employee finishes a module; the portal's page-open report is sufficient alongside those completion notifications. Email delivery has not been verified here.
- Browser identifiers are not hardware fingerprints: shared phones follow the signed-in employee, and clearing cookies creates a new browser identity.
- Keep the existing embedded PDF viewer. The user chose to retain it despite Chrome blocking it in some embedded previews; Full screen and Download remain alternatives.

## Gotchas

- Demo manager entry is not secure company SSO. Do not use this prototype for confidential content or operational procedures without the IT rebuild.
- Seeded documents are marked demonstration content; e-learning requires an actual MeetQuinn share URL supplied by a content editor.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
