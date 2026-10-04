# E1 — page switcher, live/draft preview and draft-safe navigation

E1 upgrades the editor shell without changing page documents or publishing anything.

- The editor server route now loads the current page and complete site page list in one request boundary and passes a normalized page catalog to the client.
- The top toolbar has a searchable Shopify-style page selector grouped into active experiences, custom drafts, saved/legacy pages and runtime-only apps.
- Active experience names and live routes are explicit. Saved titles that differ from the current experience name remain visible as metadata rather than being overwritten.
- Publication state is truthful: Published, Live fallback · draft unpublished, Draft only, Archived, Legacy saved page, missing record, and Runtime · editor in E5 are separate states.
- Camera, Vault and Pieces of Us remain visible but disabled in the editor chooser until their E5 authoring adapters exist.
- Draft preview and View live are independent actions. Draft preview stays on the authenticated admin origin and reads the saved draft. View live requires `NEXT_PUBLIC_WEB_URL` (or the legacy `NEXT_PUBLIC_SITE_URL`) and opens the actual public route.
- Page switching stages and flushes the current document before navigation. Conflicts and save failures cancel navigation and keep the editor on the current page.
- Existing autosave, version history, publish/rollback, media, inspector and responsive controls are unchanged.

No migration, fallback publication, page reset, archive change, runtime-data write or visitor-state change is part of E1.

Automated E1 tests cover catalog classification, route generation, explicit public-origin handling, save-before-switch ordering, save-failure cancellation and conflict blocking. Signed-in browser verification remains an E6 acceptance gate if no authenticated browser session is available during this phase.
