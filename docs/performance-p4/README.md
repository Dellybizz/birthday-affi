# P4 — Frontend click latency

P4 makes navigation begin in the same user interaction instead of waiting for a transition animation.

## Contract

- Archive / Heart / Home journey navigation calls `router.push()` immediately after setting the closing visual state.
- The close/open curtain covers route work; it never gates navigation.
- Core Home/app destinations are prefetched and same-origin links are warmed again on pointer hover/down.
- Pointer-down gives an immediate pressed state.
- Cold Home and app routes have lightweight `loading.tsx` surfaces so the phone never appears unresponsive.
- Reduced-motion mode still navigates immediately and skips decorative animation.
- Existing content, visitor progress and CMS data are unchanged.

P5 owns the full Android-style origin/destination app-open and app-close animation. P4 is intentionally limited to response latency and route readiness.
