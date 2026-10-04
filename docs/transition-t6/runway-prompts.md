# T6 — Runway production prompts

These prompts are designed for controlled multi-shot generation. Use the same reference frame / seed / style reference whenever the model supports it. Do not regenerate the phone, gloves, box or set independently between shots.

## Global visual bible

**Subject continuity**

A premium matte charcoal-black rigid phone presentation box on a dark smoked-walnut tabletop in a nearly black luxury studio. The lid has one subtle centered inscription: `Wiffeyyyy OS`. Inside is a modern premium black smartphone with a tall portrait shape, thin symmetrical black bezel, rounded corners, glossy black glass and one centered pill-shaped dynamic-island-style cutout at the top. No external brand logo. Two realistic fitted matte-black presentation gloves handle the box. The gloves have natural human anatomy, five fingers each, subtle fabric texture and believable joint bending. No jewelry, no exposed skin, no visible sleeves beyond the wrist.

**Lighting**

Soft warm key light from high front-left, extremely soft fill, faint neutral rim from rear-right, deep cinematic shadows, controlled specular reflections on the phone glass, no neon colours, no harsh spotlight, no visible light source.

**Camera**

High-end commercial product cinematography, smooth stabilized dolly/crane movement, normal-to-short-telephoto perspective, shallow but not excessive depth of field, slow focus transitions, physically believable motion, premium restrained pacing. No handheld motion, no whip pan, no speed ramp, no sudden zoom.

**Look**

Photorealistic, luxury electronics commercial, dark restrained palette, realistic contact shadows, physically plausible materials, subtle filmic contrast, clean image, no grain overload, no fantasy elements.

## Global negative prompt

Extra fingers, missing fingers, fused fingers, warped hands, deformed gloves, duplicated hands, bare skin, jewelry, sleeves, floating hands, floating phone, floating box, object penetration, hand passing through lid, lid passing through box, impossible hinges, changing box dimensions, changing phone dimensions, phone morphing, changing bezel, changing screen cutout, random logos, Apple logo, Samsung logo, readable generated UI text, random icons, garbled typography, glowing neon room, bright white studio, strong lens flare, fisheye, wide-angle distortion, camera shake, sudden zoom, jump cuts, overexposed screen, focus pumping at final frame, motion blur on final frame.

---

## Shot 1 — Gift box · 0.0–1.2 s

### Prompt

Photorealistic luxury electronics product film. A matte charcoal-black rigid phone presentation box marked subtly `Wiffeyyyy OS` rests on a dark smoked-walnut tabletop in a nearly black studio. Low three-quarter side camera angle, box centered slightly below middle of frame. Soft warm key light gently reveals the lid edge, corner radius and matte material. Deep controlled background shadows. The camera makes an extremely slow stabilized push toward the box. No hands are visible yet. Nothing moves except the subtle camera push. Premium restrained Apple-style product-film pacing without showing any Apple branding.

### End-frame requirement

Box completely stable, centered, same dimensions and orientation needed for Shot 2. Hands remain outside frame.

---

## Shot 2 — Gloved hands enter · 1.2–2.6 s

### Prompt

Continue exactly from the previous frame with identical box, table, lighting, camera lens and studio. Two realistic fitted matte-black presentation gloves enter slowly and naturally from the lower left and lower right edges of frame. Each glove has anatomically correct fingers and subtle fine fabric texture. The fingertips gently make physical contact with opposite sides of the premium `Wiffeyyyy OS` box and steady it. The box responds with only a tiny believable contact movement. Camera continues the same almost imperceptible stabilized push-in. Dark luxury commercial lighting, realistic contact shadows, no exposed skin, no jewelry, no sleeves, no extra fingers.

### End-frame requirement

Both hands visibly contact the box. The box remains centered and has not changed shape, scale or material.

---

## Shot 3 — Top-down unboxing · 2.6–4.4 s

### Prompt

Continue seamlessly with the exact same black-gloved hands and exact same `Wiffeyyyy OS` box. The camera performs one slow elegant crane-and-tilt movement from the low three-quarter view toward a near top-down product view while keeping the box centered. The left glove stabilizes the base. The right glove slowly lifts the rigid lid upward with believable contact and weight. The lid separates cleanly from the base and reveals a fitted black tray containing the exact same premium black smartphone. The phone is lying flat in the tray and its display is completely black. Soft glass reflections only. The box, hands and phone obey realistic physical contact. No sudden camera movement, no object morphing.

### End-frame requirement

Lid clear of the phone, phone still fully seated in tray, screen completely black, hand anatomy clean.

---

## Shot 4 — Phone lift · 4.4–6.1 s

### Prompt

Continue exactly from the open-box frame. The same two fitted matte-black presentation gloves grip the smartphone by its outer edges only, never touching or covering the center of the display. They lift the phone smoothly out of the fitted tray. The smartphone remains the exact same model and proportions throughout. Its display stays completely black, reflecting only the soft studio key light. As the phone rises, it rotates naturally from the shallow tray angle toward an upright portrait orientation facing the camera. At the same time the camera eases from near top-down toward a frontal hero-product view and gently dollies closer, keeping the phone centered and increasing its apparent size continuously with no scale jump. The open box falls deeper into the dark background rather than disappearing suddenly.

### End-frame requirement

Phone mostly upright, centered, screen black, same proportions, no fingers covering display, box/lid visually subordinate.

---

## Shot 5 — Screen wake · 6.1–7.5 s

### Prompt

Continue seamlessly with the exact same upright black smartphone held in the exact same studio. The phone completes a small controlled move toward the camera and settles into a perfectly centered front-facing hero position. Roll zero, yaw zero, pitch zero. The black-gloved hands release the outer edges naturally and move fully away from the phone silhouette. The phone display remains black for the first moment, then wakes softly into a restrained deep mauve-purple ambient glow with no readable text and no generated icons. Avoid artificial UI details. The final camera movement eases to a complete stop. Dark clean negative space surrounds the phone. High-end photoreal product commercial, physically realistic reflections and shadows.

### Critical final-frame instruction

During the final 8–12 frames, the camera must be completely locked. Phone perfectly upright, centered at exactly the visual center of frame, no hands touching or overlapping it, no box or lid crossing behind its silhouette, no focus breathing, no exposure change, no motion blur. The phone must remain one stable size rather than continuing to zoom.

---

## Shot 6 — Handoff hold · 7.5–8.3 s

This should preferably be an **extension/hold of Shot 5**, not a new generated shot.

### Prompt

Hold the exact final hero composition from the previous frame. Absolutely no new camera motion. The same centered front-facing black smartphone remains perfectly still against the same dark studio background. No hands visible. No box crossing the device. The display remains a subtle deep mauve-purple glow without readable text or icons. No focus shift, no exposure shift, no scale change, no rotation. Stable premium product-film hold designed for a seamless match-cut into a live interactive phone interface.

---

# Desktop master instructions

- Generate / assemble at **16:9**, preferably **1920 × 1080** before final encoding.
- Keep the box and hands within the central ~65% of frame during opening.
- Keep the final phone exactly centered.
- Leave generous black negative space on both sides.
- Do not let hands enter from extreme frame edges at a size that makes them look enormous.
- Final phone silhouette should be large enough to feel intentional but should not exceed the visual scale of the live 390 × 844 phone bridge.

# Mobile master instructions

- Generate a dedicated **9:16**, preferably **1080 × 1920** master.
- Use the same objects, lighting and motion logic as desktop.
- Bring the camera slightly closer to the box so important hand action remains readable vertically.
- Keep both gloves fully visible during contact and opening; do not crop fingers at the frame edge.
- Keep the phone centered through lift and wake.
- Preserve dark negative space above and below for safe-area variation.
- Final phone must still resolve to a straight centered portrait hero view.

# Review rule

Reject a generation rather than trying to hide major anatomy or continuity errors with CSS. The website should only compensate for small framing differences during the final match-cut; it should not be used to mask malformed hands, a morphing phone, a changing box or discontinuous camera movement.
