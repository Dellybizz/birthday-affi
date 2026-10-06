# B5 — per-app authoring

All eight apps expose document-backed app settings and typed item controls. Existing section and item ordering, visibility, duplication, media selection, draft saving and publication remain available.

- Saragram: profile and media fields, post/reel insertion, feed labels and appearance.
- Pardanasheen: photos/videos, albums, captions and dates, local camera visibility, initial sort, library labels and appearance.
- Clicksara: welcome and permission labels, camera/grid defaults, video availability, gallery destination and appearance. Camera access and local camera roll reads are disabled in page previews.
- Adore: reasons, categories, photos/voice notes, cards, tab labels, signature, favorites availability and appearance.
- Hotdial: contact/caller/photo and call labels, voicemail items and labels. Operational caller/receiver links remain in the existing private Hotline workspace.
- Vault: public question, screen labels, appearance and opening duration in the page editor. Accepted answers and 1–30 ordered chapters are edited at `/vault`, available only to owners.
- KissShop: products, images, descriptions, prices and availability; shop, cart and receipt copy and appearance.
- Pieces of Us: 0–10 visible levels, images, titles, difficulty labels, 2–8 piece columns/rows, aspect ratio, notes and reward copy. Changed image/geometry/order uses separate progress storage; preview progress is temporary.

## Privacy and publication

The migration creates three unpublished runtime page drafts. It preserves existing private story content and the original memory gate. New private answers use case-insensitive matching with punctuation and extra spaces ignored. Empty accepted-answer lists retain the original gate.

Private Vault configuration has RLS, no direct table grants, owner/session checks in security-definer RPCs, bounded validation, revision conflicts, explicit draft/publish actions and audit records containing only revision and chapter count. Neither answers nor chapters are allowed in ordinary public page documents. Private Vault publication is independent of ordinary page/site releases.

## Validation

- Full suite: 276 passed, 2 private legacy-answer fixtures skipped (fixtures were not supplied).
- Final targeted app/security suite: 20 passed.
- TypeScript and both production builds passed.
- Public renderer tests cover runtime labels, puzzle geometry and camera preview protection.
- Anonymous admin smoke and production checks protect editor and private Vault routes.

Authenticated owner browser interaction could not be exercised in this environment; server-side permission tests and renderer checks cover the implemented contracts.
