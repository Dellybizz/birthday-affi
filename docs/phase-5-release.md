# Phase 5 — Save, versions, private preview, publish and rollback

This supersedes the earlier release-readiness scaffolding checklist and follows `phase-wise-plan.md`.

## Implemented

- Autosave 1.5 seconds after a committed editor change. Inspector fields commit on blur.
- Serialized saves: subsequent edits remain pending and use the revision returned by the previous save. Concurrent requests cannot silently overwrite a newer draft.
- Visible waiting/saving/saved/error/conflict states. Explicit retry for failed requests; conflict pauses saving and provides local JSON download and reload actions. An unload warning protects unsaved changes. This does not provide offline durable storage.
- Optimistic draft revision checks in the database, with row locks that serialize version numbering and publication for each page.
- Atomic draft snapshot + draft update + audit; unchanged saves do not create versions.
- Append-only page versions. Editors can save draft versions; only owners can publish or roll back.
- Atomic publication validates the saved document, rejects an empty page, inserts its immutable publication and switches the live pointer in one transaction. Repeated publication of the same document is idempotent.
- Version-history UI shows the latest 50 records, private version preview, restore-to-draft and owner-only live rollback. Restore is an undoable draft edit. Rollback appends a new published snapshot and retains the working draft.
- Private previews run on the authenticated admin origin at `/preview/[pageId]`; a version parameter selects a saved immutable snapshot. Preview pages require a current admin session and use no-store/noindex/no-referrer responses. No service-role key or shareable secret is needed.
- The old public `/preview/[slug]` route now returns not-found. Published home and app pages use the published-document RPC; visitors need no login.

## Database activation and evidence

`20261001070358_phase5_versioned_publishing.sql` is applied to dedicated Supabase project `brdkbxlqendywbkdiuvr`. A hosted transaction under an existing owner-session identity exercised save, stale conflict, publish, later draft isolation, rollback and version immutability; all test rows were rolled back. Post-test verification found eight birthday pages, zero published pages, zero leftover test sites and zero versions.

This hosted check uses SQL session claims, not a deployed browser or Auth/Data API test. The migration changes no real recipient content or publication pointer.

## Verification

- 14 Phase 5 database tests, including role restrictions, unsafe documents, immutable history, cross-page rollback rejection and forced publication-failure atomicity.
- Six autosave queue tests: single-flight saves, in-flight edits, conflicts, retry, undo during a request and state notifications.
- Existing 48 content/editor/rendering/security tests pass.
- Both app TypeScript checks and production builds pass.
- Hosted security advisor reports no new Phase 5 findings. Existing warnings are the intentionally public published-only RPC and disabled leaked-password protection. References: [public RPC advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Release and next phase

Frontend deployment and live-browser acceptance are tracked separately from the hosted database acceptance above. Phase 6 adds media upload/picking/metadata. Scheduled publishing, signed guest preview links, revision comparisons and automated snapshot retention are outside this phase. Existing immutable snapshots are retained; the history UI lists only the latest 50.

Sources: [Supabase database functions](https://supabase.com/docs/guides/database/functions), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
