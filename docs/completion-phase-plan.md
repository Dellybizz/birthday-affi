> Active editor correction: [Part 1 blueprint](editor-correction/part-1-blueprint.md). The user-approved seven-part correction sequence governs complete default pages and the Shopify-style editor. Earlier C-phase implementation is supporting infrastructure, not proof that the desired editor is complete.

# Wiffeyyyy OS — Completion implementation plan

Prepared 1 October 2026. This plan builds on the existing implementation; C0–C10 are completion phases and do not replace the original Phase 0–13 history. See shopify-control-map.md for current coverage.

## Product contract

The public website is a mobile phone operating-system experience: a phone-shaped screen, status bar, home screen and full-screen apps. On a phone it fills the available screen with safe-area spacing; on tablets and desktops it remains a centered phone-sized frame rather than stretching into a desktop dashboard. The admin editor can use a wider desktop workspace. This is a mobile-style website, not a native device operating system.

Use a short welcome, cream/blush theme, one accent colour, rounded icons, gentle motion and six distinct apps. Public access requires no account. The admin and all unpublished previews require authorization. Gifts and heartfelt content remain directly accessible; no quizzes, points or mandatory progression.

Hierarchy: site → pages/apps/navigation → sections → subsections/blocks → named elements. Every exposed setting must be validated, saved, previewed and consumed by the public renderer. Arbitrary executable code is not an editor setting.

All phases require schema/migration changes where needed, inspector controls, public rendering, draft isolation, useful failure states and appropriate automated checks. A phase is complete only after its intended authoring-to-public flow is verified.

## C0 — Baseline and editable contracts

Reuse existing nested CMS, auth/RLS, autosave, versions, responsive overrides and playback coordinator. Inventory public strings, routes, media and behaviors against the control map. Define named editable slots for every app's header, text, media, button and repeating item; shared controls may apply to groups rather than duplicating settings per instance.

Set up component modules with schema, defaults, inspector definitions, allowed parents and renderers. Preserve old documents through explicit schema migrations where needed. Record which controls are planned, implemented and live-verified.

Acceptance: no advertised setting is inert; migration fixtures retain existing drafts/versions; current regression suite passes.

## C1 — Versioned global settings and personalization

Replace placeholder admin Settings, Theme and Audio routes with working screens. Add a validated draft/published SiteDocument with immutable site snapshots. Keep credentials and admin identities outside it.

Controls:
- Recipient name, nickname, birthday, display date/timezone and greeting.
- Site title, welcome copy, loading duration, enter button and home message.
- Cream/blush/background/surface/text/accent tokens; typography, radius, shadows and motion preferences.
- Global volume/default mute, playback policy and default station; no automatic audible playback.
- Notification text, destination, enabled state and frequency.

Draft settings must remain private. Implement explicit publication of a site-settings snapshot as a safe intermediate capability; C8 will coordinate it with page snapshots.

Acceptance: edit nickname/theme in a private preview, verify unchanged public output, publish the settings snapshot and verify the public result.

## C2 — Page management and navigation

Extend existing create/template/duplicate support with title/metadata editing, safe slug changes, archive/restore, redirects and routing collision checks. Protect built-in routes and references to archived pages.

Build navigation tree controls: app/menu label, icon, order, visibility, route selection, submenu nesting and Start here badge. Validate depth/cycles and route references. Default phone home remains a two-column grid of the six apps.

Keep Birthday Letter, Photo Story and Final Reveal optional; link them only when enabled. They are unpublished starter drafts today.

Acceptance: create a page, edit it, add a navigation item, privately preview it, publish and visit anonymously; verify archive and redirects with no broken references.

## C3 — Complete editor controls and full-site preview

Add controls according to component capability:
- Text: semantic heading level, text/rich links, font family/size/weight, line height, letter spacing and alignment.
- Layout: per-side padding/margin, width/max-width/height, grid columns/gap, alignment and overflow.
- Appearance: backgrounds/gradients, borders, shadows, per-corner radius and opacity.
- Media: alt text, ratio, fit, size, focal crop, poster and loading behavior.
- Behavior: visibility, transitions and motion timing; respect reduced motion.
- Base/mobile/tablet/desktop inheritance, reset controls and invalid-setting feedback.

Reuse one full OS-shell renderer in public pages, saved authenticated preview and editor interactive mode. Selection overlays stay separate from runtime interactions. Unsaved local canvas and saved preview must clearly identify their state.

Acceptance: change each supported setting and see the same result in editor, saved preview and published output; keyboard operation and narrow admin panels remain usable.

## C4 — Activate media and finish playback infrastructure

Provision Supabase Storage, configure private buckets/policies and verify actual image/audio/video uploads. Expose upload status/retry, media selection, metadata, transcript/captions, usage warnings and reversible archive.

Extend playback ownership across routes where radio persistence is desired. Hotline/movie interrupt radio; resumption policy must be explicit. Preserve volume, mute and position safely; handle buffering, failed sources, hidden tabs and blocked local storage.

Acceptance: real upload → choose media → save → private preview → publish → anonymous delivery. Unpublished assets remain inaccessible. Playing a second source pauses the first; no sound starts before a user gesture.

## C5 — Welcome and home experience

Implement the requested brief Starting Wiffeyyyy OS welcome and single-tap entry. Home displays editable nickname/greeting, date widget and six rounded app icons in a two-column phone grid. Add an editable status bar and consistent home/back navigation. Handle mobile viewport height, browser chrome, safe areas, touch targets and on-screen keyboards; avoid horizontal overflow. The tablet/desktop public experience keeps the same phone layout in a centered frame. Each app shares a clear back/home control, title and spacing. Returning home preserves app progress.

Notifications are occasional, dismissible and link to the correct item; suppress interruptions while a recording/movie is playing. All content remains available after the birthday.

Acceptance: phone-sized home is readable and uncluttered, all six apps are reachable in any order, navigation/reload preserves progress and no notification interrupts media.

## C6 — Complete the six apps

### C6A — Reasons I’m Obsessed
Swipeable cards with previous/next buttons and keyboard alternatives, one reason/photo per card, optional categories and an editable heartfelt final card. Configure title/body/photo/alt/order, final-card designation and card appearance. Target 10–15 personal reasons; no forced completion gate.

### C6B — Birthday Hotline
Editable incoming-call screen, caller label/photo, Answer and decline/back controls, main voice message, keypad messages and text alternatives. Configure main recording, compliment/emergency-affection messages, labels/transcripts, order and player appearance. Keep audio user initiated.

### C6C — Our Next Adventure
Two or three meaningful choice steps leading to an invitation. Define choice groups and outcome mapping rather than unrelated standalone cards. Edit labels/options, photos, invitation copy, date/time/place and availability. Let her return/back or view the invitation directly; no gift gating. Only real arrangements become final content.

### C6D — Our Birthday Movie
Opening credits, photos/clips, chapter controls, captions and a birthday ending. Support a supplied finished film or explicit timed scene composition; do not present an unsequenced gallery as a finished movie. Edit chapters/timestamps, media/poster, captions/transcripts, credits and ending. Target roughly 2–4 minutes; show play/pause/replay/sound visibly.

### C6E — The Kiss Shop
Editable gifts with title/description/photo/playful kiss price. Product details, bag, quantity/remove, checkout confirmation and a downloadable receipt image with a text alternative. Explain gifts can be redeemed freely; no payment or purchase requirement. Target 4–6 gifts. Browser-local receipts are not server orders; automatic delivery is optional C10.

### C6F — Birthday Radio
Editable stations, recorded introductions, tracks and dedication notes. Configure station name/artwork, intro/track order, note, loop and next/previous controls. Visible play/pause/mute/volume and track progress. Reuse shared playback ownership and user-gesture start.

Acceptance per app: author representative content, preview actual interactions, publish, check reload/progress/back behavior, captions and failure states. Verify each app has its own purpose rather than repeating the same greeting.

## C7 — Reusable content and advanced authoring

Persist reusable sections in a library; support independent copies and explicitly linked global instances. Add stable instance IDs, versioned definitions, reference validation, impact previews and detach-to-copy. Expand search across pages/settings and improve revision comparison.

Acceptance: a linked update previews every affected instance; independent copies remain unchanged; rollback restores the correct definition versions.

## C8 — Whole-site releases and scheduling

Add immutable release manifests containing the site snapshot and exact page/component version IDs. Publish validates routes, media readiness and references, then atomically switches one active release. Later drafts never leak into it.

Add full-site private release preview, publish summary and whole-site rollback. Schedule only immutable reviewed releases, with timezone, cancellation, owner permissions, idempotent execution and visible failure/retry state.

Acceptance: publish globals/navigation/pages together; intentionally fail preflight and confirm no partial publication; rollback the entire release; schedule/cancel/retry without duplicates.

## C9 — Personal content, QA and production certification

Import actual nickname/birthday/greeting, reasons, voice recording, movie assets, gifts, radio selections and one achievable adventure plan. Replace all placeholder copy and broken media. Review privately before public publication.

Complete phone/tablet/desktop, iOS Safari/Android Chrome and other browser checks; keyboard/focus, contrast, zoom/reflow, reduced motion and captions. Measure representative content performance; test slow/offline networks, save conflicts and expired sessions.

Verify monitoring executes, configure database/media backups and perform an isolated restore drill. Retain referenced assets; use reviewed dry-run retention inventories before permanent cleanup. Keep the existing public URL; custom domain is optional.

Acceptance: complete author → preview → publish → anonymous visit → later draft isolation → rollback flow; real media works; remaining blockers are resolved with evidence. Target completion before 10 October, with scope assessed after C4; this is not an unverified delivery promise.

## C10 — Optional after the birthday-ready release

Automatic gift receipt delivery requires an explicit recipient/channel and server-side storage, permissions, retry/deduplication and delivery status. Visitor login is unnecessary for the basic keepsake. Optional privacy-conscious analytics, additional stations/pages and multiple recipients should not block the six-app release.

## Dependency order

C0 → C1 → C2 → C3; C4 can progress after the contracts are defined.
C5 and C6 require C1–C4.
C7 and C8 require stable editable documents and preview behavior.
C9 certifies the integrated release; C10 is optional.

## Content checklist

| Content | Needed |
| --- | --- |
| Personalization | Preferred name/nickname, birthday/timezone and greeting |
| Reasons | 10–15 specific reasons; optional photos; final heartfelt reason |
| Hotline | Main voice greeting; optional keypad recordings and transcripts |
| Adventure | One achievable plan, choices and final invitation |
| Movie | Photos/clips or finished film, credits, chapters and captions |
| Shop | 4–6 gifts/promises, descriptions and playful prices |
| Radio | A few authorized audio sources, notes and recorded introductions |

Source creation can proceed with placeholders, but final publication requires real content. This plan does not mark unfinished original phases complete or restart implemented features.

