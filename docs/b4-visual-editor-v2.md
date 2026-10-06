# B4 — Visual Editor V2

The page editor keeps a single header with page selection, publication and draft state, edit/interactive toggle, viewport selection, undo/redo, saved draft preview, View site, Save draft and Publish page. Logical viewport presets and custom dimensions share one controlled model; the canvas scales the whole viewport rather than changing its breakpoint.

The layer tree supports selection, expansion, search, visibility, sibling drag reordering and Alt + Up/Down keyboard reordering. Selected descendants reveal their ancestors. Element actions provide move, duplicate, removal with a review prompt and undo, and reusable-section export/copy. Copied sections persist in this private browser tab and can be pasted as independent copies. New sections can start from an existing section, a generic template or supported home items. Existing singleton validation continues to reject invalid duplicates.

The inspector has Content, Appearance, Layout, Spacing, Responsive, Behavior, Animation and Advanced workspaces. Search finds supported settings across workspaces. Fields and semantic groups can be reset to their component default or inherited value. Responsive overrides use explicit Default/Mobile/Tablet/Desktop scopes; choosing a device scope updates the preview viewport. Unsupported controls stay hidden.

Preview rendering follows site draft settings → shared OS/page shell → the real page renderer → saved section/block hierarchy. The configured phone shell replaces the former nested synthetic shell. The shared notification shade supports selection and does not write visitor storage. Home edits propagate into the persistent iframe's notification context when changing pages. A ready handshake restores the latest document and selection after iframe reload.

Adore, Pardanasheen and Saragram now read hierarchy order, so moving their blocks changes actual rendering. Duplicate/import operations remap internal scene/station references. Version comparisons show old/new setting values, and existing restore-to-draft and live rollback semantics remain distinct.

No schema migration or automatic content publication is needed. Existing documents, revision checks, role permissions and publication endpoints are retained. Runtime-only app adapters, additional app-specific settings, media/audio workflows and release-manager expansion remain later phases.

Validation includes operation and undo tests, copy/reference isolation, responsive reset inheritance, before/after comparisons, viewport boundaries, server-rendered workspaces, single-shell preview geometry and real app ordering. Authenticated browser interaction is not certified by these server-rendered and operation tests.
