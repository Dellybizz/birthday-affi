# T4 — Heart → Phone production certification and hardening

T4 is the post-roadmap hardening pass for the cinematic Heart → Wiffeyyyy OS transition. T0–T3 established the contract, runtime, match-cut and editor controls; T4 verifies that those editor controls produce distinct runtime behavior and adds reusable media-readiness certification for release tooling.

## Runtime strategy fidelity

The T3 handoff strategy selector is now fully honored:

- **match-cut** keeps the T2 synchronized live-phone bridge and exact Home-screen geometry;
- **fade** keeps the authored cinematic frame intact during route commit, then fades the overlay away without inserting the match phone;
- **instant** still waits until the destination route is committed, then removes the transition immediately with no visual fade.

This preserves the route-ready safety rule: no strategy reveals an uncommitted or stale page underneath the transition.

## Persisted controls completed

Two already-persisted T0/T3 controls are now runtime-active:

- `transitionAllowReplay` shows a Replay control during the cinematic and restarts the video/CSS timeline, scene label and audio scheduling without navigating;
- `transitionAriaLabel` is used as the transition dialog's accessible name instead of a hard-coded label.

Replay disappears once handoff begins and cannot reset a transition after navigation has started.

## Media certification contract

`packages/content/src/heart-transition-certification.ts` exports `certifyHeartToPhoneTransition()` for admin, CI and release tooling. It combines the existing transition validator with optional real media metadata.

Certification checks:

- transition contract validity;
- desktop/mobile MP4 or WebM type when metadata is available;
- configured desktop and mobile byte budgets;
- video duration reaching the configured handoff point;
- authored poster availability;
- mobile override reuse notice;
- match-cut wallpaper synchronization.

Certification statuses are:

- **disabled** — transition intentionally disabled;
- **blocked** — contract or supplied media metadata cannot safely reach handoff;
- **fallback-ready** — no authored desktop video, but the existing built-in cinematic fallback is safe;
- **ready** — authored desktop footage is configured and no blocking issue is present.

Missing final footage is deliberately not a production outage because the CSS unboxing fallback, poster path, reduced-motion path and constrained-network path remain part of the runtime contract.

## Regression gates

`tests/transition-t4.test.mjs` verifies:

- match-cut / fade / instant are no longer aliases;
- route-ready instant release remains guarded by destination commit;
- replay and accessible-name settings are wired to runtime;
- missing video remains fallback-ready;
- oversized, too-short and unsupported video metadata blocks certification;
- match-cut without wallpaper sync produces a visible warning;
- the certification API is exported by `@wiffeyyyy/content`.

The existing T0–T3 tests remain unchanged so T4 must pass on top of all prior behavior rather than replacing it.
