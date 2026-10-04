# E2 — capability-aware inspector

E2 replaces the old "show every generic control everywhere" inspector model with a renderer-aware capability contract.

## What changed

- Every visible node field now resolves through `getInspectorCapabilities()` with an explicit group, storage path, renderer binding, responsive support, reset policy, optional default, dependency note and exact media target.
- Inspector groups are **Content**, **Appearance**, **Behavior**, and **Page**. Global site controls stay separate and are linked from Page rather than being mixed into section settings.
- Generic appearance controls are hidden when the active specialized renderer does not bind them. This applies to Adore, Pardanasheen, Saragram and Kiss Shop, heart-specific nodes, and app-specific content blocks such as hotline/radio items. Phone nodes expose only the subset actually read by `PhoneHome`.
- Archive-only controls (`visualEffects`, chapter transition settings, archive labels/notes) appear only on the archive page root instead of every section.
- Image/video metadata added for Pardanasheen does not leak onto ordinary generic media blocks. Heart memories retain the title/body media content they actually use.
- Responsive overrides remain available only for settings with a responsive renderer path. Device reset deletes overrides and falls back to Base.
- Numeric, select, color, slug and media URL values are normalized before document validation; min/max ranges are clamped and invalid colours/URLs are rejected before saving.
- Reset behavior is explicit: component defaults are restored where a canonical default exists; otherwise the override/property is cleared.

## Media target safety

Media selection is target-specific. `src`, `poster`, `avatar`, `callerPhoto`, `voiceSrc` and `introSrc` are distinct targets. Choosing a reel cover or profile photo no longer writes to `src`. Primary `src` keeps the existing media asset metadata used for responsive delivery; secondary targets update only their own property.

The document validator now applies safe-media URL checks to all of those authored media properties.

## Preservation rules

E2 performs no data migration and does not publish/reset existing pages. Existing IDs, hierarchy/order, visibility, media references, revisions, published pointers, global configuration/navigation versions and visitor/runtime state remain untouched. Unsupported settings are hidden in the UI, not deleted from saved documents.

## E2 verification

`tests/editor-e2.test.mjs` covers specialized-renderer filtering, archive control scoping, phone binding filtering, independent media targets, input normalization and reset preservation. Full signed-in visual/runtime acceptance remains part of E6.
