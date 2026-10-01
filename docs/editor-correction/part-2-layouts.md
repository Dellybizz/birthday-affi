# Editor correction — Part 2: complete default pages

The canonical factory in `packages/content/src/default-pages.ts` builds all eight complete page documents. Built-in pages no longer depend on manually appending templates. Public unpublished fallbacks and editable drafts use the same factory and typed section renderer. Existing legacy documents retain compatibility.

| Page | Default hierarchy |
| --- | --- |
| Welcome | Startup text → hero → enter button → keepsake note |
| Home | Birthday heading/nickname → date widget → six apps → recent app → keepsake |
| Reasons | Introduction → ten reason cards with swipe/previous/next/favourite → heartfelt final card |
| Hotline | Incoming call → independent birthday greeting → three affection keypad messages → text note |
| Adventure | Introduction → atmosphere choices → time choices → direct invitation reveal |
| Movie | Credits → three editable photo/video scene slots → chapter links → birthday ending |
| Kiss Shop | Introduction → four gifts/details → bag → checkout → downloadable SVG receipt → free-redemption note |
| Radio | Two stations → player/optional recorded intro → dedication → six tracks grouped by station |

New page metadata is `layout: { version: 1, page: slug }` inside schema-v2 documents. A section uses `component: section` and a validated `sectionKind`, so the existing section hierarchy remains compatible. Dedicated action, invitation, chapter and station blocks represent their editable values. Section/block compatibility, singleton controllers, media URLs, chapter/station references and keypad digits are validated. The database boundary retains existing role checks, tree checks, media guards and draft revisions.

Selection mode renders the actual section layout with selection overlays rather than replacing app content with generic cards. Interaction mode shares the renderer. Public progress stores bounded, versioned node IDs for reasons, choices, radio selection, bag and receipts. Private previews and editor interactions do not write recipient progress. Native media remains gesture-driven and uses the existing one-source coordinator. End call removes the hotline players; transcripts remain available.

## Draft installation

`installDefaultLayout` appends a complete decided layout before an existing legacy tree. It preserves all existing nodes, IDs, properties, hidden states, relative order and theme; it does not guess whether personal edits are expendable. Default-ID collisions are remapped along with chapter/station references. A layout-version marker makes reruns idempotent. The three custom pages are untouched.

`prepare-layout-install.mjs` accepts a private snapshot and generates an eight-page transaction. It locks the target site and pages, compares the expected document and revision, validates each upgraded document, records the original in `private.page_layout_backups`, and updates only the draft. Any conflict aborts the whole transaction. No published page pointer, navigation snapshot, media object or global configuration is changed. Recovery snapshots deny anon/authenticated access and are not exposed through the admin or public API.

Private input snapshots and generated installation SQL stay outside the repository. Schema migrations are recorded with Supabase's actual migration versions: `20261001202833` and `20261001203241`.

## Verification

142 tests passed, including deterministic defaults, all eight real-layout renders in both modes, preservation/idempotency/collision cases, escaped receipt output, browser-progress filtering, database save/publish of every layout, invalid-reference rejection, and existing publishing/RLS regressions. Type checks and both production builds passed. The additional backup deny policy passed the database suite. A rehearsed installation transaction proves all-or-nothing conflict handling, eight recovery snapshots, preserved existing text, unchanged publication pointers and idempotent reruns.

Localhost interaction testing was blocked by the cloud browser (`ERR_BLOCKED_BY_CLIENT`); deployed public checks and live installation are recorded separately after deployment. This is not a measured speed certification.

## Remaining correction parts

Part 3 still owns the header page selector, View site button and new editor frame. Part 4 owns the visual Add section/block pickers and polished hierarchy operations. Part 5 owns complete contextual advanced controls, film/composed-story options and richer invitation outcome settings. Part 6 owns full OS-shell preview parity, authentication-backed saved preview and final interaction refinements. Part 7 owns device/keyboard/accessibility/performance certification. Storage activation and personal recordings/photos remain outstanding; placeholders never use fake playable URLs. Example gifts and dates require the owner's confirmation/personalisation before publication.

Reference checked for recovery-table permissions: https://supabase.com/docs/guides/database/postgres/row-level-security
