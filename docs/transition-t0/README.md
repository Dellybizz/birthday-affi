# T0 — Heart → Phone cinematic transition contract

Status: design/data contract only. T0 does **not** change the live site, publish pages, upload media, rewrite existing Heart content or migrate database records.

## Experience contract

The transition begins only after the visitor activates the final Heart-page CTA. The default CTA is **Unbox your gift**. The cinematic is a short premium unboxing sequence ending in the real interactive iPhone-style home interface at `/home`.

The default storyboard lasts 8.3 seconds:

1. **0.0–1.2 s — Gift box.** Low three-quarter side view of a premium Wiffeyyyy OS phone box on a table.
2. **1.2–2.6 s — Gloved hands.** Black premium gloves enter, steady the box and begin the reveal.
3. **2.6–4.4 s — Top-down unboxing.** The camera eases toward a top view while the lid opens.
4. **4.4–6.1 s — Phone reveal.** The phone is lifted out while the display remains dark.
5. **6.1–7.5 s — Screen wake.** The screen lights using the same wallpaper and icon composition as the live phone home.
6. **7.5–8.3 s — Live handoff.** A match-cut aligns the cinematic phone with the live phone shell. The cinematic layer dissolves and the real interface becomes interactive.

The final frame must be authored against the actual home wallpaper, phone bezel proportions, Dynamic-Island/notch treatment, icon positions and dock geometry. The handoff is considered successful only when no visible black frame, route flash, layout jump or wallpaper mismatch occurs.

## Canonical storage contract

`packages/content/src/heart-to-phone-transition.ts` defines the T0 source of truth. The persisted transition belongs to the existing Heart-page action node whose `heartPart` is `next` — the same versioned action that currently carries the title and `/home` destination.

The contract is serialized into **flat primitive CMS props** on that action node. This deliberately fits the existing `CMSField` model and means:

- no new table, JSON side-channel or schema migration is required;
- `pages.draft_document` remains the editable source;
- normal Heart `page_versions` preserve published transition settings;
- F2 whole-site release capture and rollback preserve the transition together with the Heart page;
- old Heart documents containing only `title` and `href` remain valid and normalize to safe cinematic defaults without being rewritten by T0.

The flat editor-facing keys are listed in `editor-control-map.md`. The six scene definitions themselves remain code-owned in T0/T1 so a CMS edit cannot accidentally create overlapping or impossible choreography.

## Safety and browser behavior

- Audio starts muted and requires the visitor's explicit unboxing action before sound can be enabled.
- Skip remains available; no visitor is forced to watch the entire cinematic.
- `prefers-reduced-motion` defaults to a direct transition to `/home`.
- On slow connections the poster can bridge directly to home rather than downloading the full cinematic.
- The destination UI should preload before the match-cut so the end of the video never waits on a route fetch.
- Interactions with the live phone remain locked until the handoff completes; the page underneath must already be rendered and ready.
- Video and sound loading must never block the Heart page itself.
- External/non-site handoff routes are rejected by the contract.

## Media budgets

Default maximum encoded video targets: **8 MB mobile** and **16 MB desktop**. T1/T2 should prefer modern WebM where supported with MP4 fallback, but a deployment must still be usable when the cinematic asset is absent: poster → `/home` is the fail-safe path.

## Phase boundaries

**T1** implements the runtime transition player, Heart trigger, destination preloading, skip/reduced-motion paths and handoff using placeholder-safe media. **T2** integrates the final cinematic media, synchronizes the last frame with live Home and polishes the match-cut/audio. **T3** adds the full Shopify-style editor controls, media pickers, mobile/desktop asset overrides, advanced timing controls where safe, and live QA/performance certification.

## T0 acceptance

T0 is complete when the contract normalizes legacy Heart actions safely, validates route/timing/storyboard constraints, serializes to primitive CMS props only, is exported by `@wiffeyyyy/content`, and its focused tests pass. No live visitor behavior is claimed in T0.
