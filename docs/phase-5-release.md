# Phase 5 — Release Readiness

## Implemented
- Vercel build/install configuration.
- GitHub Actions quality gate for install, typecheck and build.
- Web and admin health endpoints.
- Environment-variable contract in `.env.example`.

## Production activation
Set Supabase URL/anon key, server-only service-role key and a strong PREVIEW_TOKEN_SECRET through the hosting secret store. Apply migrations, configure Storage policies, create the owner account, configure web/admin Vercel projects, and run real-browser smoke tests for authentication, editor save, preview, publish, rollback, media upload and all six apps.

## Security
Never expose the service-role key or preview secret to client bundles. Never commit production environment files or private user media.

Phase 5 source/deployment configuration is complete. External credentials and live-browser verification require the deployment environment and are therefore not represented as completed by source control alone.
