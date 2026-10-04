# C1 — Versioned site settings, Part A

Implemented 1 October 2026.

## Delivered
- Strict SiteDocument v1: name, nickname, birthdate, timezone, title, greeting, welcome message/button, background/surface/text/accent, radius, default volume and mute.
- Separate private settings drafts and immutable published settings snapshots.
- Owner-only save/publish RPC, revision conflict checks and RLS-protected configuration tables. Published reads return only the active snapshot for sites with public delivery enabled.
- Settings/Theme/Audio dashboard links now open a functioning shared settings screen.
- Local private settings preview, explicit save, publish-saved action and reset to loaded values.
- Public shell title/date timezone, fallback welcome/home personalization, shell theme tokens and first-use media volume/mute defaults. Visitor-saved audio choices take precedence.
- Supabase migration applied; current site has one private configuration and zero published settings. No personal settings were fabricated or published.

## Validation
125 tests pass, including new settings validation and SQL checks for owner permissions, anonymous draft denial, stale revisions and immutable published snapshots. TypeScript checks pass. Production builds are checked for this release. Security advisors reported only existing published-page RPC and leaked-password-protection warnings; no new configuration warning.

## Boundaries
This is C1 Part A, not all global controls:
- Settings preview is a local summary, not the complete interactive OS preview (C3).
- Published home/welcome CMS documents keep their authored copy; fallback screens bind personalization. Complete named-slot bindings are later completion work.
- Some app-specific accent styles remain fixed. Font, shadows, motion tokens, starting-screen duration, locale and configurable notifications remain.
- Audio supports default volume/mute; cross-route radio, station defaults and interruption/resume policy controls remain C4/C6.
- Publication applies settings alone; atomic settings/navigation/pages releases are C8.
- Authenticated browser authoring/publication and live deployment verification are still pending.

Existing page documents and versions are unchanged. The dedicated birthday database is the only project modified.

