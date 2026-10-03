> Historical scaffold QA notes. The current roadmap defines Phase 6 as the media system; see [phase-6-release.md](phase-6-release.md) for implemented work, checks and the live Storage blocker.

# Phase 6 — End-to-End QA & Hardening

## Completed in source
- Added explicit package exports for CMS, app builders and editor schema.
- Added a package barrel export so workspace consumers have one stable import surface.
- Hardened the home-screen app slug mapping with a typed constant.
- Added CI gates in Phase 5 for dependency installation, typecheck and production build.

## QA matrix
- Public home: responsive two-column app grid and app links.
- Admin: control-panel entry and editor route.
- Editor: hierarchy, selection, content/design/advanced inspector, undo/redo, save and publish.
- CMS: draft/version/publish data flow.
- App builders: six app-specific content models.
- Security: service-role and preview secret remain server-only.
- Media: MIME/size validation.
- Release: CI and Vercel configuration.

## Required live verification
Live browser verification still requires a deployed environment. Once deployed, verify mobile/tablet/desktop widths, keyboard navigation, reduced motion, touch targets, media playback, audio exclusivity, authentication, draft isolation, preview expiry, publish/rollback and all six app experiences.

Phase 6 source hardening is complete. Live environment QA is an operational step and is not represented as passed without an actual deployment.
