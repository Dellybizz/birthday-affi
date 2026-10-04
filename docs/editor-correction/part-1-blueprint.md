# Editor correction — Part 1: page and section blueprint

Status: specification complete; implementation belongs to Parts 2–7.
Date: 1 October 2026 UTC / 2 October 2026 India.
Scope: the new Wiffeyyyy OS birthday project, with Welcome, Home and six apps. Earlier birthday projects are excluded.

## Outcome and source of truth

Choosing a page in the header opens its complete saved layout. A user never needs to add a template to make a built-in page usable. Templates remain optional for custom pages. Every visual section has a named entry in the left hierarchy and every supported editable value has a contextual setting in the right inspector. Public delivery, the editor canvas and authenticated draft preview use the same complete page renderer and OS shell.

The eight built-in page records remain the canonical content source. Separate app-builder metadata and public sample arrays must not become competing content stores. New typed page sections extend the existing document model through a versioned migration. A generic heading or text block is not sufficient to represent an incoming call, shopping bag or radio station. App runtime state (current card, answered call, bag, track position) is separate from editable page content.

Hierarchy: site → page → typed section → named block → fields. Global shell and navigation appear in distinct left-sidebar groups; they are not silently copied into every page. Internal controls belong to their nearest section rather than becoming arbitrary disconnected text blocks. Blocks and section IDs are stable, independent of their editable labels.

## Page inventory and default layouts

Every page below is required and appears in the top page selector. These are predetermined layouts, not a selection of templates the user must assemble. Copy below is editable example content, not a claim about the recipient or a confirmed promise. Media placeholders contain no fake playable URL.

| Page / route | Default sections in order | Minimum default content | Page-specific settings |
| --- | --- | --- | --- |
| Welcome `/` (slug `welcome`) | Startup greeting; welcome hero; enter action; keepsake note | “Starting Wiffeyyyy OS…”; “Happy birthday to my favourite person”; short intro; “Open your birthday world”; “Made just for you” | Intro enabled, duration 0–1500 ms, skip option, hero alignment, enter label and destination fixed to Home |
| Home `/home` | Birthday heading; date widget; six-app launcher; optional recent app; keepsake note | Greeting bound to nickname; date using site timezone; all six named icons; Hotline “Start here” badge; “A little world, just for you” | Heading/message overrides, date display mode, launcher spacing/icon sizing, recent app enabled, badge copy |
| Reasons `/app/reasons` | Intro; swipeable reason deck; final heartfelt card | 10 editable example reasons, optional photos, card position indicator, previous/next, favourite; one separate final card | Intro copy, card presentation, swipe enabled, navigation labels, favourite label, final card styling |
| Hotline `/app/hotline` | Incoming call; main birthday message; affection keypad; text versions | Caller placeholder “A message from me”; Answer/End; birthday greeting transcript; 3 keypad messages: compliment, emergency affection, another birthday wish | Caller name/photo, incoming title, answer/end labels, primary recording, keypad digits/order/labels, transcript presentation |
| Adventure `/app/adventure` | Intro; atmosphere choice; time choice; invitation reveal | Cosy/adventurous; daytime/evening; editable invitation with unconfirmed date/time/place; direct “See your invitation” action | Group titles, choices, valid combinations, invitation fields, direct reveal/back labels, reveal style |
| Movie `/app/movie` | Opening credits; movie player; chapter list; birthday ending | Title and dedication; poster placeholder; 3 chapter placeholders (opening, memories, birthday ending); ending message; Play/Pause/Replay/Sound | Single film vs composed story, media source, poster, chapter timestamps, captions/transcript, credits, ending, playback labels |
| Kiss Shop `/app/kiss-shop` | Shop introduction; product collection; bag; gift checkout; receipt; redemption note | 4 gifts: movie night, long hug, breakfast together, handwritten letter; affectionate prices; Add to bag; empty/filled bag states; Checkout; saveable receipt | Product descriptions/images/availability, prices, bag labels, checkout copy, receipt message, download label, free-redemption note |
| Radio `/app/radio` | Station selector; now playing; dedication; track list | 2 stations: Birthday dedication / Songs that remind me of you; 3 editable track placeholders per station; notes; optional recorded intros; Play/Pause/Volume/Previous/Next | Station titles/artwork, track order/source/note/intro, default station, loop, player labels, playback persistence |

Optional existing custom drafts: Birthday Letter, Photo Story, Final Reveal. Preserve them and expose them under Custom pages in the selector. They are not additional home apps unless the owner adds them to navigation. Final Reveal is an optional keepsake page; Reasons still has its own final card.

### Specific default content rules

- Reasons: seed 10 examples covering little habits, expressions, kindness, ordinary moments and feeling at home; clearly editable sample copy. Do not pretend to know actual memories. An optional photo slot must still render a designed card without media.
- Hotline: main greeting is independent of keypad messages. Answer opens the greeting; audio plays only following a gesture permitted by the browser. Transcript access is always available, including before answering.
- Adventure: default options are examples awaiting confirmation. The owner must confirm only options they can arrange. A choice group records one selection. A direct invitation link prevents mandatory quiz completion. No payments, scores or completion gates.
- Movie: a missing clip must display a polished poster/caption state, not a black player or broken source. Chapters in a single film require timestamps; composed scenes require duration and scene media. Target real content length is approximately 2–4 minutes, not a forced artificial timer.
- Shop: “prices” are affectionate jokes; gifts can be redeemed freely. Bag, checkout and receipt are local visitor interactions. Do not introduce real payment processing or order-delivery automation into this scope.
- Radio: station grouping is real content structure, not merely a label above one flat track array. Notes remain readable without recordings. Never autoplay music on page entry.
- Welcome/Home use site nickname and birthday settings by default, with explicit page overrides. Reset restores inheritance rather than copying the current global string.

## Required section and block catalog

Names in this table are proposed stable section types, not claims that these components are already implemented.

| Typed section | Allowed blocks / named elements | Section content and behaviour controls |
| --- | --- | --- |
| `startup-greeting` | Status text, greeting text | Enabled, duration, skip label, motion |
| `welcome-hero` | Eyebrow, heading, message, decorative icon/photo | Text, media, alignment, icon visibility |
| `enter-action` | Enter button | Label, accessible label; built-in Home destination |
| `birthday-heading` | Greeting, nickname binding, message | Binding/override, greeting text, birthday badge visibility |
| `date-widget` | Date, widget caption, icon | Date format, birthday vs current-date mode, caption/icon |
| `app-launcher` | Six navigation-backed app entries | Shared navigation IDs/order, icon size, columns/gap, Start here badge; no duplicate route store |
| `recent-app` | Resume label, recent-app link | Enabled, label, fallback hidden state |
| `reason-deck` | Repeatable reason cards, counter, previous/next/favourite controls | Title/body/category/photo/alt per card, swipe, labels, card order |
| `heartfelt-card` | Heading, heartfelt message, optional photo | Text/media, reveal presentation; reachable without collection gates |
| `incoming-call` | Caller name/photo, call status, Answer/End controls | Caller fields, labels, call presentation |
| `birthday-message` | Main audio recording, transcript | Recording, title, captions, transcript, transcript label |
| `affection-keypad` | Repeatable keypad messages | Unique digit, title, recording, transcript; order and button appearance |
| `choice-group` | Repeatable choices | Group ID/title, option ID/title/description/icon; single choice, order |
| `invitation-reveal` | Invitation heading, message, date/time/place, direct/back controls | Outcome mapping references stable option IDs; confirmable plan fields and labels |
| `movie-credits` | Film title, dedication, credits | Text, alignment, optional image |
| `movie-player` | Film media or repeatable scenes; playback controls | Mode, source/poster/fit, scene durations, captions, labels |
| `movie-chapters` | Repeatable chapters | Title plus timestamp for film or scene ID for composed story |
| `birthday-ending` | Ending heading/message | Text/media and replay action |
| `product-collection` | Repeatable gifts | Title, description, photo/alt, playful price, available, details/add labels |
| `gift-bag` | Line items, empty message, remove/quantity controls | Labels, empty copy, quantity limits |
| `gift-checkout` | Summary, checkout action | Title, message, checkout label; requires nonempty bag |
| `gift-receipt` | Receipt heading, gifts, note, download action | Template style, heading/note/download label; contains no payment data |
| `redemption-note` | Note text | Editable free-redemption/keepsake copy |
| `station-selector` | Repeatable stations | Stable station ID, title/artwork/description, order, default station |
| `radio-player` | Now-playing title/artwork, play/pause/volume/previous/next | Labels, loop mode, default volume inherited from site |
| `track-list` | Tracks linked to station IDs | Title, source, note, recorded intro, captions, artwork, order |
| `dedication` | Selected track note/transcript | Heading/empty state and presentation |
| Generic `text-section`, `image-section`, `media-section`, `keepsake-note` | Existing text/image/audio/video blocks | Appropriate existing controls plus shared advanced controls |

Structural dependencies must survive hiding or rearranging presentation. A hidden keypad has no orphaned messages; a deleted station requires reassignment/removal of its tracks. Movie chapter references and invitation option references require validation. System interaction controllers remain one per page; repeating a second player or bag through Add section is disallowed or explicitly explained.

## Editor interaction contract

Header: back to admin, page selector (Built-in pages / Custom pages), saved status, device preview, Undo, Redo, Preview draft, View site, Save, Publish. Page selector shows the active title and permits searching page names. Page changes open the complete existing document. Save pending changes before switching; if save fails, remain on the current page with Download draft / Retry / explicit discard options. Never silently discard edits.

Left: Page sections (ordered, expandable named blocks), Add section, Global shell, Navigation, Page settings, Theme settings. Selected layer uses one consistent highlight. Hide, reorder, duplicate and delete are contextual operations. Keyboard reorder must be available even if drag-and-drop is added. Required functional sections cannot be accidentally removed without an explicit warning and a restore path.

Centre: full phone OS preview, including shell, page heading, content and app interactions. Mobile fills phone viewport; wider device choices centre the phone rather than stretch the recipient UI into a desktop dashboard. The admin itself remains a wide editor. Select mode highlights/selects editable elements; Interact mode permits playback, swipe, navigation and checkout using isolated preview state. Switching modes preserves draft content.

Right: inspector title plus section/block breadcrumb. Group applicable fields into Content, Media, Layout, Appearance, Behaviour. Do not show every possible field on every layer. Page selection opens page settings; block selection opens block settings. Narrow screens switch between Sections / Preview / Settings without losing state.

Add section: searchable picker with section name, visual thumbnail, description and allowed-page compatibility. Choose → insert at requested location → select new section → open settings. Add block uses the parent section's allowed block types. The picker does not replace the page layout. Thumbnails must represent real layouts; unsupported section types stay out of the picker.

View site: opens the current page's public route in a new tab; indicates when no version of this page is published. Preview draft: opens authenticated saved revision with the full OS shell. Unsaved canvas is explicitly labelled. Publish saves first, validates content/references and publishes only with owner permissions; page publish and whole-site publish must not share a misleading label.

## Shared settings and inheritance

| Setting group | Fields | Applies to / constraints |
| --- | --- | --- |
| Content | Heading level, plain/rich text, safe links, labels, bindings | Semantics h1–h6; one page-level h1 policy; no arbitrary HTML injection |
| Typography | Font family, size, weight, line height, letter spacing, alignment | Allowlisted fonts; bounded values; readable defaults |
| Layout | Width/max-width/min-height, per-side padding/margin, grid columns/gap, alignment, overflow | Nonnegative bounded spacing; responsive inheritance/reset |
| Appearance | Background/gradient, text/icon colors, border, shadow, per-corner radius, opacity | Validated tokens; accessible defaults; gradient/shadow presets plus bounded controls |
| Media | Source/library picker, alt text, ratio, size, cover/contain, focal point, poster, loading priority | Fields only for matching media kind; preserve aspect ratio; no autoplay sound |
| Behaviour | Visibility, motion preset/duration, reduced-motion fallback, applicable interaction labels | Global one-audio-source policy; reduced motion honoured |
| Page | Title, slug where editable, description, theme inheritance/overrides, archive | Built-in routes protected; custom aliases handled; archive-reference checks |
| Global | Name, nickname, birthdate/timezone, brand, theme, audio, shell copy, notifications | Versioned private drafts and public snapshots; edits visibly scoped as global |

Base values inherit into mobile/tablet/desktop; device override reset removes the override. Section defaults inherit theme tokens; empty override means inheritance, not invalid empty CSS. Theme changes should not require editing eight pages. Validation feedback identifies the field, preserves the typed value and prevents invalid save/publish.

## Audit of current implementation

Evidence is a source-code audit at local commit 9777daa (remote equivalent b25e2f1b63d208ae9297aa6194da5f6669d0fa21). It is not authenticated production certification.

| Area | Actual implementation | Gap / required work |
| --- | --- | --- |
| Page storage | Schema-v2 documents, stable IDs, nested sections, revisions, page metadata, archive and publication | Predetermined complete defaults are not automatically initialised for all pages |
| Public apps | Published CMS document when present; otherwise `sampleAppItems` in `AppExperience` | Public fallback is a second layout/content source; editor does not load that full fallback |
| App tree | One generic item component per app; `getAppItems` gathers page-wide matching nodes | Dedicated typed sections and section-scoped runtime composition; current grouping flattens distinct sections |
| Reasons | Card list, category filter, favourites | Swipe deck, counter and separately editable final card |
| Hotline | Incoming call, answer/end, keypad, transcript | Caller/main-message/keypad settings are partly hardcoded; main greeting needs separate structure |
| Adventure | One flat choice selection reveals its invitation | Multiple groups, valid outcome mapping and direct invitation access |
| Movie | Individual video scenes, previous/next, chapter buttons | Credits, posters, timestamps, composed photo/video story and editable ending |
| Shop | Gift cards and individual redeem dialogs with local receipt timestamps | Bag, product detail flow, checkout and downloadable gift receipt |
| Radio | Flat tracks, notes, player and previous/next | Real stations, optional recorded intros, station artwork and all player settings |
| Header/editor | Undo/redo, Save/Publish, saved draft link, device buttons, interactive toggle | Top page selector, View site, complete shell preview and consistent inspector hierarchy |
| Add section | Adds generic section immediately; optional append-template buttons | Section picker with thumbnails/compatibility, then contextual settings |
| Inspector | Scalar padding/margin/radius/opacity, colors, selected text/media fields, responsive overrides | Full contextual advanced control groups and local invalid-field feedback |
| Globals | C1 versioned 16-field site config; C2 versioned nested navigation | Shell labels/notifications/font/motion plus complete renderer bindings |
| Media | Picker/upload/archive code, fit/focal/height/captions | Storage activation and real media proof remain outstanding; no invented assets |
| Preview | `CMSRenderer` document; selected item cards differ from interactive rendering | Share full runtime/shell and attach selection overlays without replacing page layout |
| Performance | Request deduplication, memoised document validation, loading view | Client navigation/prefetch audit, measured timings and full-device validation |

Canonical source files: packages/content/src/cms.ts, registry.ts, inspector-fields.ts, component-contracts.ts, app-content.ts, app-builders.ts, site-document.ts, navigation.ts; packages/ui/src/cms-renderer.tsx, app-experience.tsx, media-player.tsx; apps/web/components/os-provider.tsx; apps/web/app/app/[slug]/page.tsx; apps/admin/app/editor/[slug]/editor-client.tsx; apps/admin/app/preview/[pageId]/page.tsx.

Historical audits such as docs/shopify-control-map.md describe earlier states. This audit supersedes their completeness claims for the editor correction only. Existing security, save-conflict and versioning safeguards must be retained.

## Part 2 handoff: safe default-page installation

1. Build canonical default documents from this catalog, with complete layout sections and editable example content. Store explicit layout version and page kind; derive routes from page records. Validate fixtures before database writes.
2. Inventory the eight existing built-in drafts and the three custom drafts. Export a recoverable snapshot before transformation. Existing user content takes precedence, especially Adventure edits; revision number alone is not proof a draft is untouched.
3. Add defaults only to genuinely untouched seed pages or missing structural slots. Map existing reason/message/gift/track fields into new blocks preserving text, URLs, visibility, order and IDs where possible. When ownership of an edited field is ambiguous, preserve it and report the unresolved mapping rather than replace it.
4. Run upgrades transactionally per site with expected revision checks. Record layout version so rerunning is idempotent. Schema changes require matching TypeScript and database validators, conversion fixtures and backward-compatible reads or a documented migration.
5. Populate the editable page drafts without automatically publishing sample content. Remove the need for manual template assembly. Align public fallback composition with the canonical defaults until owner publication; missing media remains a designed text/poster state.
6. Verify each page has all required sections, renders nonempty, reopens with edits intact, and still honours private draft/public version separation. Publish readiness distinguishes complete layout from missing personal content/media.

## Implementation ownership by correction part

| Part | Deliverable |
| --- | --- |
| 1 (this document) | Eight-page specification, typed section/block catalog, control map, honest gap audit, safe migration plan |
| 2 | Implement complete default documents, typed section composition, placeholder states and safe draft installation |
| 3 | Implement page selector/header and Shopify-style three-pane editor frame, View site and switch/save handling |
| 4 | Implement section/block pickers, selection, contextual operations and accessible reordering |
| 5 | Implement each advanced inspector group with matching validation/render support |
| 6 | Finish full-shell shared rendering, authenticated preview, interaction parity and publication navigation |
| 7 | Measure and fix performance; verify complete user flows, mobile, keyboard and save/publish reliability |

## Acceptance gates

Part 1: all eight pages have routes, ordered default sections, minimum content, specific settings and current-gap evidence; no proposed controls are labelled implemented. This is a documentation gate, not a runtime release.

Final correction: header page selection opens complete page; every visible editable element resolves to a named setting; Add section follows picker → insertion → settings; View site opens the correct published route; unsaved navigation cannot lose work; same settings produce same full layout in canvas/saved preview/public; audio never overlaps; inaccessible media has readable fallback; no publish occurs automatically during default installation.

Performance acceptance in Part 7 must include measured p50/p95 navigation, input-to-preview and save durations on specified device/network conditions. Initial targets: cached page switching feedback immediately, input-to-preview p95 under 100 ms for ordinary edits, no main-thread task over 200 ms in the tested core flows. Server save completion must remain honest about network latency; do not advertise guaranteed instant operation.
