# P3 — Device viewport model and zoom-proof preview

The visual editor preview uses an isolated iframe whose logical viewport is independent from the admin canvas and browser zoom.

## Presets

- Mobile: 390 × 830
- Large phone: 430 × 932
- Tablet: 768 × 1024
- Desktop: 1440 × 900
- Responsive: manually resizable, clamped to 320–1600 px wide and 568–1200 px high

The preview is rendered at the selected logical size first. The entire iframe is then visually scaled with `transform: scale(...)` so it fits between the Shopify-style sidebars. Chrome/browser zoom therefore changes the fit scale, not the page's responsive breakpoint.

Responsive mode exposes a drag handle. Pointer movement is converted back into logical pixels by dividing the visual delta by the current fit scale, which prevents browser zoom from corrupting manual viewport sizing.

The CMS responsive device category is derived from the logical viewport width (`<600` mobile, `<960` tablet, otherwise desktop), while CSS media queries run naturally against the iframe's actual logical width.

No CMS content, media, page IDs, ordering, drafts, published pointers, or visitor state are changed by this phase.
