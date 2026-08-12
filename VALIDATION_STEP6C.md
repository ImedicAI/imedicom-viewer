# Validation 6 — Step 3: large matrix and viewer-source dependency map

Status: COMPLETE (analysis / no source removal yet)

## Large-matrix execution
- Workflow: `.github/workflows/large-matrix-performance.yml`
- Run: `31650214478`
- Result: SUCCESS.
- Controlled fixture: 2660 x 2180, CR, MONOCHROME1, 16-bit allocated / 12-bit stored, Explicit VR Little Endian, ~11.6 MB, ImagerPixelSpacing 0.160003\\0.160114.
- Verified in Chromium headless: parser -> pixel extraction -> first full-resolution render -> cached render -> WW/WL-triggered rerender completes without crash.
- The attempted granular `performance.now()` timings are NOT valid under Chromium `--virtual-time-budget` for synchronous CPU work (reported 0 ms). They must not be used as performance claims.
- Browser command wall time was ~9.6 s but includes startup/network/virtual-time shutdown and is not a render benchmark.

## Current viewer-source.html dependency
`viewer-loader.js` still fetches `viewer-source.html`, copies its styles and markup, then executes its inline scripts after replacing selected legacy blocks with modular bridges.

Already modularized:
- DICOM parser
- metadata / pixel extraction
- render / MONOCHROME / geometry transforms
- export encoding helpers
- fullscreen runtime
- access validation UI/runtime
- DICOM loading
- viewport zoom/pan/WW-WL interaction
- annotation geometry / hit testing
- measurement math / undo helper
- premium DOM adjustments

Still primarily orchestrated by viewer-source.html and must be extracted before removal:
1. canonical viewer markup and base CSS currently harvested from source;
2. shared viewer state, active-file selection and file-list rendering;
3. draw coordinator, aspect/layout synchronization and metadata panel editing;
4. annotation creation/edit/move/delete event runtime (current module only owns geometry/hit tests);
5. marker/transform/preset/view controls and flyout bindings;
6. folder picker, File System Access handle management, export progress/busy UI and batch orchestration;
7. remaining UI toggle bindings and legacy glue variables consumed by modular bridges.

## Decision
Do NOT delete `viewer-source.html` yet. The safe path is to extract the remaining orchestration in functional slices, run the existing runtime/UI/tools/export/regression/session validations after each slice, and only then replace the loader with direct static markup/module initialization.

No real clinical DICOM or PHI was committed to GitHub.
