# UNIVERSAL GRID / GUIDES — V1

## Status
PROPOSED + PLAYGROUND — universal spatial reference system for Composer.

## Principle
The Composer should not have a separate grid for print, web, embroidery, video or illustration. It has one spatial reference engine, configured by a format profile.

`PROJECT → FORMAT PROFILE → GRID ENGINE → GUIDES / SNAP / MARKS → COMPOSITION`

The grid is a measurement and alignment system, not a visual design layer. Guides never publish by default.

## 1. Universal coordinate model

```text
Workspace
  coordinate_system
  origin
  unit
  width
  height
  grid_step
  subdivisions
  snap
  guides[]
  safe_areas[]
  bleed
  trim
  marks[]
```

Supported units: `PX | PT | MM | CM | IN | M | SEC | FRAME | CUSTOM`.

The origin can be moved. The default origin is the format's top-left corner. A project may choose a center-origin mode, including a visible red `0,0` crosshair inspired by pattern/embroidery workflows.

## 2. Magnetic grid

The grid has independent controls:

- visible / hidden;
- major step;
- subdivisions;
- line or dot style;
- opacity;
- snap on/off;
- snap tolerance;
- snap to major grid;
- snap to subdivision;
- snap to guides;
- snap to center / edges / corners;
- smart alignment.

The grid never changes the canonical geometry. It only constrains placement while editing.

## 3. Guides

Guides are first-class universal objects:

`Guide = axis + position + scope + lock + color + label + type`

Types:

- ruler guide;
- center guide;
- margin guide;
- safe-area guide;
- trim guide;
- bleed boundary;
- column / row guide;
- baseline guide;
- custom guide.

Guides can be created from rulers, dragged, positioned numerically, duplicated, locked, hidden and cleared. Smart guides can expose object edges, centers and spacing while moving elements.

This follows the useful interaction model already established by Illustrator: rulers, custom guides, snapping and smart guides are separate but interoperable systems. The AIME version generalizes them across project types.

## 4. Format profiles

A format profile defines the spatial contract instead of creating a new editor.

Examples:

### PRINT_A4
- 210 × 297 mm
- configurable margins
- configurable bleed
- trim boundary
- safe content area
- optional crop / registration / color marks

### PRINT_A5 / FLYER / BUSINESS_CARD / POSTER
Same engine, different dimensions and production presets.

### WEB_DESKTOP / WEB_MOBILE
- CSS/pixel dimensions
- responsive guides
- safe content area
- columns / max-width / spacing grid

### SOCIAL_9_16 / SOCIAL_1_1 / VIDEO_16_9
- pixel dimensions
- safe area
- center / thirds / title-safe guides

### EMBROIDERY_PATTERN
- cell-based grid
- center-origin option
- stitch/cell step
- color-coded DMC palette reference
- pattern coordinates

Important: the embroidery inspiration is used for the **reference grid and color coding**, not to turn the Composer into embroidery software.

## 5. DMC-inspired color coding

The system may attach a color reference to spatial elements and assets. A color can have:

`color_id + display_color + reference_system + label`

DMC codes are a supported reference vocabulary for embroidery-oriented projects, but the grid engine itself remains color-system agnostic. Other projects can use RGB, HEX, CMYK, Pantone-like references or project-defined tokens.

## 6. Print automation

When a print format is selected, the engine can automatically create:

`FORMAT → TRIM → BLEED → SAFE AREA → MARGINS → OPTIONAL PRINT MARKS`

The user should not need to draw these manually.

Bleed is an extension outside the trim/crop boundary; trim defines the final cut size; safe area protects content from being too close to the cut edge. Printer marks remain optional and outside the artwork boundary.

## 7. Smart snapping

Snapping priority can be contextual:

1. locked guides / format boundaries;
2. center / edge / corner;
3. explicit guides;
4. grid;
5. other objects;
6. subdivisions.

A temporary smart-guide overlay explains why an object snapped: `CENTER`, `EDGE`, `12 MM`, `8 COL`, etc.

## 8. Composer integration

The spatial engine sits beside the Universal Timeline:

`CANVAS = spatial reference`
`TIMELINE = temporal reference`
`INSPECTOR = object/reference properties`

A selected object therefore has both spatial and temporal coordinates when applicable.

`OBJECT → x/y/width/height → start/duration → media/content → version`

The same object can be aligned on the canvas and positioned on the Timeline without creating duplicate records.

## 9. Format presets are profiles, not applications

Do not create:

- Print Editor;
- Web Grid Editor;
- Embroidery Grid Editor;
- Video Safe Area Editor.

Create one `Universal Grid Engine` with format profiles and capabilities.

## 10. Proposed data contract

```text
FormatProfile
  id
  name
  width
  height
  unit
  orientation
  origin
  grid
  margins
  safe_area
  trim
  bleed
  columns
  rows
  marks
  color_reference

Guide
  id
  axis
  position
  unit
  scope
  type
  locked
  visible
  label
  color

SnapSettings
  enabled
  tolerance
  targets[]
  priority[]
```

## 11. UX target

A single compact control can expose:

`FORMAT · GRID · GUIDES · SNAP · MARKS`

Choosing `A4` immediately establishes the page geometry. Choosing `9:16` establishes the video geometry. Choosing `Embroidery Pattern` establishes a cell grid and optional center origin. The Composer stays the same.

## 12. Source-of-truth rule

The grid is metadata and editing assistance. It must never duplicate the project's canonical content, media or composition entities.

Format changes should reproject the workspace, with explicit overflow/crop warnings where necessary, rather than silently destroying content.
