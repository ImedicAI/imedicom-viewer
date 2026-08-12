# imeDICOM — Validación integral del rediseño

Rama: `redesign/radiology-dark-premium`

## Validación 1 — Arquitectura estática

Estado: COMPLETADA.

Comprobado:

- `index.html` carga los módulos en un orden coherente: parser, datos DICOM, herramientas, render, exportación, UI, runtime, acceso, carga, viewport, interacción de anotaciones y loader.
- `main` permanece sin modificar; la rama continúa aislada.
- `viewer-loader.js` sigue usando `viewer-source.html` de forma transitoria; todavía NO debe eliminarse.
- Se eliminaron del encabezado controles decorativos/no funcionales y se dejó el alcance explícito como visor radiográfico DICOM.
- Se corrigió la marca visual del encabezado para `ime` en acento y `DICOM` en claro sobre fondo oscuro.
- Se alineó la tipografía con Space Grotesk / IBM Plex Sans / IBM Plex Mono.
- Se eliminó el gradiente del shell y de los paneles principales.
- Se eliminó cualquier vignette/scanline decorativo en el entorno diagnóstico: `#dv-viewer-wrap::before` queda desactivado y el fondo del viewer es sólido.
- Se revisó `viewer-viewport.js`: el zoom se sincroniza mediante callback con el runtime residual y el borrado contextual se suprime después de pan/WW-WL con clic derecho.
- Se evitó duplicar el toggle de interacción con clic izquierdo: esa parte permanece temporalmente en los listeners residuales hasta la siguiente extracción.

## Validación 2 — Integridad JavaScript y dependencias residuales

Estado: COMPLETADA A NIVEL DE CÓDIGO / PENDIENTE PRUEBA EN NAVEGADOR.

Comprobado y corregido:

- Se auditó el orden real de sustitución de `viewer-loader.js` contra `viewer-source.html`.
- Se corrigió una declaración duplicada de `const dropEl` que podía producir `SyntaxError` después de sustituir el bloque de fullscreen.
- Se corrigió la reinserción duplicada del marcador `const FIXED_FONT` al sustituir `canvasFraction()`.
- `replaceFunctionBlock()` ahora falla explícitamente si no encuentra un bloque obligatorio; ya no deja silenciosamente una mezcla parcial de código legado y modular.
- Se añadió un registro de sustituciones (`replacementAudit`) para facilitar la comprobación del runtime durante las pruebas de navegador.
- Se verificó que `viewer-load.js` recibe `extractMeta()` y `extractPixel()` como dependencias y no reimplementa esas reglas.
- Se verificó que `viewer-viewport.js` comunica los cambios de zoom al runtime residual y la supresión del borrado contextual después de pan/WW-WL.
- Se restauró en `viewer-tools.js` el comportamiento legado para la etiqueta de ángulos cercanos a 180°, usando la perpendicular de respaldo cuando la bisectriz es inestable.
- Se corrigió el tratamiento de `jsPDF`: si su CDN falla, se marca `window.__dvPdfFailed` y el visor continúa con PNG/JPG, como estaba previsto originalmente; una dependencia externa sin fallback sí aborta la inicialización.
- El render modular conserva el pipeline existente de WW/WL, MONOCHROME1, inversión, rotación, espejo, escalado y overlay a nivel de código fuente.

Dependencias residuales confirmadas:

1. `viewer-source.html` sigue aportando la estructura HTML y estilos base del visor.
2. Siguen allí los listeners de creación/edición/movimiento de anotaciones y parte de la coordinación de herramientas.
3. Siguen allí `draw()`, selección/lista de archivos, panel de metadata, perfiles de ventana, transformaciones y coordinación de exportación, aunque varias de sus operaciones centrales ya delegan a módulos externos.
4. `viewer-loader.js` todavía transforma texto del archivo transitorio mediante marcadores; esta arquitectura debe desaparecer antes de producción.

Limitaciones de esta validación:

- No demuestra todavía que el JavaScript inicialice correctamente en Chrome/Edge/Safari/iPad.
- No demuestra carga/render de un DICOM real.
- No valida todavía zoom, WW/WL, anotaciones, PixelSpacing, exportación o fullscreen mediante interacción real.
- No autoriza eliminar `viewer-source.html`.

## Siguiente fase

Validación 3 — Prueba de inicialización/runtime y preparación de una ruta para retirar `viewer-source.html` sin perder estructura ni listeners.

Después de esa fase: pruebas funcionales con DICOM reales antes de considerar merge o producción.
