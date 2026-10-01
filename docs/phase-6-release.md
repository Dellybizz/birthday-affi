# Phase 6 — Media system

## Implemented

- `/media` admin library with filename search, image/video/audio filters, file details, alternative text, previews and reversible archive/restore. The newest 200 entries are listed; incomplete uploads are visible in the library and excluded from the picker.
- Authenticated browser-to-Storage uploads avoid sending large files through Vercel Server Actions. Originals receive unique immutable paths. File sizes and MIME allowlists are checked before reservation; finalization checks actual object size and binary file signatures before marking an asset ready.
- Image dimensions and audio/video duration are recorded. Raster images generate 480/960/1600px WebP sizes at 82% quality where smaller than the original. GIFs retain their original animation. Oversized decoded images are rejected.
- Editor picker for image, video and audio blocks. Asset references, natural image dimensions and variant sizes are saved in the versioned document. Changing an external URL clears the previous asset reference.
- Cover/contain, focal X/Y and display-height controls. Image rendering uses lazy loading, asynchronous decoding, intrinsic dimensions, responsive `srcset` and `sizes`. Native audio/video controls do not autoplay; global playback coordination remains Phase 9.
- Private buckets and upload RLS setup, publication-only anonymous delivery and short-lived signed object URLs. Published snapshots retain media after archiving. Drafts, pending files and retired publications do not qualify for anonymous delivery. A previously issued object URL can remain valid for its 60-second lifetime.
- Immutable media identity/verified technical metadata, document-to-asset/site/type checks, audited metadata changes, and owner/editor/viewer/session restrictions.

## Applied and verified

Migrations `20261001073828_phase6_media_system.sql` and `20261001075514_phase6_media_delivery_hardening.sql` are applied to the dedicated Wiffeyyyy OS project. Privileged media lookup helpers live in the private schema; exposed RPC wrappers use security invoker. A rollback-only hosted transaction verified draft isolation, publication lookup, unknown-variant rejection, archive/restore and withdrawal. Eight real draft pages, zero published versions and zero real media assets remain.

81 automated tests pass, including the existing 68 and 13 media/renderer checks. Both apps pass TypeScript and production builds. Storage policy tests use a local database fixture; they are not proof of live object uploads.

The security advisor has no new Phase 6 findings. Existing warnings remain the intentionally public published-document lookup and disabled leaked-password protection. References: [public RPC advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Live blocker and activation

The project reports ACTIVE_HEALTHY for its database, but Storage returns HTTP 400 `TenantNotFound: Missing tenant config for tenant brdkbxlqendywbkdiuvr`. The provider-managed `storage` schema exists without its buckets/objects tables. The Storage dashboard requires a separate Supabase browser sign-in, which was declined. No provider tables were fabricated and no upload success is claimed.

Once Supabase provisions Storage, run `select public.configure_media_storage();` through the privileged SQL connection. This creates three private buckets, applies MIME/size limits and installs scoped Storage read/insert policies. The setup RPC is revoked from anonymous and authenticated app users. No object overwrite/delete policies are granted. The video limit is 50 MB to fit the free-plan global cap; images allow 8 MB and audio 25 MB.

Then verify a real raster upload and its responsive variants, video/audio metadata and playback, editor pick/save/preview/publish, anonymous published delivery, draft denial, archive/restore and rollback. Live upload/playback verification and authenticated interactive picker QA remain pending. Failed partial uploads are retained as incomplete entries for archive; physical object lifecycle cleanup is Phase 12.

Sources: [private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [upload restrictions](https://supabase.com/docs/guides/storage/uploads/file-limits), [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control).

## Production release

Both Next.js apps are deployed from uploaded source matching GitHub commit `db65af59a1fc5d96991f87a85b3329e6e76886a9` (tree `b629d124ae98cb56c7a263775a0eb94e236bc7c7`).

| App | URL | Deployment | Result | Build duration |
| --- | --- | --- | --- | --- |
| Admin | https://wiffeyyyy-panel.vercel.app/login | `dpl_7eoFNHvLmvfooKjhdNkFELgh2Fhh` | READY | 63 seconds |
| Public | https://wiffeyyyy-os.vercel.app/ | `dpl_Egbj5Fs5KMDadEyMxq5pak5QHMmc` | READY | 70 seconds |

The source upload initially ignored the saved monorepo root; redeploying that same source with current project settings produced successful builds. Browser checks confirm the public homepage opens without login and the admin entry shows the username login form. Authenticated HTTP checks confirm owner login, editor/version toolbar, private saved-draft preview, and the new `/media` library/upload controls with 50 MB video limits. Sign-out and anonymous denial of the media library, admin object route and private preview also pass. Both health endpoints return HTTP 200, and an unknown public media asset returns HTTP 404. No birthday content was edited by these checks. Live upload and interactive picker verification remain blocked as described above.
