# B3 — Global site and OS settings

The Settings page provides Personalization, OS Interface, Appearance, Status Bar / Dock, and Motion workspaces. Owners can edit the existing personal/site text and theme, phone geometry and frame, wallpaper and visual treatments, clock and chrome, and transition/notification preferences. The live preview uses the actual home draft and navigation draft.

New OS settings are optional on existing site documents. Legacy documents retain their existing page-level defaults until an owner saves OS settings. Complete OS settings are validated in TypeScript and PostgreSQL, including types, bounds, choices and safe media URLs. Saving updates only the settings draft; publishing and release rollback retain existing revision checks and permissions. Opening Settings never writes defaults or publishes content.

The shared phone surface renders configuration in the live OS and phone editor previews. Page experiences and custom page previews retain their full-page layout. Reduced-motion preferences disable transitions, and the system accessibility preference is respected.

Validation covers legacy compatibility, invalid settings, viewport fitting, owner authorization, stale revision rejection, unpublished draft isolation, release rollback and server-rendered workspaces with the real phone preview. Full regression tests, TypeScript checks and both production builds are required before deployment. Authenticated browser interaction is not covered by the automated server-render tests.
