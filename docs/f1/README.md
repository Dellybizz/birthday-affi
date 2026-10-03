# F1 — Unified Control Panel

F1 turns the previously separate admin routes into one consistent control-panel experience while preserving the F0 canonical backend and all existing publish boundaries.

## What changed

- Added a persistent Shopify-inspired admin shell for normal control-panel routes.
- Added grouped navigation for Dashboard, Pages, Navigation, Media, Site settings and Hotline.
- Added mobile navigation, active-route highlighting, global Open editor, View site and Sign out actions.
- Kept `/login`, `/editor/*` and `/preview/*` outside the shell so authentication and the visual-editor canvas retain their dedicated layouts.
- Replaced the old `/` Pages view with a real dashboard.
- Moved page creation/duplication into `/pages` so the workflow is not lost when `/` becomes Dashboard.
- Standardized Pages, Navigation, Media, Settings and Hotline around shared page headers and panel surfaces.
- Kept `/theme` and `/audio` working as compatibility aliases to Site settings.

## Dashboard truth model

The dashboard reads only the canonical F0 stores:

- `pages` + `page_versions`
- `site_configurations` + `site_configuration_versions`
- `site_navigation` + `navigation_versions`
- `media_assets`
- `site_releases`
- the shared `experienceRegistry` / `activeDocumentExperiences`

It does not revive legacy `site_settings` or `app_content_items` write models.

Publication indicators compare the current draft document with the document referenced by the current published pointer:

- **Published** — draft matches the referenced published version.
- **Unpublished changes** — a valid published version is live, but the draft is newer/different.
- **Draft only** — no published pointer exists.
- **Missing record** — a canonical experience has no editable page record.
- **Pointer issue** — a published pointer does not resolve to its version.

Draft-only and changed states are not treated as backend failures. Missing records and broken pointers are surfaced as health issues.

## Preservation guarantees

F1 is a presentation and read-model phase. It does not:

- publish pages, navigation or site settings;
- capture a site release;
- modify page IDs/slugs/order;
- rewrite media records;
- migrate or delete legacy data;
- merge visitor/runtime state into CMS content.

Existing per-surface save/publish controls continue to own writes. Whole-site publish/rollback remains an F2 concern.

## Compatibility

The visual editor, preview routes, login, existing page manager, navigation editor, media library, configuration editor and Hotline link tooling keep their existing write behavior. F1 only gives them a shared admin frame and a truthful dashboard.

## Verification

`pnpm test:f1` covers publication-state calculation, health semantics, shell exclusions, canonical table usage, route consolidation and preservation of the page-creation workflow. The full repository CI remains the certification gate.
