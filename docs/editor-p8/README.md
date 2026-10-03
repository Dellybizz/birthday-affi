# P8 — Shopify-style inspector refinement

P8 improves the visual editor's right-hand inspector without changing CMS storage keys, document shape, publish semantics, or existing user content.

## Interaction model

The selected section/block is still the source of truth. Inspector controls write to the same capability contracts introduced in E2, including responsive overrides and media target isolation.

## Settings hierarchy

Controls are grouped into clear, collapsible families when relevant:

- Content
- Image
- Media
- Position
- Typography
- Colours
- Layout
- Padding
- Margin
- Border & shadow
- Effects
- Playback
- Navigation
- Animation
- Visibility & behavior
- Advanced

Advanced is collapsed by default. Unsupported controls remain hidden.

## Purpose-built controls

- Boolean `true/false` selects render as switches.
- Alignment, image fit, shadows, and responsive scope use segmented controls where appropriate.
- Colours expose a swatch/picker plus exact value.
- Numeric design values expose a visual range control where bounded, with an exact-value input.
- Padding and margin show All / Top / Right / Bottom / Left together.
- Images show a preview plus Add/Replace/Remove actions.
- Image crop focus uses a nine-point position picker plus horizontal/vertical fine controls.
- Default/Mobile/Tablet/Desktop scopes remain explicit and inherited values are labeled.

## Preservation

P8 does not migrate or reset documents. Existing text, media, IDs, ordering, visibility, drafts, published pointers, responsive overrides, and renderer bindings remain unchanged.

## Regression coverage

`tests/editor-p8.test.mjs` protects the semantic group hierarchy and purpose-built visual controls. Existing E2/P6 tests continue to protect capability contracts, validation, reset semantics, and interaction-path performance.
