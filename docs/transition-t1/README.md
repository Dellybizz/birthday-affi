# T1 — Heart → Phone runtime

T1 turns the T0 Heart-to-phone contract into live visitor behavior without requiring final cinematic media.

## Runtime flow

1. The Heart iframe still owns the visible final CTA.
2. When that CTA targets `/home`, `HeartPage` normalizes the existing `heartPart: next` action through the T0 contract and sends the configuration with the `wiffey:journey` event.
3. The root `ArchiveJourney` receives the configuration. Because this component lives in the root layout, it survives the route change and can keep the cinematic above both Heart and Home.
4. `/home` is prefetched before playback begins.
5. `HeartPhoneTransition` starts either the configured video or the built-in T1 fallback choreography.
6. At `handoffAtMs`, the journey pushes the configured destination while the cinematic layer stays above the page and begins its blend.
7. The overlay is removed after the configured handoff duration. The live Home interface underneath is then interactive.

## Placeholder-safe behavior

T1 does not depend on T2 media. With empty video fields, the player renders a lightweight CSS choreography matching the six-beat contract: premium box, black gloves, opening lid, phone lift, screen wake, live handoff. T2 can later provide desktop/mobile video and poster URLs without changing the routing or CMS contract.

## Fallbacks

- `prefers-reduced-motion` or the site's reduced-motion mode skips heavy playback and goes directly through the handoff.
- Save-Data, 2G and slow-2G avoid the full video. `poster-to-home` shows the configured poster briefly; `skip-to-home` navigates immediately.
- A video playback or loading failure falls back to the built-in choreography rather than trapping the visitor.
- A watchdog guarantees a route handoff even if media events fail.
- Skip is available whenever `playback.showSkip` is enabled.
- Video begins muted. Optional sound can only be enabled from a visitor control after the transition has started.

## T1 files

- `packages/ui/src/heart-page.tsx` — attaches the versioned transition contract to the Heart navigation event.
- `apps/web/components/archive-journey.tsx` — persistent route orchestration and destination prefetch.
- `apps/web/components/heart-phone-transition.tsx` — runtime player and fallback logic.
- `apps/web/app/heart-phone-transition.css` — cinematic fallback and handoff styling.
- `tests/transition-t1.test.mjs` — focused regression coverage.

## Boundary

T1 does not upload or generate the final cinematic media, tune the final frame against the live wallpaper/icon geometry, or expose the full editor controls. Those remain T2/T3 responsibilities.
