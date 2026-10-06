# B2 — Pages and navigation

Implemented on top of B1 (`b1-control-panel`, PR #5). This is a stacked change; main and published content have not been changed.

## Pages

- Search titles, slugs, canonical app names and descriptions; filter active pages, drafts/unpublished changes, archived pages or all pages.
- Thumbnails, actual content-and-metadata publication state, edit/settings/view actions, template creation and draft duplication.
- Title, description, URL slug, search title/description, sharing image and no-index controls with search-result preview. Duplicates copy independent draft content and settings, preserve shared media references and start unpublished/unarchived.
- Settings updates use the original timestamp as a concurrency guard and update the list/editor catalogue without a manual refresh. Existing owner-only live route changes, protected built-in routes, reserved redirects and navigation-reference archive checks remain enforced.
- SEO metadata is snapshotted with published versions. Draft changes do not leak to public metadata; metadata-only edits can be published from the editor. Rollback retains the selected version's metadata and the current draft.

## Navigation

- Nested tree with drag-and-drop reorder/nesting, up/down buttons and a parent selector for keyboard/touch use. Cycles, missing parents and excessive depth are rejected in TypeScript and SQL.
- Page and runtime-app destinations, icon, label, description, visibility, Start here badge, and home grid/dock/journey placement. Child entries inherit the root placement and ancestor visibility.
- Removing a group promotes its children. Unsaved preview and private saved preview show all three placements. Save draft and Publish saved navigation remain separate; unsaved changes must be saved before publication.
- Phone grid/dock ordering comes from published navigation when placements are configured. Nested groups open folders; group destinations remain accessible within their folder. Journey/back links follow tree order and skip hidden ancestors.
- Legacy navigation is preserved until an owner saves the proposed placement upgrade. Existing phone fallback remains active for legacy publications.

## Migration and delivery

`20261006181647_b2_pages_navigation.sql` adds SEO validation and immutable publication metadata, accepts validated placement/runtime fields, resolves runtime destinations, and uses the same metadata comparison for individual and whole-site publication. It does not rewrite documents or published pointers. Apply this migration before enabling the B2 admin deployment; otherwise the previous SQL navigation validator rejects the new fields.

## Verification

- TypeScript checks passed for both applications.
- Production builds passed for admin and web.
- Full `pnpm test` passed; B2 includes behavioral navigation/page-state tests, SQL individual/whole-site publication, rollback and validation tests and phone-renderer integration coverage.
- All test files with the required router setup: 257 passed, two private Vault fixtures skipped, zero failed.
- Admin production smoke checks passed for protected routes, login configuration and health.
- Authenticated browser interaction remains unverified: the cloud browser cannot reach local preview and production requires an admin sign-in session.
