# In My Heart

The visual source is `Dellybizz/birthday-site/heart.html` at commit `1e605a0afdcec37776d804b3f6ddc89afc7b6726` (19 September 2026). `packages/ui/src/heart-source.ts` retains its CSS, markup, 3D heart formulas, camera perspectives, pointer/keyboard/pinch interaction, motion and corner memory viewer.

The old site's Supabase configuration, local storage, freshness guards, journey locks, and runtime imports were removed. This page reads this site's published CMS document and uses this site's editor, media library, permissions, autosave and version history. The seed contains twenty independently editable image/video layers and uses only the three approved photos from this project. Six original video positions await supplied clips.

## Journey

Memories Archive (`/`) → In My Heart (`/pages/in-my-heart`) → iPhone (`/home`). The heart page includes archive/back and phone/forward controls; the phone returns to the heart. All chapter navigation uses the shared reversible reveal and respects reduced motion.

## Editor hierarchy

- Opening screen: chapter label, heading, emphasis, introduction and enter button.
- Perspective and toolbar: every label, hint and camera label.
- 3D geometry and motion: starting camera, drifting speed, heart dimensions/depth, layers, zoom, spread, heartbeat, and atmosphere visibility.
- Colors and glass appearance: palette, transparency, card dimensions/radii, popup dimensions/padding, control spacing/type size, toolbar placement, and grain/vignette strength.
- Heart memories: image/video/audio library uploads, title, note, fit/focal position, scale/3D offsets, design, duplication, ordering and visibility.
- Memory popup: previous, next and close labels.
- Navigation: button copy, styling and visibility; destinations remain the approved journey routes.
- Soundtrack: heartbeat and background music, repeat and initial volume. Playback begins only with visitor interaction; editor selection mode stays silent.
- Page: advanced CSS for all original selectors, including details outside standard numeric controls.

The CMS bridge uses element construction/textContent for editable text and checks the sending frame for every selection/navigation event. The iframe isolates original global CSS; its bundled scripts are trusted code. Editor updates post the document without resetting the view unless motion or memory geometry changes.

The heartbeat audio element was moved before engine initialization to fix the old null reference. Popup text can scroll on short displays, and editable opacity/media-fit apply to both card and popup. These changes retain the original appearance at default values.
