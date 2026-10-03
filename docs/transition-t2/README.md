# T2 — production Heart → Phone match-cut

T2 turns the T1 runtime shell into a production-quality handoff. It does not migrate page data or publish new CMS content.

## Exact live-screen synchronization

The cinematic phone now renders the same published Home page document used by `/home`, through the normal `CMSRenderer` and `PhoneHome` implementation. The transition therefore inherits the real wallpaper, widget, icons, labels, dock, theme, navigation and responsive mobile overrides instead of using a painted approximation.

The cinematic and public phone shells share one geometry helper:

- outer frame: **390 × 844**
- bezel: **7 px**
- screen: **376 × 830**
- public and cinematic fit scale both use `computePhoneFit()`

This gives the final cinematic phone and the committed `/home` phone the same center point and scale on desktop and mobile.

## Route-ready release

At the configured handoff timestamp the transition asks Next.js to navigate to `/home`, but the overlay does **not** immediately disappear. It remains opaque in `handoff` mode until `usePathname()` confirms that the destination route is committed. T2 then waits two animation frames plus a short stabilization window before fading the overlay.

If navigation gets stuck, the existing watchdog escalates to `window.location.assign()` rather than revealing the old Heart page underneath a failed transition.

## Final-frame bridge

The real CMS-driven Home screen is present inside the cinematic phone during the final reveal. During `handoff` the background footage/fallback is subdued while the exact live phone is locked at its final geometry. When the overlay fades, the real route underneath is visually the same phone.

This bridge works with either:

1. the built-in CSS unboxing fallback; or
2. an uploaded desktop/mobile cinematic video.

A photorealistic binary video is intentionally **not committed by T2** because no final source render was supplied. When a render is uploaded later through the transition media controls, the same final-frame bridge masks small framing differences and preserves the exact live handoff.

## Sound design

T2 implements the three existing audio lanes from the T0 contract:

- background score;
- unboxing/lid-open SFX at the `top-down-open` cue;
- screen-wake SFX at the `screen-wake` cue.

Audio remains opt-in. If separate audio lanes are present, the video stays muted to prevent duplicate sound. If no separate lanes are configured, an enabled video soundtrack can be unmuted after user interaction.

## Performance and accessibility

T1 protections remain intact: reduced motion, Save-Data/2G fallback, always-available skip, focus trapping, body-scroll locking, mobile video override, poster fallback and a route watchdog. The exact Home preview is rendered from already-loaded CMS data; it does not need a second public-page fetch.

## Verification

`tests/transition-t2.test.mjs` locks:

- shared phone geometry;
- real published Home rendering in the cinematic phone;
- route-ready overlay release;
- exact bezel/screen match-cut dimensions;
- layered audio cue wiring.

T1 regression assertions were updated only to stop depending on temporary T1 keyframe names; their behavioral checks remain in place.
