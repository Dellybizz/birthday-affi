# Phase 12 — Production operations, Part A

Started 2026-10-01. This is operational preparation, not a completed launch certification.

## Current environment

- Public: https://wiffeyyyy-os.vercel.app/home
- Admin: https://wiffeyyyy-panel.vercel.app/login
- GitHub: Dellybizz/birthday-affi; deployed branch codex/phase2-database-auth.
- Supabase: brdkbxlqendywbkdiuvr, Mumbai (ap-south-1), ACTIVE_HEALTHY.
- Live database inspection: 8 pages; 0 published pages; 0 media assets. storage.buckets and storage.objects are absent.
- Existing Vercel domains provide shareable URLs. No custom domain was supplied for this project.

## Added in Part A

Health endpoints now explicitly disable caching and expose the short deployment revision where Vercel supplies it. These are application liveness checks, not database/storage readiness checks.

scripts/production-check.mjs checks both health endpoints, public home, admin sign-in and anonymous editor denial with a no-store redirect. It uses bounded requests, evaluates both services independently and exits nonzero on failure. It does not submit credentials or change content.

.github/workflows/production-check.yml provides deployment-status and manual checks. GitHub event/default-branch availability must be confirmed before calling it active monitoring; the workflow currently lives on the development/deployed branch. Once integrated into the default branch, run it manually and confirm a successful deployment event invokes it. This is deployment smoke monitoring, not continuous uptime monitoring or an external alert service.

Run: node scripts/production-check.mjs

Local live requests timed out under the execution environment's network restrictions. The Vercel connector separately denied project/team access. Neither result proves a production outage. Live smoke execution and runtime-error scans are pending.

## Recovery and backup runbook

1. Record deployed revisions for both applications and the last known good page versions before a release.
2. For an application regression, revert the specific source change through GitHub and allow the normal Vercel build. Confirm both deployment statuses and run the production checks. A source revert does not undo database migrations.
3. For accidental content publication, use the existing page-version rollback, then verify anonymous output and private draft isolation.
4. Before database migration or content import, take a database export or confirm a provider backup exists. Record its timestamp, retention and restore procedure privately.
5. Supabase database backups do not include media bytes. Back up media objects separately with an inventory mapping bucket/path to asset ID, size and checksum.
6. Restore to an isolated environment first; verify roles/RLS, page-version relationships, counts, media links and owner sign-in. Do not test destructive restoration on the live project.
7. Set target recovery point and recovery time after the first measured restore drill. No backup job or completed restore drill is claimed by this release.

Backup configuration cannot be confirmed with the exposed connector operations. A production backup is still required; no database exports containing private content should be committed to this public repository.

## Storage lifecycle

Storage provisioning is required before calling public.configure_media_storage with a privileged database connection. Do not manually fabricate provider tables.

Keep soft archive/restore as the current deletion behavior. For later physical cleanup:
- retain assets referenced by any draft, saved version, published version or preview; saved revisions need media for rollback;
- mark incomplete uploads for review after 24 hours;
- permit permanent removal only after an agreed retention period, reference recheck and verified media backup;
- use the Storage API to remove bytes, then reconcile metadata; retain a retryable cleanup record;
- produce an owner-reviewed dry-run inventory before enabling a destructive cleanup job.

No physical deletion or retention job has been enabled. There are currently no media assets to clean up.

## Final content import

Use the admin's normal validated draft/save/preview/publish path. Collect the recipient's preferred name/nickname/birthdate, greeting, six-app text, photos, recordings, birthday movie and radio tracks. Confirm captions/transcripts and media permissions. Upload and inspect media after storage activation; review drafts privately before publishing.

No final personal content was provided or fabricated. The live public experience remains sample content until actual documents are published.

## Remaining launch gates

- Restore Vercel connector access to these projects/team for runtime-log inspection.
- Activate Supabase Storage and verify upload, delivery, draft denial and backup of media bytes.
- Configure and verify database backups plus an isolated restore drill.
- Verify production-check workflow execution and establish ongoing uptime alerts if needed.
- Supply final personal content and publish reviewed drafts.
- Complete Phase 10 remaining features and Phase 11 acceptance checks.
- Optional custom domain: supply a domain owned for this birthday project, then configure DNS/TLS.

## References

- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/storage/production/scaling
- https://vercel.com/docs/logs/runtime
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
