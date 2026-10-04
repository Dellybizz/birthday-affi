# E0 — editor inventory and preservation baseline

Source baseline: production branch `codex/phase2-database-auth`, head `ad17ecf4e187e3d246941bfeb813de7e323d348e`. Audited 2 October 2026.

Status: source/control inventory and read-only production baseline completed. Authenticated visual baseline remains blocked by the production sign-in screen. E0 does not certify signed-in usability; that gate must be recorded separately before final E6 acceptance. No production records were changed.

## Inventory

Run `node scripts/editor-e0-inventory.mjs OUTPUT_DIRECTORY`. The tool generates CSV and JSON without reading credentials or writing to the database. It lists every displayed content/design field per default-layout node, its section identity, route, renderer, storage path, evidence files, review status and target phase.

11 active route definitions; 4,893 field-instance rows: 2,967 source-reference candidates, 972 missing generic design bindings in specialized renderers, 315 unrelated archive/journey controls, 636 runtime-review rows and 3 missing dedicated app editor adapters. These are repeated field instances, not counts of unique defects. A source-reference candidate is not proof that a setting works: incidental references and inherited/dynamic behavior require manual and runtime verification.

The read-only saved-data inventory separately covers 13 pages and 206 nodes. Hashes, revisions, node relationships, property names and published pointers are retained privately, without copying private text/media into this repository. It is an integrity baseline, not a restorable database backup.

## Route and renderer coverage

| Page | Public route | Renderer | Main coverage decision |
| --- | --- | --- | --- |
| Memories Archive | `/` | CMSRenderer + ArchiveFrame + ArchiveJourney | General layout/content controls; journey fields relevant only at archive root. |
| In My Heart | `/pages/in-my-heart` | HeartPage + bridge/engine | Extensive mapped controls; targeted-media and selection/geometry runtime acceptance required. |
| iPhone Home | `/home` | PhoneHome | Phone-part fields work through custom mapping; generic styles only partly mapped; read-time upgrade must preserve IDs/content. |
| Adore | `/app/reasons` | AdoreJournal | Reason text/media and letter selection present; generic design controls and some labels unsupported. |
| Hotdial | `/app/hotline` | LayoutSection + LiveHotline | CMS sections plus runtime call behavior; preview needs explicit simulation and isolation. |
| Pardanasheen | `/app/adventure` | PhotoLibrary | Photo/video metadata and selection present; generic style controls missing; selected media should be revealed. |
| Saragram | `/app/movie` | Saragram | Post/reel/profile properties present; dedicated actions and secondary-media pickers missing; styles mostly fixed. |
| Kiss Shop | `/app/kiss-shop` | KissShop | Gift content present; several section-label/design settings do not control custom chrome. |
| Clicksara | `/app/camera` | CameraApp | Direct runtime route; CMS adapter missing. Camera permission is runtime, not authored content. |
| Vault | `/app/vault` | VaultClient | Direct runtime route; authoring adapter missing. Secret answers/story delivery must remain server-controlled. |
| Pieces of Us | `/app/pieces` | PuzzleApp | Direct runtime route; level/content/UI adapter missing. Visitor puzzle progress stays separate. |

Legacy/saved-only coverage: Welcome is no longer the first-page source; Radio is not an active public app; Birthday Letter, Final Reveal and Photo Story are unpublished custom drafts. Preserve all these drafts. Do not expose retired apps in the primary page chooser as active experiences. Custom drafts need a clear unpublished status.

## Production integrity findings

Only Archive and Heart currently have published page snapshots; both match their draft hashes. Other built-in routes use code fallback layouts when no published document exists. Saved draft names/layouts can therefore disagree with current live apps. Global configuration and navigation are revision 0 with no published pointers; public defaults apply. E1 must show publication status truthfully and preview the saved draft rather than silently publishing/resetting it.

## Capability contract for E2–E5

Each visible field must define page/section/block applicability, storage path, validated type/default/limits, renderer binding, responsive support, media target, dependency conditions and reset policy. Unsupported fields stay out of the inspector until implemented. Distinguish content, appearance, behavior, page metadata and global settings.

Media fields must identify `src`, `poster`, `avatar`, `voiceSrc` or other target explicitly. A picker must never overwrite the primary media when selecting a cover/avatar. Separate editor-session state from Inspect mode and visitor persistence. Sidebar selection must reveal the selected item and pause disruptive motion/media. Preview internal navigation must flush pending input/autosave, remain in admin and retain drafts after failure.

Migration rules: preserve IDs, hierarchy/order, visibility, media references, page revisions, published pointers, configuration/navigation versions and runtime visitor data. Preserve legacy internal slugs while displaying current app names. Never publish fallbacks, replace existing documents, or change secret/runtime data as an editor migration side effect.

## Baseline verification

Initial all-file run: 184 tests, 181 passed, 1 failed, 2 skipped. The failure was an outdated assertion that the sample catalog had six keys: Camera and Vault intentionally added empty runtime entries. Corrected the test to verify the eight expected keys, empty runtime entries, unique IDs and absence of fake media. The two live Vault tests require authorized live-test configuration and remain skipped; no secret data was requested.

Production browser attempt: `/editor/movie` redirected to `/login`; no authenticated desktop/mobile editor screenshots or signed-in actions were claimed. Source review still establishes toolbar/sidebar definitions. Capture real authenticated baselines before E6 certification.

## Next implementation

E1: pass site/current-page/page-list metadata into Editor; add grouped searchable page selector, independent live/draft links, save-before-switch and draft preservation. Keep runtime-only routes explicitly marked until E5 adapters exist. E2 consumes the capability contract above; E3 handles navigation/Inspect semantics; E4 implements Saragram; E5 closes per-app bindings; E6 proves live parity.
