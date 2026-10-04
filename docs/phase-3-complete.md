# Phase 3 — Content engine

The previous visual-editor completion statement described scaffolding and has been replaced by the implementation scope below.

## Implemented

- Canonical schema version 2 page, section and block document contract.
- Component registry for sections, headings, paragraphs, images and the six-app grid, with labels and default properties.
- Runtime validation of component/type compatibility, IDs, parent-child relationships, reachability, cycles, root sections, duplicate references, visibility, bounded styles, theme colors, media URLs and document size/depth.
- Save and publish actions validate documents before storing content. Published-content reads validate before rendering.
- Server-loaded editor route retrieves the site's real saved draft by slug and passes its actual database ID to save actions.
- Editor and public page use the shared renderer; visibility, spacing, radius, opacity, text styles and grid settings are rendered consistently.
- Layer labels survive saving; save errors are visible; Publish saves the current draft first.
- Dashboard lists all actual site pages. Public homepage uses its published home document, retaining the existing shell until the first publication.

## Verification

18 content-contract tests pass, covering valid/empty drafts, invalid components, malformed graphs, styles, URLs and limits. Both apps pass TypeScript checks. Both Next.js production builds pass. The 14 Phase 2 security tests were rerun as a regression check.

## Following phases

Phase 4 will complete the editor interactions, including component insertion choices, subtree duplication and responsive settings. Phase 5 covers autosave, conflict handling, transactional publication, private previews and rollback. Animation/custom-class controls still require their later implementation. No personal content has been populated or published by this change. The hosted apps require a deployment of this branch before these changes become live.

## Deployment update

This implementation is now live in the Phase 5 production deployments. See `phase-5-release.md` for activation evidence and remaining interactive/real-device QA boundaries.
