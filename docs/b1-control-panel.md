# B1 — Control panel UI and interaction cleanup

Implemented against canonical `main` baseline `f23f7c770d55cf386b019981d7eef7a15f2af43f`.

## Changes

- Shared control-panel controls, blush accent, focus treatment, SVG icons and status styling across the dashboard and visual editor.
- Editor Save draft and Publish page are separate, named actions. Removed the save-menu arrow that published immediately and the duplicate Publish menu item.
- Publication status compares the current editor document to its actual published version: Published, Unpublished changes, Draft, Publishing, Error. Saving or autosaving does not imply publication. Successful publication and rollback update the comparison baseline.
- Editor toolbar wraps on narrow screens; mobile and tablet expose section/theme/app panels and all preview sizes. Desktop retains the page selector, three-panel workspace and isolated live canvas.
- Mobile navigation traps keyboard focus, supports Escape, restores focus, and locks background scrolling. Releases has its own navigation entry; removed the repeated Releases action from page headings.
- Settings and navigation use readable labels, responsive field layouts, consistent buttons, explicit error feedback and pending states. Empty navigation and version history have guidance. Hotline copy now reports success/failure.
- Shared route loading/error states and editor-specific recovery states. Read-only controls remain disabled; existing revision/conflict protection remains in use.

## Verification

- Full `pnpm test` command passed. All test files with the required router setup: 250 passed, 2 integration tests skipped, 0 failed.
- Added behavioral publication-state and rendered editor regression tests. Updated layout/read contracts for the responsive toolbar and published-version read.
- Production admin smoke checks passed: protected routes redirect to sign-in with no-store caching; login/configuration state and health endpoint passed.
- Both app TypeScript checks and both production builds passed.
- Read-only production database check: 13 pages; 2 published pointers; both published documents readable.
- Browser visual walkthrough remains unverified: the cloud browser cannot reach local preview (`ERR_BLOCKED_BY_CLIENT`), and production requires an admin sign-in session. No live content was changed for testing.
