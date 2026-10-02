# P2 — Archive + Heart public-shell parity

P2 makes the isolated P1 preview use the same non-phone public OS shell as the live website for **Memories Archive** and **In My Heart**.

## What changed

- Added `@wiffeyyyy/ui/public-page-shell` as the shared non-phone public chrome.
- The live `OSProvider` now uses that shared shell on non-phone routes.
- The admin draft preview uses the same shell for `memories-archive` and `in-my-heart`.
- `CMSRenderer` accepts `externalShell` so exact-live renderers do not create a nested synthetic shell when the shared public shell already exists.
- Draft Home notifications and draft site settings are supplied to the iframe shell.
- The Heart preview inherits the Archive back-label/navigation settings from the current draft, matching the public journey context.
- Unsaved Archive document changes still stream through the P1 `postMessage` bridge; Archive shell settings are recalculated from the live unsaved document.
- Inspect mode blocks public-shell controls that are not editable layers; Interact mode restores their normal behavior.

## Preservation

P2 does not migrate, reset, publish, or reorder visitor content. Existing page IDs, node IDs, drafts, published pointers, media, visibility, and content remain unchanged.

## Acceptance

- Archive and Heart render inside the shared public OS chrome.
- No nested `.birthday-os` synthetic editor shell is created for those two pages.
- Public top bar, site title, status/date area, notification button, footer, page main class, Archive navigation context, Archive frame, and Heart engine are reused in the editor preview.
- Mobile/tablet/desktop viewport isolation remains owned by P1.
