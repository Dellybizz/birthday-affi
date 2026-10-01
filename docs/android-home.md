# iPhone-style homepage

The `/home` route renders a phone launcher from the same document used by the visual editor.

Editor hierarchy: Home → iPhone home screen → Wallpaper / Status bar / Notification shade / Birthday widget / Apps / Home indicator. Apps contains a grid settings block and individual icon image blocks; Notification shade contains individual notification text blocks.

- Select Wallpaper, choose a photo from the media library or enter its URL, adjust fit/focal point and dimming, then publish Home.
- Select each app icon to change its label, emoji or custom image, background and destination page slug. Add, duplicate, reorder, hide or delete icons through the existing layer controls. Apps provides an Add app icon button.
- Select Notification shade and its children to edit the panel copy, messages and destinations. Add notification creates another editable message.
- Pull down or tap the status bar to open notifications. Swipe up on the panel or bottom home indicator, use Close, or press Escape to close. Upward drags and short flicks close the shade; horizontal swipes are ignored. Long inboxes scroll without opening a notification accidentally. Dismiss individual notifications or clear the inbox. Dismissals and reduced motion are saved in this browser only.
- The clock uses the site's configured timezone. Status battery and network symbols are decorative. Quick settings control reduced motion.
- Published navigation remains authoritative: hidden entries and children of hidden folders are excluded. Custom navigation entries remain available as icons/folders. Application pages continue to use their existing routes.

Compatibility: the upgrade wraps existing home roots without discarding content, IDs, theme, visibility or ordering. It is idempotent, runs in public/editor/saved-preview readers, and persists with the next normal draft edit. Image, text and section nodes use the existing SQL validation, media ownership, draft revisions, publication and version history. No schema migration is required. Historical home versions use the new presentation while retaining their original copy. The iPhone refinement hides optional legacy homepage notes without deleting them.

Verification: full existing automated suite, additional preservation/collision tests, server rendering tests and SQL save/publish tests pass. Web and admin production builds and TypeScript checks pass. Live browser QA verifies the deployed layout and interactions after publication.

The iPhone presentation uses a four-column grid, a translucent dock, compact birthday/clock widget, centered camera island and home indicator. Each icon has an editable Grid/Dock placement setting. The desktop frame is bounded to fit the viewport at different browser zoom levels; phones use the available screen. All six app destinations appear once, with no extra homepage text navigation.
