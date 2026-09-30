# Wiffeyyyy OS

A personalized birthday web experience built as a content-driven "mini phone" with a Shopify-style visual editor.

## Phase 0

Phase 0 establishes the repository contract, monorepo layout, architecture documentation, environment conventions, and implementation boundaries.

## Product

Wiffeyyyy OS is composed of:

- Reasons I'm Obsessed
- Birthday Hotline
- Our Next Adventure
- Our Birthday Movie
- The Kiss Shop
- Birthday Radio

The frontend is driven by structured page data so the admin can control content and presentation without changing application code.

## Core model

`Page → Section → Block → Field`

## Planned stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage, Realtime)
- Vercel deployment
- pnpm workspaces + Turborepo
- Zod for runtime validation

## Documents

- `docs/architecture.md`
- `docs/design.md`
- `docs/phase-wise-plan.md`
- `docs/editor.md`

## Status

Phase 0 — Foundation
