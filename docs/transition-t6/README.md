# T6 — Final cinematic production

T6 replaces the browser-only fallback as the primary Heart → Wiffeyyyy OS experience with a real authored cinematic while preserving the existing T0–T5 player, fallbacks, accessibility rules and exact live `/home` handoff.

## Goal

Produce one continuous premium unboxing sequence that feels physically believable and ends on the exact composition of the real Wiffeyyyy OS phone so the website can match-cut from video to the live interactive interface without a visible jump.

The runtime contract remains **8.3 seconds total**, with the route handoff beginning at **7.5 seconds** and the default visual blend lasting **500 ms**. Desktop encoded media must target **≤16 MB** and mobile **≤8 MB**. The live phone uses an exact **390 × 844 px frame**, **7 px bezel**, and **376 × 830 px screen**; `computePhoneFit()` scales that frame only when the viewport cannot fit it with a 16 px safe margin on every side.

## Production direction

The finished piece should look like a restrained luxury product film, not a game animation or UI demo:

- dark warm studio, nearly black background;
- matte charcoal/black premium phone box with subtle `Wiffeyyyy OS` mark;
- black fitted presentation gloves with believable fingers, joints and contact with the box;
- dark walnut / smoked-brown tabletop with very low reflectivity;
- one soft warm key light from high front-left plus a faint rim light;
- realistic shadows, material roughness and contact physics;
- slow deliberate camera motion with no handheld shake;
- no visible text overlays, scene labels, captions or UI chrome;
- no extra people, jewelry, sleeves, logos or props;
- phone remains physically consistent across every shot;
- screen remains black until the `screen-wake` beat.

The browser fallback remains available only when the authored cinematic cannot load or has not yet been uploaded.

## Generation strategy

Do **not** ask a video model to invent all 8.3 seconds in one unconstrained prompt. Generate controlled continuity shots and extend/stitch them while preserving the same seed/reference frame, box, gloves, table, lighting and phone.

The canonical shot plan is in `shot-manifest.json`. Runway-ready prompts and negative constraints are in `runway-prompts.md`.

## Desktop and mobile

Generate two authored masters:

- **Desktop:** 16:9 composition, recommended 1920 × 1080 master. Keep the action centered with generous negative space. The final upright phone must end dead-center and front-facing.
- **Mobile:** 9:16 composition, recommended 1080 × 1920 master. Camera is tighter vertically but must preserve the same physical choreography. Do not simply crop the desktop render if the hands, lid or phone leave frame.

Both masters must resolve to the same final phone orientation so the existing match-cut can take over.

## Screen strategy

The generative model does **not** need to reproduce the live Wiffeyyyy OS icons perfectly during the whole video. To avoid AI text/icon drift:

1. keep the phone display fully black through the lift;
2. at screen wake, allow only a soft neutral/purple glow or a deliberately simplified screen;
3. during the last part of the wake, transition toward a dark clean phone face;
4. let the existing T2/T4 live-phone bridge render the exact published Home screen for the final match frame.

This keeps the photoreal physical footage and the exact website UI in their respective strengths.

## Final-frame contract

At **7.5 s** the authored footage must present:

- phone upright in portrait;
- roll ≈ 0°;
- yaw ≈ 0°;
- pitch ≈ 0°;
- phone center at 50% viewport width / 50% viewport height;
- no hand crossing the display or bezel;
- no lid/box crossing behind the phone silhouette;
- enough dark negative space around the device for the live bridge to appear without a contour mismatch;
- stable camera for the final 8–12 frames before handoff;
- no exposure pulse or focus breathing at the cut.

The live match phone is 390 × 844 before viewport fitting. The authored video should visually land on that same apparent size rather than zooming past it.

## Audio

Keep the master video usable while muted. Separate audio lanes are preferred:

- very low cinematic ambient score;
- soft box/lid movement cue near the top-down opening;
- restrained screen-wake chime at the wake beat.

Do not bake essential dialogue or narration into the footage. The existing player synchronizes these lanes and starts muted until the visitor explicitly enables sound.

## Acceptance

T6 is complete only when:

1. desktop and mobile authored cinematic assets are approved visually;
2. footage reaches the configured 7.5 s handoff point;
3. encoded sizes pass the T4 certification budget;
4. the final-frame silhouette aligns with the real phone on desktop and mobile;
5. the real `/home` route is already committed before the overlay disappears;
6. no black flash, layout jump, scale pop or wallpaper mismatch is visible;
7. reduced-motion, slow-network, skip and fallback paths still pass existing tests.
