# T2 — cinematic quality, live Home sync and sound cues

T2 upgrades the T1 runtime from a placeholder-safe transition into the production cinematic handoff architecture. It keeps the same T0 CMS contract and does not migrate or rewrite Heart/Home content.

## What changed

### 1. The phone screen is now the real published Home

The root layout already loads the published `home` document and site configuration. T2 passes both into the persistent `ArchiveJourney`, and the transition renders that same document through `CMSRenderer` inside the cinematic phone.

This means the screen-wake frame automatically tracks the live Home source for:

- wallpaper media and focal position;
- wallpaper dimming/background;
- status bar and Dynamic-Island treatment;
- birthday widget content and nickname binding;
- app icons, labels and dock placement;
- theme/site settings and responsive phone layout.

The mirror is `aria-hidden`, marked `inert`, and has pointer interaction disabled. It is visual only.

### 2. Exact live geometry handoff

The cinematic phone uses the same **390 × 844 outer-device fitting rule** as the live OS. At `handoffAtMs`:

1. `/home` is pushed while the cinematic remains above it.
2. T2 waits briefly for the real `.birthday-os-phone` wrapper to mount.
3. It measures the actual live device with `getBoundingClientRect()`.
4. The cinematic phone cancels its timeline animation at its current frame.
5. The phone converges to the live wrapper's exact left/top/width/height, border scale and radius.
6. The overlay crossfades only after the geometry match has begun.
7. The transition unmounts, revealing the already-mounted interactive Home underneath.

If the live wrapper does not mount inside the bounded wait, the route still completes through the normal fade rather than trapping the visitor.

### 3. Polished built-in cinematic

The no-video path is now intended to be usable as a production fallback rather than a wireframe placeholder. It includes:

- warm studio key and rim lighting;
- dark table material and soft contact shadow;
- premium black presentation box with inset tray;
- Wiffeyyyy OS mark and heart detail;
- four-finger glove silhouettes with subtle material texture;
- phone side-button detail, reflection and bezel;
- screen-black to live-Home wake animation;
- camera/box/glove/phone choreography mapped to the original six T0 beats;
- responsive phone sizing using the same viewport-fit math as the live OS.

### 4. Real-video compatibility

Desktop/mobile cinematic URLs from T0 still take priority when supplied. The exact Home phone stays mounted invisibly behind the video so the final match layer is already warm when the video reaches `handoffAtMs`.

For a future photoreal render, author the final frame with a centered upright phone and keep the visible phone close to the live 390:844 device aspect. T2 will cover the final geometry correction and crossfade.

No binary cinematic is committed to Git. Large final video/poster files should stay in the existing media/storage pipeline and be referenced by the Heart transition CMS props. This avoids repository/deployment bloat and lets desktop/mobile encodes be replaced independently.

Recommended delivery targets remain the T0 budgets:

- mobile: up to **8 MB**;
- desktop: up to **16 MB**;
- WebM preferred where supported, MP4-compatible source/fallback as needed;
- poster image for constrained-network fallback.

### 5. Sound design timing

T2 now consumes the existing T0 audio fields:

- `musicSrc` starts from the visitor's current transition position when they explicitly enable sound;
- `unboxingSrc` is cued at the `top-down-open` scene;
- `wakeSrc` is cued at the `screen-wake` scene;
- all audio respects the configured transition volume;
- cleanup stops/reset audio when the transition completes or unmounts.

Playback still begins muted and no audio is started without the visitor's explicit **Turn on sound** action.

### 6. Accessibility and constrained devices

- reduced-motion uses an immediate route handoff rather than the geometry animation;
- Save-Data / 2G / slow-2G still bypass full cinematic download according to the T0 fallback setting;
- Escape and the visible Skip control remain available;
- the live Home stays covered and non-interactive until the transition component completes;
- the visual Home mirror cannot receive keyboard focus.

## T2 files

- `apps/web/components/heart-phone-transition.tsx` — published Home mirror, live geometry matching, cue-based audio and hardened fallbacks.
- `apps/web/components/archive-journey.tsx` — feeds the published Home document/site settings into the persistent transition.
- `apps/web/app/layout.tsx` — shares the same server-loaded Home/settings with both the live OS and transition.
- `apps/web/app/heart-phone-transition.css` — polished cinematic and synchronized phone screen reveal.
- `tests/transition-t2.test.mjs` — focused regression contract.

## Validation note

The T2 preview branch was submitted to Vercel, but the provider returned **build-rate-limit** before compilation for both OS and panel previews. That status is an account/platform throttle, not a code-level build error. The focused source regression suite is registered as `pnpm test:t2`; a normal preview build should be re-run when the Vercel rate window clears.

## Next phase

T3 exposes these T0/T2 transition properties in the Shopify-style admin editor: media pickers, desktop/mobile cinematic overrides, poster, audio assets, skip behavior, timing/handoff controls, preview/replay, and safe advanced choreography settings.
