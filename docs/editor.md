# Visual Editor Contract

## Hierarchy
Page → Section → Block → Field

Global layers:
Site Settings → Theme → Navigation → Global Components

## Component definition
Each component declares:
- type
- label
- category
- allowed parents
- default data
- default settings
- schema version

## Editor actions
Canvas: select, hover outline, inline edit where supported, drag/reorder where valid.
Navigator: expand/collapse, select, reorder, duplicate, hide/show, rename, delete.
Inspector: contextual settings, responsive overrides, reset-to-default.

## Persistence
- dirty state
- explicit save
- optional debounced autosave
- immutable version on publish

## Publish validation
1. schema validation
2. required asset check
3. broken reference check
4. accessibility warnings
5. route uniqueness
6. media readiness
7. immutable version creation
8. atomic published pointer update
