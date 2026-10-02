# P7 — Persistent editor backend performance

P7 removes repeated editor bootstrap work from page-to-page navigation.

## Persistent ownership

`/editor/layout.tsx` now owns the long-lived editor bootstrap:

- verified admin/session boundary
- site identity
- page catalogue
- draft site configuration
- draft navigation
- editor permissions
- document/audio/navigation/live-preview providers

The layout wraps a client `EditorWorkspace`, which stays mounted while the `[slug]` route changes.

## Page route

`/editor/[slug]/page.tsx` now loads only the selected page record (`id`, `slug`, `draft_document`, `draft_revision`, `settings`) and emits an `EditorRoutePayload`.

The persistent workspace swaps that payload into the existing editor rather than reconstructing the whole editor environment.

## Safety between pages

When `pageId` changes the editor:

- creates a new `DraftSaveQueue` tied to the new page ID/revision
- resets undo/redo history
- clears version comparison/history UI
- resets per-page search/design scope/errors/notices
- keeps editor chrome/device mode/preview shell mounted

Existing unsaved content is still flushed before `router.push()` through the E1 save-before-switch contract.

## Preview persistence

The iframe source is pinned to the first editor page ID for the session. Later page switches stream the new draft plus `pageSlug` over the existing same-origin `postMessage` bridge.

This prevents repeated preview bootstrap queries for site configuration, navigation, page catalogue, Home notifications, and Archive settings.

## Data preservation

P7 performs no data migration and does not alter page content, IDs, ordering, revisions, published pointers, media, or visitor state.
