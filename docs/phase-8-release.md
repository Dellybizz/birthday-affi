# Phase 8 — Six apps

Implemented six experiences using the existing public shell and versioned CMS documents. Unpublished apps display clearly labelled sample content; personal content is supplied through the editor and published normally. Existing generic published pages remain supported.

- Reasons: category filters, favourites and optional photos; favourites persist locally.
- Hotline: answer/end-call state, ordered keypad messages, native audio controls and readable text/transcripts.
- Adventure: ordered choices, per-choice invitation reveal and saved choice.
- Movie: ordered scenes, chapter navigation, native inline video controls and readable captions/transcripts; selected chapter persists.
- Kiss Shop: configurable gifts and playful prices, confirmation dialog, idempotent local redemption receipts, receipt reopening and keyboard dismissal. Receipts are browser-local promises, not server orders or automated fulfilment.
- Radio: ordered track selection, previous/next, dedications and native audio controls; selected track persists.

Missing audio/video is labelled honestly with readable text available. Failed media has a retry action. Switching scene/track or ending a call unmounts its player. Nothing autoplays. The global one-source controller, playback-position persistence and timed caption tracks are Phase 9.

Six registered app item blocks expose title/body/category/invitation/price/media settings in the inspector. Tree order, hidden ancestors and published versions determine app content. The media picker uses the appropriate image/audio/video kind. Editor selection mode shows selectable item cards; saved draft preview and public delivery render the same app interactions. Style settings surround the complete app group; per-item interaction styling remains the app's shared design.

Browser progress is versioned, bounded and validated against current content IDs. Removed content is pruned; malformed state recovers; blocked storage falls back to in-memory operation with a visible notice; storage events synchronize tabs. Each app has its own reset. No visitor login or server-side visitor profile is introduced.

Validation: 103 tests (88 prior, 14 new Phase 8 state/database checks and one renderer test), TypeScript and both production builds pass. SQL tests cover writer-only save/publish, six app item types, unsafe input, media kind/readiness and existing cross-site guards. The additive database migration updates existing document validation and media-kind mapping without changing RLS or privileges. Production verification is recorded below after deployment.

The dedicated Supabase project still has no storage.objects relation. Real media uploads remain pending Phase 6 Storage activation. Security advisors report the existing intentional public get_published_document function and disabled leaked-password protection; this phase creates no new definer functions. References: https://supabase.com/docs/guides/database/functions and https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes. This migration uses no affected ltree, legacy PGP, btree_gist or custom operators. Advisor guidance: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
