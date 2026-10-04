# Live activation — October 1, 2026

Dedicated Supabase project: `brdkbxlqendywbkdiuvr` (`wiffeyyyy-os`), Web Portal organization, Mumbai region. The earlier birthday database was not modified.

All three repository migrations are applied. Eight empty draft pages and site settings are seeded. Public delivery is enabled by owner instruction; only published documents are exposed by the RPC. Anonymous raw table access is denied and unpublished pages return null.

The admin form uses usernames, mapped server-side to a reserved internal Auth identity (`<username>@admin.wiffeyyyy.invalid`). Supabase Auth verifies passwords and maintains sessions; passwords are never committed. Owner username: `afnan`. No email address is required in the login interface. There is no public signup form. The one-time provisioning function has been replaced with an inert HTTP 410 response.

Live Auth API checks passed: owner login, owner draft access to eight pages, refresh, logout, and incorrect-password rejection. The updated admin production build and 11 database policy tests passed.

Supabase advisors report intentional SECURITY DEFINER warnings on the public published-document RPC. Its narrowly scoped query requires the explicit public-delivery flag and active published version. It provides the required anonymous delivery boundary; raw tables remain inaccessible.

Final certification is recorded in `phase-2-acceptance.md`. The live session guard closes post-logout JWT replay. Phase 2 is complete within the stated acceptance limits; content and editor work continues in later phases.
