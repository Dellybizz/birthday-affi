# C0 — Baseline and editable contracts

Completed baseline inventory on 1 October 2026. This is contract preparation, not completion of all controls.

## Added
- component-contracts.ts catalogs each registered component using the existing canonical defaults and inspector fields. Records page/section parent rules and renderer ownership.
- Named field contracts for all six apps separate existing document fields from planned slots.
- Global contracts cover personalization, welcome, home, phone shell, navigation, notifications and audio.
- Contract tests verify registry coverage, valid unchanged default documents, correct parent/renderer mapping and separation of current/planned fields. Included in pnpm test.
- The completion plan records the mobile OS requirement: phone screen on mobile and centered phone frame on larger screens; desktop admin workspace remains wide.

## Inventory

| Surface | Source | Current data binding | Missing control contract |
| --- | --- | --- | --- |
| Welcome | apps/web/components/welcome.tsx | Optional CMS content | Starting text, enter labels, intro duration and decorative shell |
| Home | apps/web/components/home-screen.tsx | Fixed copy/app list; local progress | Name/greeting/date, icon order, badge and navigation |
| Shell/notifications | apps/web/components/os-provider.tsx | Shared OS state and fixed shell | Phone frame/status bar, notification copy/destinations/frequency |
| Generic blocks | packages/ui/src/cms-renderer.tsx | Document props and responsive resolver | Semantic heading level and advanced styles |
| Six apps | packages/ui/src/app-experience.tsx | app-content items and per-item basic styles | Internal labels, shared controls and app-specific planned slots |
| Media | packages/ui/src/media-player.tsx | URL, captions and local playback state | Global audio settings and cross-route playback policy |
| Validation | packages/content/src/validate.ts and SQL assertions | Schema v2 and ranges | Future field semantics must be added on both boundaries |
| Inspector | packages/content/src/inspector-fields.ts | Current component/design fields | Future controls must be consumed by preview and public rendering |
| Pages | apps/admin/lib/page-actions.ts and public /pages/[slug] | Draft creation/duplication; published-only route | Metadata/archive/slug/navigation lifecycle |
| Release | apps/admin/lib/site-actions.ts | Page save/publish/rollback | Site-level immutable release manifests |

## Known mismatches to close
- Generic image fit/focal/height controls do not provide equivalent per-app photo/video configuration.
- Editor app-item cards differ from the interactive public apps; full-shell preview is absent.
- Many button labels, empty states and playback introductions are fixed rather than configurable.
- Validator accepts scalar extension properties that may not have an inspector or renderer. Acceptance does not prove editability; do not tighten legacy document validation without migration.
- className is accepted as a legacy field but is not a supported visual control.
- Global settings/navigation must be versioned; directly editing live settings would violate unpublished-change isolation.

## Code organization
Current registry/defaults and inspector definitions remain canonical to avoid a risky rewrite. The catalog is their shared index, not a second defaults implementation. During C1–C6, extract component modules with schema/defaults/fields/parent rules together; keep matching renderer modules under packages/ui. Add migration fixtures before changing stored shapes.

## Compatibility and verification
No document schema change or database migration was needed. No drafts, saved versions or published content were rewritten. Existing 120 tests passed; two new C0 contract tests passed; TypeScript checks passed. Future catalog slots are descriptive and are not exposed as functioning controls.

## Next
C1: versioned SiteDocument, functioning Personalization/Theme/Audio settings and public bindings, with private drafts and explicit publication.
