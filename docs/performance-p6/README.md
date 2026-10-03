# P6 — Editor interaction performance

P6 removes avoidable full-document work from the Shopify-style editor interaction path while preserving draft safety, undo/redo, exact iframe preview parity, and autosave conflict handling.

## Interaction path

- `DraftSaveQueue.stage()` uses document references and monotonic versions rather than `JSON.stringify()` comparisons on every edit.
- The editor dirty flag uses `DraftSaveQueue.isSaved(document)` rather than serializing the entire draft every render.
- Saved JSON is still retained after successful writes for recovery/conflict compatibility.
- Section search results and the editor node map are memoized.
- One capability list is computed for the selected node and shared by Content, Appearance, and Behavior settings.

## Inspector

- Layer-name typing is local until blur because it is editor-only metadata.
- Image focal-point presets remain instant.
- Fine X/Y number entry commits on blur instead of rebuilding the page on every digit.
- Existing text/textarea controls continue to commit on blur; toggles and selects remain immediate.

## Live preview bridge

The iframe bridge is split into two message classes:

1. Full draft/document updates, coalesced to at most once per animation frame.
2. Lightweight editor-state updates for selected layer and Inspect/Interact mode.

Changing selection therefore no longer structured-clones the whole draft document.

Responsive preview dragging, browser zoom fit calculation, and iframe document delivery are all animation-frame coalesced.

## Preview renderer

- Trusted same-origin editor documents are no longer schema-parsed again inside the iframe on every update.
- React preview document/device updates are marked as transitions.
- Selection scrolling happens only when selection changes, not when ordinary styling/content changes.
- Selection-box measurements are coalesced to one animation frame and identical geometry does not trigger state updates.

## Preservation

P6 performs no CMS migration and does not replace text, media, node IDs, section order, drafts, published pointers, or visitor progress.
