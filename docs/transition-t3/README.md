# T3 — Cinematic transition editor controls

T3 makes the Heart → Wiffeyyyy OS cinematic transition fully editable from the existing Shopify-style visual editor without adding a database table or a second settings system.

## Where to edit

Open **In My Heart** in the admin visual editor and select **Continue to iPhone** inside **Back and forward navigation**. The inspector reads and writes the same flat `heartPart: next` action properties defined in T0, so draft autosave, version history, rollback and publishing continue to work unchanged.

## Controls

### Content and animation
- Enable / disable the cinematic transition.
- Edit the trigger label and screen-reader label.

### Media
- Replace the desktop cinematic video from the video library.
- Optionally replace the mobile cinematic video independently. Empty mobile media falls back to desktop footage.
- Replace the cinematic poster from the image library.

### Playback and audio
- Duration, skip visibility and skip label.
- Allow replay flag.
- Enable transition audio.
- Replace background score, unboxing SFX and screen-wake SFX from the audio library.
- Set transition volume.

### Navigation / handoff
- Destination route.
- Match point and blend duration.
- Match-cut, fade or instant strategy.
- Destination preloading and final-wallpaper synchronization.

### Performance
- Video preload mode.
- Slow-connection fallback.
- Mobile and desktop media byte budgets.

### Accessibility
- Reduced-motion fallback.
- Scene-change announcements.

The safety invariants from T0 remain non-editable: playback begins muted, skipping is always possible, and the destination stays interaction-locked until the handoff completes.

## Backward compatibility

Legacy Heart documents do not need migration. Missing values are displayed from `defaultHeartToPhoneTransition`, and resetting a T3 field restores the contract default. Newly created Heart pages persist the complete transition contract immediately.

## Media replacement

T3 maps each transition field to the existing typed Media Library contract. Selecting a video, image or audio asset stores `/media/<asset-id>` in the existing Heart action prop. Direct HTTPS URLs and site-relative paths remain supported and are validated before save.

## Verification

`tests/transition-t3.test.mjs` verifies the full editor field set, typed media targets, default/reset behavior, inspector grouping, package export routing and seeded Heart-page contract.
