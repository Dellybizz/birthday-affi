# E3 — Shopify-style editor shell and preview inspector

Status: implemented on `codex/phase2-database-auth` after E2. This phase changes editor interaction and layout only. It does not publish pages, rewrite saved documents, change visitor progress, or activate runtime-only apps.

## Shopify reference used

E3 intentionally follows Shopify's current theme-editor model instead of inventing a separate admin UX:

- Theme editor layout/features: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/features-overview
- Preview inspector: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/preview-inspector
- Sections and blocks: https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor/customizing-sections
- Templates/page selector: https://help.shopify.com/en/manual/online-store/themes/theme-structure/templates
- Developer preview-inspector guidance: https://shopify.dev/docs/storefronts/themes/best-practices/editor/preview-inspector

The resulting structure is: top menu bar -> centered page selector -> left editor mode/sidebar -> center live preview -> contextual right settings panel. On narrow screens, Sections / Preview / Settings become a stacked single-sidebar flow.

## E3 behavior

### Top menu bar

- Sections and Theme settings are separate editor modes.
- The E1 page selector stays centered in the top bar.
- Preview Inspector is a first-class toggle.
- Mobile/desktop preview controls, undo/redo, draft preview, View site, Save and Publish remain in the editor shell.

### Sections sidebar

- Shows the page section/block tree, visibility controls and search.
- Selection in the tree reveals the same item in the preview and opens contextual settings.
- Add section, template insertion and reusable-section import remain available.

### Contextual settings

- The four-tab inspector is removed from the main editing flow.
- The selected section/block gets one Shopify-style settings panel on the right.
- Content, Appearance and Behavior are grouped inside that selected-item panel.
- Move, duplicate, show/hide, export and remove actions stay tied to the selected item.
- Theme/page/global controls live under Theme settings rather than competing with section settings.

### Preview inspector

When the preview inspector is ON:

- Clicking a selectable element selects its section/block instead of navigating.
- The selected item is scrolled into view in the preview and tree.
- Audio/video are paused and CSS animations are paused while inspecting, reducing disruptive motion.
- Visitor persistence remains disabled in the admin preview.

When the preview inspector is OFF:

- App interactions work as preview interactions.
- Internal route clicks are intercepted by the admin shell and mapped to the matching editor page.
- The current draft is flushed before switching editor pages.
- Save conflict/failure blocks the navigation.
- Runtime-only destinations without an E5 authoring adapter are blocked with a truthful message instead of leaving the editor.
- External destinations open separately so the admin editor remains mounted.
- Heart iframe journey events use the same admin-safe routing path.

## Preservation boundaries

E3 does not change page IDs, node IDs, hierarchy, order, visibility defaults, media references, draft revisions, published pointers, global configuration revisions, navigation versions, or public visitor state. It does not publish fallbacks or create editor adapters for Clicksara, Vault or Pieces of Us; those remain E5 work.

## Verification

`pnpm test:e3` covers internal preview-to-editor routing, same-page behavior, runtime blocking, external navigation isolation, Shopify-shell source structure, selected-item reveal and paused media/motion. The root test command includes E3 before later phase suites.
