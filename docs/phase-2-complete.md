# Historical CMS scaffolding notes

These earlier notes are not Phase 2 acceptance evidence. Current database/auth status and live blockers are recorded in `phase-2-database-auth.md` and `phase-2-progress.md`.

## Implemented
- CMS document schema v2 with sections, blocks, properties, visibility and theme.
- Supabase-backed public published-document reader.
- Dynamic CMS renderer for headings, text, app grid and images.
- Admin draft retrieval and page-version retrieval.
- Draft save, versioned publish and rollback actions.
- Site settings persistence for theme, personalization and feature flags.
- App-specific content item persistence for the six Wiffeyyyy OS experiences.
- Media asset registration/deletion and media listing services.
- Private preview route using the published CMS document.

## Phase 2 activation requirements
Production use still requires external environment setup: Supabase project credentials, migration execution, Storage buckets, an authenticated admin owner, seed content, and Vercel deployment. Credentials are not committed to Git.
