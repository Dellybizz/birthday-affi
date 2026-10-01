# Phase 4 — Visual editor MVP

This record follows `phase-wise-plan.md`. The previous production-product-layer checklist described separate scaffolding and has been superseded.

## Implemented

- Nested, collapsible section/block navigator using the saved child ordering.
- Selection synchronized between navigator, canvas and inspector; hidden nodes remain editable in the navigator.
- Mobile/tablet/desktop canvas width presets, with panels accessible through tabs on smaller admin screens. Responsive per-node overrides remain Phase 10.
- Registry-driven insertion of sections, nested sections, headings, paragraphs, images and app grids. Blocks require a section parent.
- Deep subtree duplication with new IDs and remapped parent/child references; copies are inserted after the original sibling.
- Recursive deletion that removes descendant nodes and references, and sibling-only move controls with disabled boundaries.
- Schema-driven content/design inspector: labels, text, typography, alignment, image URL/description, grid columns/gap, visibility, spacing, colors, radius and opacity.
- Page-theme inspector connected to the shared renderer for background, text, accent, surface, muted color and app-card radius.
- Document-snapshot undo/redo, bounded to 50 prior states. New edits clear redo; no-op operations create no history.
- Operations validate before entering state, leaving the previous valid document intact on error.
- Role-aware controls: viewer cannot edit, editor cannot publish, owner can edit/publish. Existing server authorization remains authoritative.
- Save-state comparison against the last successfully saved document; concurrent save clicks and edits during saves are disabled. Save errors are displayed. Settings apply on blur, so an individual text edit creates one history entry.
- Editor canvas supports keyboard selection and prevents app-link navigation; public app links retain navigation.

## Verification

- 12 operation tests: hierarchy, insertion limits, deep duplication, recursive deletion, sibling ordering, invalid edits, visibility/labels, undo/redo, history bounds and stale selections.
- Four server-rendering tests: empty editor, panel controls, role restrictions, insertion choices, theme output, hidden subtrees and keyboard selection/link suppression.
- 18 Phase 3 content tests and 14 Phase 2 security tests pass.
- Both app TypeScript checks and Next.js production builds pass.

## Release boundary

This is implemented and tested in source. It has not been deployed or exercised interactively in a live browser in this phase. No real recipient content was published. Autosave, conflict detection, draft versioning, transactional publishing, rollback and private preview remain Phase 5; media uploads/picking remain Phase 6. Canvas presets fit the available screen width and are not a substitute for real-device testing.
