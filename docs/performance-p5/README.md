# P5 — Android-style app open/close transitions

P5 adds a shared transition manager to the persistent phone shell. It does not delay route navigation.

## Opening

1. Pointer-down on a Home app link records the real `.phone-icon` bounding box.
2. The origin is converted back to the phone's logical coordinate system so CSS zoom does not distort the animation.
3. P4 navigation starts normally and immediately.
4. A GPU-composited surface expands from the icon rectangle to the full phone using transform + border-radius only.
5. If the route is still loading after the 260 ms morph, the expanded surface stays in place.
6. Once the destination pathname is mounted, the transition surface fades away in 90 ms.

## Closing

App → Home links reverse the full-screen surface toward the remembered icon origin. The origin is retained in `sessionStorage` so browser back/forward and soft route transitions can still target the correct Home icon when possible. A safe bottom-center fallback is used for directly opened app URLs.

## Motion contract

- Opening morph: 260 ms
- Closing morph: 230 ms
- Reveal: 90 ms
- Easing: `cubic-bezier(.2,.8,.2,1)`
- Animation properties: transform, border-radius, opacity and transition-surface background only
- Route navigation is never held until the animation finishes
- `prefers-reduced-motion` and the OS Reduce motion setting skip the morph

The transition manager is app-agnostic and covers Hotdial, Adore, Pardanasheen, Saragram, Kiss Shop, Clicksara, Vault and Pieces of Us without adding animation code to each app.
