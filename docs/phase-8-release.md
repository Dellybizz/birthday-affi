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

Production database: migration `phase8_app_blocks` applied successfully to the dedicated project `brdkbxlqendywbkdiuvr`; local filename matches the recorded remote version `20261001134154`. A live, read-only assertion query accepted all six new app component types. No personal content or existing publication was changed.

Source was pushed to GitHub branch `codex/phase2-database-auth`, source commit `d41b8c8c1ce2a2fcd7a830b19b8900e6da2a725f`, tree `777cf2770c2c4f117c7a2bd3460b70b2fc5260b2`. The final full test run reports 103 passing, zero failing. Both production builds and TypeScript checks passed.

Deployment remains pending. The Vercel connector returned `Tool deploy_to_vercel not found`. The browser upload flow accepted the source archive but only creates new projects; requesting the existing project returned `Project "wiffeyyyy-os" already exists`. No duplicate project was created. The existing Vercel project's Git settings show that its GitHub application must be installed before a repository can be connected. Granting that repository access requires the user's approval. Both public site and admin therefore remain on their previous deployments; no Phase 8 live-browser interaction verification is claimed.

To continue, authorize the Vercel GitHub app for only `Dellybizz/birthday-affi`, connect both existing projects to that repository, and deploy the current branch using their existing `apps/web` and `apps/admin` root settings. Keep existing production environment values. Then verify reason filters/favourites, Hotline answer/keypad/end, adventure persistence, movie chapter persistence, kiss confirmation/receipt persistence and Radio selection/persistence. Actual media playback requires supplied files and Storage activation.
