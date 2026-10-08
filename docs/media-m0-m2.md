# Media library M0–M2

## M0 — Reliability

- Verification inspects bounded prefixes in parallel, with timeouts and idempotent finalization.
- Preparation, session checks, library queries, recovery, and UI actions have deadlines with retry messages.
- Upload queue checks image, video and audio Storage buckets. Stop aborts the active transfer; Resume reuses the reservation and completed objects in the current queue.
- Leaving an active upload warns before page unload. Queue files are held in memory; refresh does not restore an unfinished local transfer. Files already stored can be recovered through Finish verification.
- A cancellation during a server action may still leave a saved file. Recovery and retries preserve that file.

## M1 — File management

Rename, original download, up to 100 selected loaded files, bulk archive/restore with partial-failure results, matching totals, and per-site saved search/type/archive/sort/view preferences. Original storage paths and published references remain immutable.

## M2 — Previews

- New verified videos get a silent, bounded frame capture saved as a private WebP sidecar. If capture fails, the video remains usable and the queue explains how to generate its thumbnail from file details.
- Existing verified videos can generate their stored thumbnail without replacing the original.
- Thumbnail lists load visible images/posters, with bounded loading and a Retry thumbnails control. They do not download each video for a first frame.
- Full-screen native-dialog viewer supports Previous/Next, arrow keys outside media controls, Escape/Close, and loading additional result pages. Only ready files are navigable.
- Image, video and audio previews have timeouts and Retry preview. Opening the viewer unmounts the detail player; changing/closing the preview releases the old media source. Playback always requires user interaction.
- Posters are signed through the authenticated media route. Writer/site checks, content signature/size validation and exact-path insert policies protect poster creation. Posters are not anonymously delivered.

## Verification limits

Automated coverage includes stop/resume, timeouts, all-bucket checks, poster generation cleanup, signed delivery guards, writer permissions, exact path constraints, private access, and the M1 regression suite. The admin production build and full regression suite are release gates.

Production database checks confirm all three private buckets, the poster column and the invoker policy. Two existing pending image records have stored originals. Their authenticated recovery and real image/video/audio upload/playback need a working signed-in browser runtime; this session's runtime reports it cannot safely resume credential state. No live recovery or upload success is claimed for those checks.
