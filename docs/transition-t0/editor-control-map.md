# T0 editor control map

These are the T3 editor controls and their **flat Heart action CMS prop keys**. T0 fixes the names now so runtime and editor phases do not drift.

| Group | Control | Heart action prop | Default |
| --- | --- | --- | --- |
| General | Enable transition | `transitionEnabled` | on |
| General | Trigger label | `title` | Unbox your gift |
| General | Screen-reader label | `transitionAriaLabel` | Unbox your gift and enter Wiffeyyyy OS |
| Playback | Duration | `transitionDurationMs` | 8300 ms |
| Playback | Show skip | `transitionShowSkip` | on |
| Playback | Skip label | `transitionSkipLabel` | Skip |
| Playback | Allow replay | `transitionAllowReplay` | off |
| Media | Cinematic video | `transitionVideoSrc` | empty |
| Media | Mobile video override | `transitionMobileVideoSrc` | empty |
| Media | Poster | `transitionPosterSrc` | empty |
| Audio | Enable transition audio | `transitionAudioEnabled` | off |
| Audio | Background score | `transitionMusicSrc` | empty |
| Audio | Unboxing SFX | `transitionUnboxingSrc` | empty |
| Audio | Screen-wake SFX | `transitionWakeSrc` | empty |
| Audio | Volume | `transitionVolume` | 0.72 |
| Handoff | Destination | `href` | /home |
| Handoff | Match point | `transitionHandoffAtMs` | 7500 ms |
| Handoff | Blend duration | `transitionHandoffDurationMs` | 500 ms |
| Handoff | Strategy | `transitionHandoffStrategy` | match-cut |
| Handoff | Preload destination | `transitionPreloadDestination` | on |
| Handoff | Sync final wallpaper | `transitionMatchWallpaper` | on |
| Performance | Preload mode | `transitionPreload` | metadata |
| Performance | Slow-connection fallback | `transitionSlowConnectionBehavior` | poster-to-home |
| Performance | Mobile video budget | `transitionMaxMobileVideoBytes` | 8,000,000 |
| Performance | Desktop video budget | `transitionMaxDesktopVideoBytes` | 16,000,000 |
| Accessibility | Reduced-motion behavior | `transitionReducedMotionBehavior` | skip-to-home |
| Accessibility | Announce scene changes | `transitionAnnounceSceneChange` | off |

The following are **mandatory contract rules rather than toggles**: playback starts muted, skip is always permitted, and the live phone remains interaction-locked until handoff completes.

Scene timings remain fixed in T0/T1 to protect the cinematic choreography. T3 may expose advanced timing controls only if the final media asset supports independent timeline adjustment and the validator can guarantee chronological, non-overlapping scenes.
