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

Hallazgos pendientes para fases posteriores:

1. `viewer-source.html` sigue siendo requerido para estructura HTML, estilos base y listeners residuales.
2. Persisten listeners de creación/edición/movimiento de anotaciones dentro de la fuente transitoria.
3. Falta validación sintáctica/de dependencias más profunda del JavaScript resultante después de las sustituciones del loader.
4. Falta validación funcional real en navegador con archivos DICOM.
5. `preview-premium.html` y `legacy-viewer.html` son archivos transitorios/respaldo; no deben confundirse con la aplicación activa.
6. No se debe eliminar `viewer-source.html` hasta completar las validaciones 2 y 3.

## Próxima fase

Validación 2 — Integridad de JavaScript y dependencias residuales.
