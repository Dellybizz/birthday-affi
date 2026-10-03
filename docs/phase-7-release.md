# Phase 7 — Public birthday experience

Implemented a welcome screen at `/`, a birthday home at `/home`, and a shared shell around all six app routes. Cream/blush cards, serif greeting, quiet heart details, responsive two-column grid, a current-date status bar and the Hotline Start Here indicator follow the design foundation. Existing published welcome/home/app documents still supply their content inside the shell. The previous hardcoded September date is removed.

The in-app notification inbox supports unread counts, open/dismiss, mark all read, keyboard Escape and native modal focus containment. It requests no browser push permissions. Notification content is a fixed introductory inbox in this phase; authoring or server-driven delivery is future work.

Versioned local browser state records entry, visited apps, last app, read notifications and reduced-motion preference. Corrupt or incompatible stored state safely resets; unknown routes/notification IDs are rejected. State survives reloads and synchronizes across tabs. Storage restrictions fall back to in-memory preferences. Default home scroll position uses session storage. A browser-progress reset is available in the inbox. No account, personal profile or server-side visitor tracking is introduced.

The shared shell includes Home navigation, an app heading, welcome access, a skip link, visible focus and reduced-motion support. Loading failures show retry/home actions without disclosing backend details. Real app content/interactions are Phase 8; audio/video orchestration is Phase 9. The existing sample app experiences remain samples.

Verification: 88 tests pass (81 previous plus seven visitor-state persistence/validation checks), public app TypeScript and production build pass. Browser verification and production details are recorded below after deployment. Phase 6's unresolved Supabase Storage activation does not block this UI phase; real uploads remain pending.

Production release: the public app is READY at https://wiffeyyyy-os.vercel.app/ and https://wiffeyyyy-os.vercel.app/home. Vercel deployment `dpl_HvZaCavn279LNQwqkbCpwEc23K1E` used source commit `dc61212b802523d357400514b1cb0a9ed9bc530b` (tree `17d2e78a40b569a041d6c13c89beb87ca8b98142`). Build logs reported 45 seconds. The initial source-upload deployment failed to resolve workspace dependencies; redeploying with the latest project settings succeeded. Only the public app was deployed; the admin remains on its Phase 6 release.

Live browser verification passed: public welcome and home access without login; welcome-to-home navigation; notification dialog, mark all read and Escape; read acknowledgements and reduced-motion preference after reload; home-to-Hotline navigation in the shared shell; Home return; recent-app and visited labels after reload. No app error overlay or app console errors were observed. A home screenshot was saved as release evidence. Mobile/real-device behavior, blocked browser storage, cross-tab synchronization and scroll restoration were not interactively exercised; storage validation/reducer behavior is covered by unit tests.

The dedicated Supabase project's `storage.objects` relation was still absent when rechecked during this release. Phase 6 media uploads remain pending provider Storage activation; Phase 7 makes no database changes.
