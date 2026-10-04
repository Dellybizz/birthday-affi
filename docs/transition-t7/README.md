# T7 — Fully editable cinematic transition

T7 turns the Heart → Wiffeyyyy OS transition into an editor-driven experience instead of a fixed effect.

## What the backend controls

The Heart page `next` action now owns all transition settings as flat CMS props so versioning, draft/publish, undo/redo and rollback keep working without a new database schema.

### Scene media

Each storyboard beat has a desktop image slot and an optional mobile override:

1. Closed box
2. Gloved hands
3. Open box
4. Phone lift
5. Screen wake
6. Final handoff

The render source can be `auto`, `video`, `hybrid`, or `fallback`. `auto` prefers authored video, then authored frames, then the browser-built fallback.

### Art direction

The editor controls studio background, ambient and key-light colours, light intensity, brightness, contrast, saturation, vignette, bloom, whole-scene scale/position, frame fit and focal position.

### Geometry

The browser-built fallback exposes box width, box aspect ratio, corner radius, lid thickness and tray inset. Live phone scale, mobile scale, horizontal/vertical offset, tilt and screen opacity are also editable.

> Generated or photographed frame pixels are not physically remodelled by numeric geometry controls. For those frames, use replaceable scene media plus framing/lighting controls. Geometry controls apply directly to the browser-built fallback and live phone layer.

### Timing

The end time of each storyboard beat can be edited. Values are normalized into chronological non-overlapping scenes inside the total transition duration.

### Exact Wiffeyyyy OS interface

`OS screen source = Live Home` renders the actual published Home page inside the cinematic phone through `CMSRenderer`. This means wallpaper, birthday widget, app icons, labels and dock remain controlled from the normal Home page editor and the final handoff uses the same UI instead of a generated approximation.

`Frame only` remains available for intentionally baked artwork.

## Runtime safety

Reduced-motion, Skip, slow-network fallback, route-commit locking, media budgets, replay, audio cues and match-cut/fade/instant handoff behavior remain intact.
