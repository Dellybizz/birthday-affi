# Phase 11 — QA baseline and acceptance checklist

Status: started, not certified complete. Checked on 2026-10-01 against application commit 2a133d52b054602b7675ff33106cb6186a07357c.

## Verified baseline

| Check | Result | Evidence and limits |
| --- | --- | --- |
| Automated regression suite | Pass | Fresh node --test tests/*.test.mjs run: 120 passing tests. Includes document validation, responsive inheritance/reset, templates, import/remapping, revision comparison, playback/captions and SQL contracts. |
| GitHub CI | Pass | Latest application commit has successful quality and typecheck checks. |
| Public deployment | Ready | Vercel reports successful wiffeyyyy-os deployment for the application commit. |
| Admin deployment | Ready | Vercel reports successful wiffeyyyy-panel deployment for the application commit. |
| Anonymous home access | Pass | Live /home loaded without sign-in and exposed all six app links. Does not certify every route. |
| Notifications keyboard smoke | Pass | Live dialog opened; Escape closed it and focus returned to the Notifications button. |
| Admin login form | Pass | Live /login exposes labelled username/password inputs and a sign-in button. Authenticated editor flow was not exercised in this pass. |

Existing production builds and TypeScript checks passed during Phase 10A; this pass did not rebuild unchanged application source. CSS contains reduced-motion handling, but this is source inspection rather than a complete motion/accessibility audit.

## Required acceptance work

Record browser, device, build, fixture and observed result for every check; an untested row is not a pass.

| Area | Acceptance checks | Current state |
| --- | --- | --- |
| Public journeys | Welcome/home; each of six apps; back/forward; reload; missing route; persisted state | Home smoke only |
| Editor journey | Sign in, select nested layer, change text/style/media, undo/redo, autosave/reload, private preview, publish, rollback and confirm public output | Pending authenticated end-to-end run |
| Responsive editing | Base plus mobile/tablet/desktop overrides; reset; inherited styles; narrow-panel usability and renderer parity | Logic tests pass; live interaction pending |
| Keyboard/accessibility | Tab order, visible focus, modal focus containment/return, menus, editor controls, semantic labels, errors, contrast, zoom/reflow and screen-reader checks | Notifications smoke only |
| Browser/device coverage | Chrome, Firefox and Safari; actual iOS and Android; portrait/landscape; touch controls | Pending |
| Performance | Repeated mobile/desktop Lighthouse runs on home and media-heavy pages; retain reports; measure LCP/INP/CLS with representative published content | Not measured |
| Media | Real image/audio/video assets, captions, fit/ratio, resume, source switching, buffering, broken URLs and slow connections | Unit coverage exists; real playback pending |
| Failure recovery | Offline save, reconnect, stale revisions, rejected publish, expired login, denied storage and upload failures | Automated coverage is partial; live fault checks pending |
| Security boundary | Anonymous draft/preview denial; editor/viewer/owner action boundaries; published content separation | SQL/policy tests exist; live role matrix pending |

Performance acceptance targets: LCP at most 2.5 seconds, INP at most 200 milliseconds and CLS at most 0.1 at the 75th percentile where field data is available. Lighthouse is a lab diagnostic and cannot establish field INP or WCAG compliance. Accessibility target: WCAG 2.2 AA with manual checks in addition to automated scanning.

## Dependencies and release blockers

- Supabase media storage is not provisioned. Real uploads, retention and representative media loading cannot be certified until it is active.
- Phase 10A shipped; linked global components and scheduled publishing remain unfinished.
- Global personalization, editable navigation/site shell, complete page management and whole-site publishing remain requirements-audit.md completion work.
- This baseline does not certify the full requested Shopify-like editing experience or production readiness.

Public site: https://wiffeyyyy-os.vercel.app/home
Admin: https://wiffeyyyy-panel.vercel.app/login
