# imeDICOM workstation premium restoration

This branch restores the denser professional workstation presentation requested for the public viewer while preserving the validated DICOM runtime.

## Visual scope

- Restored top utility area for Diseño, Ayuda and Ajustes.
- Reinforced left study/data column and right tool column proportions.
- Restored denser workstation-style tool presence without removing validated controls.
- Added professional line icon treatment to existing functional tool buttons.
- Added a live study-count status indicator in the left column.
- Added an anonymized stylized thorax watermark asset for the empty viewer state.
- Kept the watermark behind the actual canvas so loaded DICOM pixels remain the visual foreground.
- Preserved the bottom image control area and made it visually consistent with the right tool palette.

## Safety boundaries

- No clinical DICOM file or patient screenshot is included in this branch.
- The thorax watermark is synthetic vector artwork and contains no patient data.
- DICOM parsing, pixel extraction, VOI/windowing, photometric handling, geometry, measurements and export code are not intentionally modified by this visual restoration.
- The branch should not be merged until the existing browser regression workflows pass.
