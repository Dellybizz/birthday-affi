# Phase 2 — Database and admin authentication

## Scope and result

This implements the database/auth phase from the repository plan. The separately saved long-form plan numbers some features differently. Storage processing, the full content schema/renderer, release transactions and a working visual editor remain separate phases. Existing CMS/editor screens are scaffolding and are not certified by this change.

The admin application now signs in invited accounts using email/password and a cookie session. Middleware refreshes/verifies the user, checks the database role, and makes responses private/no-store. Server-rendered protected pages and every CMS mutation also check authorization. No application client uses a service-role key.

Roles follow the existing single-site role model: owner manages site settings and publishing; editor modifies draft/content/media; viewer reads. `admin_users` is a server-provisioned allowlist, and callers cannot alter their own role. These roles apply to the whole configured installation; site-by-site delegated membership is not yet implemented.

The new migration removes permissive legacy policies. Anonymous callers cannot query raw pages, versions, settings, assets or draft content. `get_published_document(site_slug,page_slug)` returns only the active published document, and only when the owner has explicitly opted that site into public delivery. Private delivery is the default. Recipient authentication/private delivery is still a later implementation task; the RPC does not enable a private recipient journey by itself.

Database triggers append audit records inside the successful write transaction. Callers cannot insert, edit or delete audit records, impersonate actors, or record private text/passwords in them. An owner-only guard rejects publishing by editors and cross-page version references.

## Files and activation

- `apps/admin/lib/supabase.ts`, `auth.ts`, `auth-config.ts`: cookie client and verified access.
- `apps/admin/middleware.ts`, `app/login`, `app/unauthorized`, `app/editor/layout.tsx`: session refresh, login/logout and protected navigation.
- Existing CMS/media/site actions: async session client, per-action permissions, database field mapping.
- `supabase/migrations/20260930222626_phase2_admin_security.sql`: policy repair, private default, audit triggers and published-only RPC.
- `scripts/seed-phase2.mjs`: owner provision and eight empty, unpublished draft pages. Reruns preserve existing drafts and settings.
- `tests/phase2.test.mjs`: executable Postgres access checks using PGlite.

Apply migrations in their existing order on a new/confirmed Wiffeyyyy OS project. The first migration creates existing tables and enums and is not an idempotent repair for an unrelated database. Do not apply it to the earlier birthday project. The connected `birthday-site` project has not been modified.

Copy `.env.example` to each app's `.env.local`, supply the selected project URL/publishable key and `NEXT_PUBLIC_SITE_SLUG`, and use matching deployment environment values. Invite/create the actual owner through Supabase Auth, then run the seed script with `OWNER_USER_ID` and a server-only `SUPABASE_SERVICE_ROLE_KEY`. The script verifies the user exists; it never creates a password or publishes content. Disable public signups for this owner-managed installation. Never put a service key in `NEXT_PUBLIC_*` variables.

Run `node scripts/seed-phase2.mjs` with those environment variables already supplied. Do not commit credentials. Public delivery requires an explicit owner decision before setting `sites.public_delivery_enabled=true`; this migration does not make that decision.

## Verification and limits

- 11 Postgres tests pass: anonymous isolation, non-admin denial, private default, scoped published reads, viewer restrictions, editor restrictions, owner draft/publish access, cross-page version rejection, role escalation prevention, audit integrity, immediate revocation.
- Both applications typecheck and production-build successfully. Missing baseline app metadata exports, renderer export/dependency and JSX configuration were repaired to make those checks executable.
- PGlite executes all repository migrations with Supabase auth roles modeled in the fixture. Its built-in UUID function replaces loading pgcrypto, which is unavailable in this test runtime. This is database-policy evidence, not hosted Supabase/Auth/Storage certification.
- Production HTTP smoke checks pass: the admin home, editor and unauthorized route redirect to login with no-store headers when configuration is missing; login shows a disabled form and health remains reachable. These checks do not substitute for live credential/session tests.
- Hosted migration execution, a real owner login/logout, session expiry/refresh, owner seed execution and deployment configuration are still pending project selection.
- Baseline repository has no standalone ESLint configuration; production builds/typecheck are recorded separately from a full lint certification.

## Live acceptance checklist

1. Confirm new project identity and migration order; apply migrations and check security advisors.
2. Provision the owner and seed; repeat the seed to confirm no draft loss.
3. Sign in/out on the deployed admin app; direct editor URLs reject anonymous accounts.
4. Verify viewer/editor/owner restrictions through the real Data API, including role revocation.
5. Verify session expiry refresh keeps valid sessions usable and rejected sessions cannot mutate.
6. Verify anonymous raw-table queries fail and private sites return no published content.
7. Check successful mutations append correct actor/site audit records without private content.

Phase 2 remains awaiting live activation and certification.

## References

- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/changelog

Current SSR documentation distinguishes `middleware.ts` on Next.js 15 from `proxy.ts` on Next.js 16; this repository stays on its installed Next.js 15 baseline.

## Hosted completion update — October 1, 2026

The activation and acceptance checklist is completed within the explicitly documented test limits. Username sign-in replaces the original email form. The hosted session guard additionally denies signed-out/expired-session access tokens. See `phase-2-acceptance.md` for the final evidence, intentional advisor notices and boundaries. Earlier pending-status paragraphs above describe the implementation baseline and are superseded by this update.
