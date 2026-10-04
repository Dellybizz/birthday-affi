# Phase 2 hosted acceptance — October 1, 2026

## Result

Phase 2 database and authentication scope is complete. Public site: https://wiffeyyyy-os.vercel.app/. Admin: https://wiffeyyyy-panel.vercel.app/login. Dedicated project: `brdkbxlqendywbkdiuvr`. Owner username: `afnan`; no passwords are stored in repository files.

A live replay check initially failed: an access token retained draft access after logout. Migration `20261001015637_phase2_live_session_guard.sql` fixed this by requiring its signed session ID to exist in `auth.sessions`, match the user, and remain within `not_after`. The same check guards role lookup and every existing CMS RLS policy. Anonymous published-only delivery remains independent of admin sessions.

## Evidence

14 local PGlite database-policy tests pass. Production admin compilation/type checking passed in the preceding username deployment. 23 live checks passed against real Supabase Auth, the Data API and deployed Next.js middleware:

- viewer can read drafts
- viewer draft mutation denied
- viewer insertion denied
- editor draft mutation allowed
- editor publication change denied
- editor version publication denied
- editor site settings mutation denied
- viewer self escalation denied
- signed-in non-admin sees no draft
- anonymous raw table access denied
- private fixture public delivery denied
- anonymous delivery returns only published version
- audit captures authenticated actor without content
- audit forgery denied
- deployed viewer session can open editor for reading
- deployed expired-cache simulation refreshes session
- deployed expired-cache with unusable refresh redirects to login
- role revocation removes access with existing token
- revoked token mutation denied
- deployed existing session rejected after role revocation
- signed-out refresh token rejected
- signed-out access token loses draft access immediately
- signed-out access token mutation denied immediately

Earlier deployed HTTP form checks also passed for owner username login, dashboard/editor access, logout and anonymous redirects. A hosted transaction set an existing session lifetime into the past, asserted no CMS access, then rolled back; the actual owner session was preserved. Cleanup verification found zero QA sites/accounts, one admin owner and the original eight birthday pages. The temporary acceptance function was replaced with an inert HTTP 410 response.

## Test limits and intentional configuration

The expired access-token cache test deliberately changed the JWT expiry field, retaining the real refresh token. This exercises refresh and invalid-refresh handling; it is not a one-hour wall-clock soak of a naturally expired signed JWT. The separate session lifetime test executes against the hosted database.

Supabase advisors report intentional SECURITY DEFINER exposure for `get_published_document`: it returns only the active published document for an explicitly public site. Raw content tables remain inaccessible to anonymous callers. Leaked-password protection is disabled in the hosted Auth settings; no claim of paid Auth hardening or zero advisor warnings is made.

There is no public signup UI. Even independently created Auth accounts receive no CMS role or draft access; only administrative provisioning grants roles. This certifies the application allowlist boundary, not a provider-wide disable-signup setting.

Content import, media processing, a fully functioning visual editor, version/publish transactions and recipient-private access are later phases. Current public delivery requires no recipient login, as requested.

## Repeating live acceptance

`tests/live/phase2-acceptance.ts` is an administrative harness, not a production app route. It requires the standard server-only Supabase environment and `PHASE2_ACCEPTANCE_TOKEN_HASH` (SHA-256 of a fresh 32-byte token). Deploy it only for a confirmed test run with JWT verification enabled; POST the publishable key and the token in `x-qa-token`. It generates disposable users and a separate QA site and removes them in `finally`. Close/remove its deployed handler after the run. Do not expose the service key or test token in clients or logs.

## References

- https://supabase.com/docs/guides/auth/sessions#how-to-ensure-an-access-token-jwt-cannot-be-used-after-a-user-signs-out
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
