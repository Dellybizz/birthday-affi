# Shopify-style control map — 1 October 2026

## Verdict
The project has a working CMS/editor foundation but does not yet give control over every website element. “Built” below means source exists; it does not imply authenticated end-to-end or real-device certification.

## Phase map
| Phase | Delivered | Remaining |
| --- | --- | --- |
| 0 | Repo, packages, architecture contract | Keep contract aligned with actual behavior |
| 1 | Public/admin shells and responsive primitives | Full device/browser verification |
| 2 | Supabase, roles, auth, RLS and audit | Production backup/restore evidence |
| 3 | Nested page documents, registry, validation, renderer | Versioned site/global/navigation model |
| 4 | Layer tree, selection, inspector, add/duplicate/remove/reorder/hide, undo/redo | Every app's individual internal element and advanced controls |
| 5 | Autosave, conflicts, saved versions, page publish/rollback, private saved preview | Atomic whole-site releases and full-shell preview |
| 6 | Upload/library/picker/metadata/archive code | Storage provider activation and live-media proof |
| 7 | Welcome/home, OS shell, notifications and local state | Editable global copy, personalization, menus and notifications |
| 8 | Six interactive app types | Final personal content and renderer/editor parity |
| 9 | One-player ownership, playback persistence, captions/transcripts | Actual media and device testing; cross-route background radio |
| 10A | Templates, section import/export, layer search, revision comparison, breakpoint overrides/reset | Linked global components and scheduled publication |
| 11 | 120 regression tests and QA baseline; selected keyboard smoke | Full browser/device/accessibility/performance acceptance |
| 12A | Health revision/no-store, deployment smoke workflow and operations runbook | Active monitoring verification, storage, backups, restore drill and final import |

## Control hierarchy and completeness
Target: site → navigation/pages → sections → subsections/blocks → named elements.
Current page tree supports sections nested within sections and leaf blocks. App controls do not yet expose every internal button/label independently.

| Scope | Available now | Controls still required |
| --- | --- | --- |
| Recipient/site | Database fields; page-level text blocks | Name, nickname, birthday/timezone, greetings, brand/title, locale and public bindings |
| Navigation | Fixed six-app grid and shell links | Menus/submenus, icons, order, visibility, route picker and nested menu validation |
| Pages | Eight original pages; new create/template/duplicate UI; custom published routes | Rename/title editing, safe slug changes, metadata/SEO, archive/restore, routing redirects and navigation inclusion |
| Section/layer | Add, select, label, hide/show, duplicate, delete, reorder; nested content | Locking, per-side spacing, layout presets, linked global sections |
| Text | Heading/paragraph text, size, weight where available, alignment, colors | Heading semantics, font family, line height, letter spacing, links and rich text |
| Appearance | Background/text colors, scalar padding/margin/radius/opacity; breakpoint overrides/reset | Borders, shadows, gradients, widths/max widths, per-corner values and overflow |
| Images | URL/upload picker code, alt text, cover/contain, focal position and height | Aspect ratio, explicit width/max-width, crop tools and loading priority |
| Video | URL/picker, description, native playback, captions/transcript | Poster, fit/ratio, loop and other appropriate playback settings |
| Audio | URL/picker, native volume/mute/playback/resume, one-source rule and transcript | Global music settings, track order/default, cross-route persistence, loop and interruption policy UI |
| App items | Reasons/categories, hotline text/recordings, invitations, scenes, gifts/prices, tracks/dedications | Settings for internal slots, shared appearance and preview parity |
| Behavior | Existing interactions and reduced-motion handling | Editable motion timing, transitions, interaction rules and visibility conditions |
| Authoring | Undo/redo, save/autosave, conflict warning, templates, independent section copies, revision comparison | Site-wide undo/history, persisted reusable library and linked-instance updates |
| Preview | Local document canvas and authenticated saved previews | Full OS-shell preview, interactive mode, complete page navigation and release preview |
| Publication | Owner page publish/rollback | Whole-site publish preflight, release manifests, scheduling and draft-isolated globals |
| Media administration | Metadata, archive/restore and usage protection code | Active upload service, resumable upload if needed, physical retention/backup and verified delivery |
| Operations | Roles/RLS, CI, health, deployment smoke code | Monitoring execution/alerts, backup jobs, restore drills and release certification |

A setting should be shown only when schema validation and both preview/public renderers support it. Do not add inert controls simply to make the panel look complete.

## Page creation delivered in this change
- Owner/editor can create drafts with a title and validated lowercase slug.
- Choose blank, birthday greeting, photo story or app-home templates.
- Duplicate a page's current draft within the same site; no publication history or live pointer is copied.
- Server-side role checks and existing database RLS apply; duplicate slugs show an error.
- Custom public pages use /pages/[slug] and only the published document; an unpublished/missing document returns 404.
- New pages do not automatically enter the fixed home grid; navigation editing is still required.
- Created Birthday Letter, Photo Story and Final Reveal in the live database as unpublished starter drafts. Existing rows are not overwritten; placeholder copy must be replaced before publishing.
- No automatic publication or fabricated recipient details.

## Ordered remaining implementation
1. Versioned site settings and functioning Personalization/Theme/Navigation/Audio screens.
2. Complete page metadata/archive/slug management and editable navigation.
3. Expand component schema/inspector/render coverage for the missing controls above.
4. Shared full-shell runtime for public/editor/private previews.
5. Atomic whole-site publication, rollback and linked components; then scheduling.
6. Activate media, import final content, finish Phase 11 acceptance and Phase 12 recovery checks.

This supersedes the earlier requirements-audit.md phase 9/10 status, which was recorded before those implementations.
