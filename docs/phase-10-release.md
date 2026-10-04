# Phase 10 — Editor power features

## Part A implemented
- Layer search across label, component and text settings, including hidden layers.
- Additive birthday greeting, photo story and app home templates. Existing content is preserved; additions are undoable.
- Reusable-section JSON export/import, validation and complete ID remapping. Imports are independent copies, not linked global components. Files are capped at 1 MB.
- Compare any saved version with the working draft: added/removed nodes, settings, hierarchy/order and page theme changes. This is descriptive, not automatic merge.
- Base/mobile/tablet/desktop design overrides. Allowed style keys share base bounds in JavaScript and SQL. Reset removes only that device’s values. Content/media URLs cannot be overridden through the responsive prefix.
- Editor canvas forces the selected device. Public/saved-preview renderer observes its container width: mobile below 600px, tablet below 960px, desktop otherwise. Existing documents without overrides behave as before.
- Shared app-item card styling now consumes colors, spacing, corner radius and opacity in public interactions. Individual app-control internals remain shared design.

Validation: 120 automated tests pass, zero fail. Both production builds and TypeScript checks pass. SQL save/publish and unsafe override rejection tests included. Migration phase10_responsive applied, version 20261001160058. No real birthday draft or publication changed during verification.

## Remaining Phase 10 work
- Persisted reusable/global component library with linked instances and safe version propagation.
- Scheduled publishing with immutable snapshots, owner authorization, cancellation, job execution and failure reporting.
- Full authenticated interactive editor and mobile/container resize verification.

The current release is Part A; Phase 10 as a whole is not complete. Whole-site release management and global personalization remain requirements-audit.md completion work, not a capability claimed by these editor tools.
