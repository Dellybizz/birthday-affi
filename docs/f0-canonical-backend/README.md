# F0 — Canonical backend

F0 consolidates metadata and establishes release-manifest groundwork without migrating, resetting, publishing, or rolling back any existing content.

## Canonical sources

- **Experience metadata** — `packages/content/src/experience-registry.ts`
  - one source for built-in titles, routes, order, surface, lifecycle and runtime/document authoring mode;
  - admin page catalogue and public app metadata derive from this registry.
- **Page content** — `pages.draft_document` + `page_versions`.
- **Global site configuration** — `site_configurations` + `site_configuration_versions`.
- **Navigation** — `site_navigation` + `navigation_versions`.
- **Media** — `media_assets` + private storage.
- **Visitor/runtime state** — remains outside CMS page documents.

The old `saveSiteSettings()` / `site_settings` and `saveAppItem()` / `app_content_items` helper write paths are no longer exposed from the admin page action layer. Existing database records, if any, are not deleted by F0.

## Experience lifecycle

The registry distinguishes:

1. **Active document experiences** — Archive, Heart, Home, Adore, Hotdial, Pardanasheen, Saragram and Kiss Shop.
2. **Runtime experiences** — Clicksara, Vault and Pieces of Us. They have canonical route metadata but visitor/runtime data is not treated as ordinary CMS content.
3. **Legacy preserved experiences** — Welcome and Birthday Radio metadata remain recognized for saved historical page records.

## Release manifest groundwork

Migration `20261003053000_f0_canonical_releases.sql` adds:

- `site_releases`
- `site_release_pages`
- `capture_site_release()`

A captured release stores references to the *current* published site configuration, navigation version and published page versions, plus each page's route metadata.

F0 capture is intentionally **snapshot-only**. It does not:

- create page/config/navigation versions;
- change any published pointer;
- alter drafts;
- publish pending changes;
- perform rollback.

That boundary is deliberate so F1/F2 can build a review/publish/rollback UI on top of an immutable release history without risking today's live site.

## Preservation guarantee

F0 contains no data migration that rewrites existing pages, media, page IDs, revisions, published pointers, navigation documents, site configuration documents or visitor data.
