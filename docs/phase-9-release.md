# Phase 9 — Audio/video orchestration

Implemented shared playback coordination for all generic audio/video blocks and Hotline, Movie and Radio. A newly started player pauses the previous player in the same browser tab. Navigation/unmount and hidden-tab transitions pause playback. Playback never starts automatically or resumes another source automatically; pressing native Play resumes its stored position. Radio does not continue playing in a background mini-player across routes.

Per-source position, volume and mute are restored after metadata loads. Identity includes stable content ID and immutable asset URL; a changed source starts with separate progress. Completed or shortened media resets to the beginning. Writes are throttled to three seconds and flushed on pause/end/unmount/pagehide. Malformed values recover, and blocked storage displays a warning. Source switching retains saved progress. Native controls remain available and load failures offer retry.

Timed captions are authored in audio/video, Hotline message, Movie scene and Radio track inspectors. Format: one cue per line, start seconds | end seconds | plain text. Example: 0 | 2.5 | Happy birthday. Cues are bounded and validated in JavaScript and PostgreSQL. Video uses native caption tracks; audio shows synchronized text. All cues are also available as a readable transcript. Cue text is never injected as HTML. Existing item body transcripts remain visible.

Database migration phase9_captions applied to the dedicated project, version 20261001153251. It extends document validation without changing media delivery permissions or publication rules. The new private pure-validation helper is callable by authenticated roles as required by the existing invoker save contract; it reads no data.

Validation: 111 automated tests pass (103 existing + six coordinator/state/caption checks + two SQL save/publish/rejection checks). Both applications pass TypeScript and production builds. CI now runs the complete suite and responds to the production branch as well as main/PRs. This does not create a deployment approval gate.

Release: pushed to the connected production branch. Deployment result is verified separately in the conversation. Real upload/playback, native caption rendering, iOS/Android media behavior and full authenticated interactive editor QA remain pending. Supabase Storage is still unprovisioned and no personal media was supplied. Unit tests and builds are not a claim of real-media certification.

Sources: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime and https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement .
