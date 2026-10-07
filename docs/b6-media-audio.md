# B6 — Media and Audio

## Implemented

- Drag/drop and multiple-file upload queue, byte progress, bounded timeouts and retries retaining the original reservation and completed objects. Objects are never overwritten. Retry state lasts while the tab remains open.
- Images (8 MiB), video (50 MiB), audio (25 MiB), original verification and WebP image sizes. Image thumbnails and video previews use authenticated delivery.
- Filename/type/alt/caption/transcript search with server pagination; alternative text, captions and transcripts; archive/restore; draft/version/release and soundtrack usage counts.
- Deletion is deliberately disabled for all media, preserving published releases and rollback history. Archiving does not remove published delivery.
- Media picker supports compatible primary and secondary fields; primary audio/video selection copies captions and transcript. SQL validates app-specific media kinds and rejects missing, pending and cross-site references.
- Dedicated Audio workspace: ordered playlist, default track, volume, muted default, playlist loop and background rules. Uses canonical revisioned site configuration, owner-only saving/publication and existing release rollback.
- Persistent birthday soundtrack starts only after Play. A shared PlaybackCoordinator pauses previous audio when another source starts. Entering Movie, Radio or Hotline pauses the current source; answering a live call claims audio. Hidden tabs pause playback. Interruption never resumes automatically. Track completion advances an already-started playlist.
- Transcripts remain readable when media playback fails.

## Provider dependency

The production Supabase project `brdkbxlqendywbkdiuvr` does not have provider-managed `storage.buckets` / `storage.objects`. The Storage API returns `TenantNotFound` (missing tenant configuration). Application SQL does not synthesize provider tables.

Activate/repair Storage through Supabase's project management interface or its authenticated Management API. Once the provider has created both Storage tables, run the existing privileged `select public.configure_media_storage();` setup. This creates private MIME/size-limited buckets and admin/published-only read and pending-only insert policies; it grants no object DELETE policy.

End-to-end acceptance is pending until an authenticated owner uploads a file, selects it in a compatible field, publishes, verifies public `/media/<id>` delivery, and checks audio interruption in a browser. Automated tests use a mocked provider schema and do not establish live Storage readiness.

## Verification

283 automated tests passed; two existing private-answer fixtures skipped. TypeScript and both production builds passed. Anonymous admin smoke checks passed. The B6 migration was applied and verified in the existing Supabase project; the usage RPC is not anonymous and authenticated media deletion remains revoked. Advisors show existing unrelated findings, with no new B6 finding.

## Upload error follow-up

Expected reservation and finalization failures now return safe structured results so production does not replace them with Next.js's generic Server Components error. The library checks Storage before enabling file selection and drag/drop, shows the activation requirement, and rechecks with Refresh. Unknown production errors use a safe retry message. The missing-Storage regression verifies no reservation is written and no provider diagnostics are exposed.
