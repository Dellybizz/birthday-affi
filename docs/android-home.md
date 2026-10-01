# Android homepage

The `/home` route renders a phone launcher from the same document used by the visual editor.

Editor hierarchy: Home → Android home screen → Wallpaper / Status bar / Notification shade / Widgets / Apps / Android navigation bar. Apps contains a grid settings block and individual icon image blocks; Notification shade contains individual notification text blocks.

- Select Wallpaper, choose a photo from the media library or enter its URL, adjust fit/focal point and dimming, then publish Home.
- Select each app icon to change its label, emoji or custom image, background and destination page slug. Add, duplicate, reorder, hide or delete icons through the existing layer controls. Apps provides an Add app icon button.
- Select Notification shade and its children to edit the panel copy, messages and destinations. Add notification creates another editable message.
- Pull down or tap the status bar to open notifications. Swipe up at the handle, use Close, or press Escape to close. Dismiss individual notifications or clear the inbox. Dismissals and reduced motion are saved in this browser only.
- The clock uses the site's configured timezone. Status battery/network symbols are decorative. Quick settings control reduced motion and open Birthday Radio.
- Published navigation remains authoritative: hidden entries and children of hidden folders are excluded. Custom navigation entries remain available as icons/folders. Application pages continue to use their existing routes.

Compatibility: the upgrade wraps existing home roots without discarding content, IDs, theme, visibility or ordering. It is idempotent, runs in public/editor/saved-preview readers, and persists with the next normal draft edit. Image, text and section nodes use the existing SQL validation, media ownership, draft revisions, publication and version history. No schema migration is required. Historical home versions use the new presentation while retaining their original copy.

Verification: full existing automated suite, additional preservation/collision tests, server rendering tests and SQL save/publish tests pass. Web and admin production builds and TypeScript checks pass. Native browser gesture/visual verification was blocked by the environment's browser download restrictions. Vercel project access returned 403; deployment requires the existing Git integration or an authorized Vercel connection.
