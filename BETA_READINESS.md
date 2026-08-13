# imeDICOM — Beta readiness

## Current runtime architecture

The production branch candidate no longer fetches the monolithic `viewer-source.html` at runtime.

Runtime now mounts:

- `viewer-shell.html` for the viewer HTML/CSS shell.
- `viewer-legacy-scripts.html` for the remaining legacy orchestration/events.
- Extracted modules for DICOM parsing/data, rendering, tools, export, UI, fullscreen runtime, access, loading, viewport, and annotation hit-testing.

`viewer-source.html` is retained only as an archival/build source for `split-legacy-source.yml`; it is not a runtime dependency. `legacy-viewer.html` remains a manual recovery fallback.

## Automated validation status

The split-shell runtime has passed the complete validation suite covering runtime, UI controls, tools, export, regression, session/folder/fullscreen and large-matrix stability.

No clinical DICOM or PHI is stored in the repository or CI artifacts.

## Real clinical DICOM validation performed locally

Two real Carestream CR chest PA studies were evaluated locally without being committed to GitHub. They exercised a 2660×2180, MONOCHROME1, 16-bit allocated / 12-bit stored workflow with approximately 5.8 million pixels and Imager Pixel Spacing near 0.160 mm/pixel.

For those studies the 90° rotation + horizontal flip presentation was consistent with Carestream private presentation-transform metadata. Because those files were `FOR PROCESSING`, automatic application of that fallback is now restricted to the validated pattern: chest body part + Carestream manufacturer + `FOR PROCESSING` + portrait pixel matrix.

Two real spine studies were also evaluated locally:

- `DX`, `FOR PRESENTATION`, `BodyPartExamined=TSPINE`, `ViewPosition=AP`, `MONOCHROME2`, `2721×1900`, `PixelSpacing=0.14\0.14 mm`.
- `DX`, `FOR PRESENTATION`, `BodyPartExamined=TSPINE`, `ViewPosition=LATERAL`, `MONOCHROME2`, `2994×1784`, `PixelSpacing=0.14\0.14 mm`.

Both spine studies rendered coherently and support calibrated measurements.

Three real knee/lower-limb DX studies were then evaluated locally:

- bilateral AP presentation, `MONOCHROME2`, `FOR PRESENTATION`, matrix `2013×1915`;
- left lateral presentation, `MONOCHROME2`, `FOR PRESENTATION`, matrix `2209×1196`;
- second left lateral presentation, `MONOCHROME2`, `FOR PRESENTATION`, matrix `2273×1174`.

All three use Explicit VR Little Endian, 16-bit allocated / 12-bit stored pixels and `ImagerPixelSpacing=0.154\0.154 mm`. These studies exposed an unsafe legacy orientation heuristic: portrait non-spine images would previously receive 90° rotation + horizontal flip even when already `FOR PRESENTATION`. The orientation rule was corrected so these knee images remain in their supplied presentation while the previously validated Carestream chest `FOR PROCESSING` case remains supported.

## Validated functional areas

- Explicit VR Little Endian uncompressed DICOM parsing.
- Metadata extraction and controlled error handling.
- MONOCHROME1 and MONOCHROME2 presentation.
- Window Center / Window Width and reset behavior.
- Invert, rotate, horizontal/vertical flip and reset transforms.
- Zoom, pan and direct WL/WW interaction.
- Arrow, length, angle, Cobb and text annotations.
- Annotation movement, deletion, edit/color behavior, undo/redo.
- Pixel-spacing based length calculation when spacing is available.
- PNG, JPG and PDF export.
- Sequential batch export and filename collision protection.
- File System Access folder flow (`showDirectoryPicker` path) and fallback behavior.
- Access lock/session behavior and fullscreen re-entry flow.
- Privacy warning expand/collapse regression.
- Large 2660×2180 12-bit MONOCHROME1 matrix stability in Chromium CI.
- Real radiography coverage now includes chest PA, spine AP/lateral and knee AP/lateral examples from different acquisition/presentation patterns.

## Known limitations / deferred external validation

These do not block an internal controlled beta but prevent any claim of broad diagnostic-grade readiness:

1. A real chest lateral DICOM has not yet been supplied for clinical orientation/presentation validation.
2. Precise rendering latency has not been measured on the intended workstation hardware; Chromium virtual-time measurements are not valid timing benchmarks.
3. Real-device Safari/iPad and Edge validation remains pending; current automated browser validation is Chromium-based.
4. Length currently uses the average of row and column pixel spacing. Strongly anisotropic spacing should be represented separately before claiming generic calibrated measurement accuracy.
5. Encapsulated JPEG/JPEG-LS/JPEG2000/RLE DICOM pixel data is not supported by the current parser/render path and is intentionally rejected.
6. Carestream `FOR PROCESSING` private image-processing parameters are not reproduced as a proprietary vendor algorithm. imeDICOM uses its own standard/automatic presentation path.
7. Some clinical DX studies may contain laterality markers or identifiers burned directly into pixel data. The metadata privacy toggle cannot remove information that is already part of the pixels.
8. Diagnostic-display calibration, DICOM GSDF conformance, formal QA, cybersecurity/regulatory documentation and clinical validation are outside the current internal-beta validation scope.

## Release boundary

This branch is suitable for final internal beta review under controlled radiography workflows that match the validated uncompressed DICOM path. It must not be described as a certified diagnostic workstation or merged/deployed solely on the basis of this document.
