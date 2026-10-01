# C2 — Page management and navigation implementation

Completed implementation 1 October 2026; live interactive authoring certification remains a QA task.

## Delivered
- Existing draft creation, templates and duplication are retained.
- Page titles/descriptions, custom slugs, archive/restore and protected built-in routes.
- Owner-controlled published route changes; old URLs permanently redirect to the current canonical URL. Redirects resolve through stable page IDs, avoiding chains after repeated renames. Reserved aliases cannot be assigned to a different page.
- Database checks prevent archive of built-ins or any page referenced by draft/published navigation. Remove references and publish the updated menu before archiving. Direct page deletion is disabled; archive retains content/history.
- Archived pages are inaccessible through public content RPCs and custom routes; publish/rollback reject archived pages until restored.
- Metadata snapshots accompany immutable published page versions. Draft title/description changes remain private until page publication; metadata-only changes create a new version. Custom pages receive canonical metadata, and built-in page routes consume published title/description.
- Metadata/page-setting changes increment the draft revision, protecting open editor sessions from stale publication.
- /navigation provides owner controls for labels, icons, descriptions, destination picker, ordering, visibility, Start here badges and nested menus (three parent levels maximum).
- Navigation saves use optimistic revision checks. Immutable navigation versions and a published pointer separate drafts from public navigation.
- Navigation publication rejects missing, archived, cross-site and unpublished custom destinations. Built-in sample app routes can be linked before personalized content is published.
- Public home and CMS app-grid blocks consume published navigation; route URLs resolve from page IDs so renames preserve menu links.
- /navigation/preview is an authenticated saved-draft preview with destination links disabled. The full interactive OS preview remains C3.
- Empty published navigation intentionally produces an empty grid; an unpublished navigation uses the existing six-app fallback.
- Live page route changes prompt for confirmation in the page-management UI.

## Verification
130 regression tests pass; TypeScript and both production builds pass. SQL checks cover navigation publication isolation, cycle rejection, metadata draft isolation, published redirects, archive references and role restrictions. Additional checks verify anonymous navigation-table denial and archived content RPC denial.

Both database migrations applied to brdkbxlqendywbkdiuvr. Live inspection found six navigation draft items and no published navigation. No existing live page was renamed/archived and no personal content was published.

Security advisors show only the existing leaked-password-protection warning. The former public SECURITY DEFINER document RPC now delegates through an invoker wrapper with a filtered private reader.

## Publishing workflow
1. Create/edit a page and review its authenticated saved preview.
2. Publish custom destination pages first.
3. Edit navigation, save, and review the saved navigation preview.
4. Publish saved navigation explicitly.
5. To archive a destination, remove its draft and published navigation references first.
6. Settings/navigation/pages are independently published until C8's atomic whole-site releases.

## Practical limits
Authenticated browser authoring and device/accessibility certification remain pending C9 verification. Deployment readiness is checked separately from a successful source push. Full-shell preview is C3; custom animation/font/media controls are outside C2. Visibility hides menu descendants, not direct page access. Native device OS behavior is not claimed.

