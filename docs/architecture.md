# Wiffeyyyy OS — Architecture

## 1. Goals

The system must support:
- A responsive public experience for mobile, tablet, laptop and desktop.
- A secure admin control plane.
- A Shopify-like visual editor.
- A strict hierarchy: Page → Section → Block → Field.
- Draft, preview, publish and rollback.
- Structured personal content such as birthday, name, nickname, audio, photos and gifts.
- A shared component registry so pages remain data-driven.
- A global media/audio system.
- Strong accessibility and reduced-motion support.

## 2. System topology

Public app
→ Next.js rendering layer
→ content read model
→ Supabase/Postgres + Storage

Admin app
→ editor shell
→ editor state/history
→ validation
→ draft document
→ preview renderer

Publish
→ validate
→ create immutable published version
→ update published pointer
→ invalidate/revalidate public cache

Private preview
→ draft version
→ signed preview token/session
→ preview renderer

## 3. Repository

apps/
  web/
  admin/

packages/
  ui/
  editor/
  editor-schema/
  content/
  media/
  audio/
  database/
  auth/
  validation/
  config/

supabase/
  migrations/
  seed/

docs/

## 4. Content hierarchy

Site
  ├─ Global Settings
  ├─ Navigation
  ├─ Theme
  ├─ Shared Components
  └─ Pages
       └─ Page
            ├─ Page Settings
            └─ Sections
                 └─ Section
                      ├─ Section Settings
                      └─ Blocks
                           └─ Block
                                └─ Fields / Settings

The editor must never assume a particular page contains a fixed number of blocks.

## 5. Editor schema

Each node has:

- id
- type
- label
- parentId
- order
- visibility
- settings
- data bindings
- responsive overrides
- animation configuration
- metadata

A component type is registered once and reused by many pages.

Example conceptual node:

{
  "id": "section_hero_01",
  "type": "hero",
  "settings": {
    "backgroundColor": "token.surface.primary",
    "padding": { "top": 32, "right": 24, "bottom": 32, "left": 24 }
  },
  "blocks": [...]
}

## 6. Setting system

Setting primitives:

Text, textarea, rich text, number, range, toggle, select, color, gradient, image, video, audio, icon, URL, date, time, spacing, padding, margin, border, radius, shadow, opacity, typography, alignment, aspect ratio, object fit, object position, animation, visibility and responsive override.

Settings belong to component schema definitions rather than custom UI code scattered across the project.

## 7. Design tokens

Global tokens should include:

- colors
- typography
- spacing
- radii
- shadows
- breakpoints
- motion durations/easing
- z-index layers

Pages and components consume tokens by default and can opt into local overrides.

## 8. Versioning

Content lifecycle:

draft
→ validating
→ previewable
→ published
→ archived

Every publish creates an immutable version. Published content is referenced by a stable published_version_id.

Undo/redo is editor-state history. Version history is persisted content history. They are separate systems.

## 9. Data domains

Core domains:

- site_settings
- pages
- page_versions
- page_nodes
- media_assets
- media_variants
- audio_assets
- app_content
- gifts
- gift_redemptions
- adventure_options
- movie_projects
- radio_stations
- notifications
- admin_users
- audit_logs
- preview_tokens

Do not put all application data into a single unvalidated JSON blob. Use structured tables for searchable relational data and JSON for flexible component configuration.

## 10. Security

Admin:
- authenticated users
- role/permission checks
- server-side authorization
- audit logs
- service-role key only on trusted server code

Public:
- read published content only
- never expose service-role secrets
- preview access requires a short-lived signed token/session
- media access follows asset visibility rules

Supabase Row Level Security should be the database safety net; application authorization should remain explicit.

## 11. Rendering

Public rendering should consume a normalized published read model.

The visual editor should use the same renderer/component registry as production, with editor overlays layered around it. This minimizes preview/live drift.

## 12. Preview

Preview URL format should be conceptually:

/preview/{pageSlug}?version={versionId}&token={shortLivedToken}

The token should be short-lived and scoped. Preview mode must not make drafts indexable or publicly discoverable.

## 13. Responsive strategy

Prefer fluid CSS/container logic and semantic breakpoints over device-specific code.

Each setting supports:
- base
- mobile override
- tablet override
- desktop override

Avoid creating separate page trees for mobile and desktop.

## 14. Audio architecture

One global AudioController owns playback.

Rules:
- only one major audio source plays at once
- movie/hotline can pause radio
- radio can resume at previous position
- user gesture is required to start audio
- text alternatives exist for spoken content

## 15. Performance

Images use responsive variants and lazy loading where appropriate.
Video uses poster images and controlled preload.
Audio should not autoplay.
Admin editor code should be code-split from public runtime.
Public pages should avoid shipping editor-only packages.

## 16. Observability

At minimum:
- server error logging
- publish audit trail
- editor save failures
- preview token failures
- media processing errors

## 17. Phase 0 acceptance criteria

- Repository structure exists.
- Naming and environment conventions are documented.
- Public/admin apps are separated.
- Shared packages are identified.
- Editor hierarchy is fixed.
- Versioning model is defined.
- Preview model is defined.
- Security boundaries are documented.
- Content domains are identified.
