# Phase 4 — Production Product Layer

## Completed
- Six dedicated CMS builder definitions: Reasons, Hotline, Adventure, Movie, Kiss Shop and Radio.
- Per-app field definitions for text, long text, media, numeric ordering, toggles and app-specific item types.
- Admin role/permission matrix for owner, editor and viewer.
- Editor autosave controller with debounced persistence and explicit save states.
- Signed, expiring preview-token utility.
- Audit event service for site/entity changes.
- Media validation policy with file-size and MIME restrictions for images, video and audio.
- Phase 2 versioned publishing and Phase 3 visual editor remain the publishing/editing core.
- Production-facing documentation boundary established.

## Release checklist
1. Configure Supabase URL/keys and service role in server environment.
2. Configure Storage buckets and upload policies.
3. Configure PREVIEW_TOKEN_SECRET.
4. Create owner/admin identities and assign roles.
5. Run all Supabase migrations.
6. Seed the six app builders and recipient profile.
7. Deploy web/admin to Vercel.
8. Test mobile, tablet and desktop editor flows in a real browser.
9. Test draft → preview → publish → rollback.
10. Verify media upload limits and audit records.

Phase 4 code is complete; these checklist items are environment activation/QA and intentionally cannot be truthfully marked complete from source control alone.
