# Wiffeyyyy OS — Design Foundation

## Experience

The public interface should feel like a soft, personal phone rather than a generic website.

Visual direction:
- soft cream/blush base
- one primary accent
- rounded cards and icons
- high readability
- restrained motion
- generous spacing
- no visual clutter

## Home

Top:
- nickname / birthday greeting
- small date widget

Body:
- 2-column app grid on phone-sized layouts
- larger but still compact grid on larger screens

Apps:
- Reasons I'm Obsessed
- Birthday Hotline
- Our Next Adventure
- Our Birthday Movie
- The Kiss Shop
- Birthday Radio

The Hotline receives a subtle Start Here indicator.

## Navigation

Each app:
- full-screen app shell
- persistent back control
- app title
- consistent spacing
- predictable button treatment

Home state is preserved when navigating away.

## Accessibility

- large touch targets
- readable body copy
- visible focus
- keyboard navigation
- reduced motion mode
- captions/text alternatives
- audio never required to understand core content

## Editor design

Three-region desktop model:

Left:
- site/page tree
- navigator
- add section
- layers

Center:
- live responsive canvas

Right:
- contextual inspector

Top:
- save status
- undo
- redo
- device viewport
- preview
- publish

On narrow admin screens, the inspector becomes a drawer.

## Inspector

Section:
- visibility
- background
- layout
- spacing
- borders/radius/shadow
- responsive overrides
- animation

Block:
- content
- media
- typography
- alignment
- appearance
- interaction
- accessibility

Media:
- upload
- replace
- crop
- aspect ratio
- object fit
- object position
- alt text
- focal point
- loading strategy

## Interaction principle

Clicking an element on the canvas selects the corresponding node in the hierarchy.

Dragging a node in the hierarchy updates order.

Changes are local editor state until saved.

Publish is distinct from save.

## Motion

Motion should reinforce hierarchy and navigation:
- quick card transitions
- subtle app opening
- restrained feedback
- no essential information hidden behind animation

Reduced-motion removes nonessential transitions.
