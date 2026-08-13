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

Estado: COMPLETADA A NIVEL DE CÓDIGO.

Comprobado y corregido:

- Se auditó el orden real de sustitución de `viewer-loader.js` contra `viewer-source.html`.
- Se corrigió una declaración duplicada de `const dropEl` que podía producir `SyntaxError` después de sustituir el bloque de fullscreen.
- Se corrigió la reinserción duplicada del marcador `const FIXED_FONT` al sustituir `canvasFraction()`.
- `replaceFunctionBlock()` ahora falla explícitamente si no encuentra un bloque obligatorio; ya no deja silenciosamente una mezcla parcial de código legado y modular.
- Se añadió un registro de sustituciones (`replacementAudit`) para facilitar la comprobación del runtime.
- Se verificó que `viewer-load.js` recibe `extractMeta()` y `extractPixel()` como dependencias y no reimplementa esas reglas.
- Se verificó que `viewer-viewport.js` comunica los cambios de zoom al runtime residual y la supresión del borrado contextual después de pan/WW-WL.
- Se restauró en `viewer-tools.js` el comportamiento legado para la etiqueta de ángulos cercanos a 180°, usando la perpendicular de respaldo cuando la bisectriz es inestable.
- Se corrigió el tratamiento de `jsPDF`: si su CDN falla, se marca `window.__dvPdfFailed` y el visor continúa con PNG/JPG; una dependencia externa sin fallback sí aborta la inicialización.
- El render modular conserva el pipeline existente de WW/WL, MONOCHROME1, inversión, rotación, espejo, escalado y overlay a nivel de código fuente.

## Validación 3 — Inicialización/runtime

Estado: COMPLETADA PARA ARRANQUE EN CHROMIUM HEADLESS.

Método:

- Se añadió `.github/workflows/runtime-validation.yml`.
- El workflow sirve la rama por HTTP local y abre `index.html` con Chromium headless.
- Comprueba `dv-root`, `dv-canvas`, `data-viewer-integration`, `data-viewer-replacement-count` y ausencia de la pantalla fatal `No se pudo inicializar el visor`.
- Ejecuta un segundo arranque bloqueando deliberadamente `cdnjs.cloudflare.com` para comprobar el fallback de jsPDF.

Hallazgos durante las ejecuciones:

1. Corrida 1 (`31644131507`) falló: el marcador del parser era demasiado rígido.
2. Corrida 2 (`31644346172`) falló: las sustituciones estrictas se estaban intentando aplicar a scripts inline auxiliares que no contienen el parser/state.
3. Se corrigió el loader para identificar explícitamente el script principal del visor y aplicar allí las sustituciones obligatorias.
4. Corrida 3 (`31644460063`, commit `66b256ccc37e567d5c1ab019b937cf35df7cf319`) terminó con `success`.
5. En la corrida 3 pasaron tanto `Normal startup` como `Startup with jsPDF CDN blocked`.

Lo que esta validación SÍ demuestra:

- La arquitectura modular actual inicia correctamente en Chromium headless.
- El DOM principal del visor se construye.
- El loader completa su integración modular sin caer en el estado fatal.
- La ausencia de jsPDF no impide el arranque base.

## Validación 4 — Prueba funcional DICOM

### Paso 1 — Carga + metadata + render básico

Estado: COMPLETADO CON DICOM SINTÉTICO CONTROLADO.

Método:

- El workflow genera en cada corrida un DICOM válido Explicit VR Little Endian, sin compresión, monocromo 8-bit, de 8×6 píxeles.
- El fixture contiene identidad, fecha/hora, modalidad DX, BodyPartExamined=CHEST, ViewPosition=AP, PixelSpacing 0.20\\0.20, WW/WL y un gradiente conocido de píxeles.
- La carga se realiza a través del `<input type=file>` real del visor usando `DataTransfer`; no se invoca el parser directamente desde la prueba.
- `viewer-load.js` emite eventos de ciclo de vida `imeDicom:file-loaded` / `imeDicom:file-error` para observabilidad sin alterar el flujo clínico.
- La prueba comprueba metadata, Rows/Columns, PixelSpacing, dimensiones del canvas, visibilidad del canvas, ausencia del estado vacío y que el canvas contenga niveles de gris no uniformes.

Hallazgo y corrección:

1. Primera corrida funcional (`31644729676`) falló únicamente en `empty_state_visible`.
2. Parser, metadata, dimensiones, PixelSpacing y render de píxeles ya habían pasado en esa corrida.
3. La causa era CSS: `#dv-empty{display:flex!important}` anulaba `emptyEl.style.display='none'` ejecutado por `draw()`.
4. Se retiró `!important` únicamente de `display` en `#dv-empty`, preservando el diseño del estado vacío pero permitiendo ocultarlo al cargar una imagen.
5. La corrida siguiente (`31644819199`, commit `29594d3059d4ed713467693868a61e2ec0e85247`) terminó con `success` en `Normal startup`, `Startup with jsPDF CDN blocked` y `Controlled DICOM load and render`.

Lo que este paso SÍ demuestra:

- El flujo normal de selección de archivo llega a `viewer-load.js`.
- El parser modular procesa un DICOM no comprimido Explicit VR Little Endian.
- `extractMeta()` devuelve correctamente los campos controlados probados.
- `extractPixel()` devuelve dimensiones y PixelSpacing correctos para el fixture.
- La selección automática dispara el render.
- El canvas obtiene las dimensiones correctas y contiene píxeles renderizados con variación tonal.
- El estado vacío desaparece cuando una imagen queda activa.

### Paso 2A — Motor WW/WL + inversión + geometría

Estado: COMPLETADO A NIVEL DE MOTOR DE RENDER.

Método:

- Se reutiliza el mismo DICOM 8×6 cargado por el flujo real del visor.
- Después de la carga, la prueba usa `viewer-render.js` sobre el mismo objeto `entry` y compara matrices de luminancia píxel por píxel.
- No se considera suficiente que una función se ejecute: cada transformación debe producir la matriz esperada.

Validado en corrida `31645275455`, commit `f0b30bf4de64f39ccd5866ed58795fa623467d08`:

- Cambiar `windowCenter` modifica efectivamente la luminancia renderizada.
- Cambiar `windowWidth` modifica efectivamente la distribución/contraste de píxeles.
- `invert=true` sobre MONOCHROME2 produce, con tolerancia de cuantización de 1 nivel, `255 - valor_base`.
- Rotación +90° intercambia 8×6 a 6×8 y la posición de cada píxel coincide con una rotación horaria exacta.
- `flipH` refleja exactamente la matriz ya rotada de izquierda a derecha.
- `flipV` refleja exactamente la matriz ya rotada de arriba a abajo.
- MONOCHROME1 sin inversión de usuario produce la inversión esperada respecto de MONOCHROME2.
- MONOCHROME1 + inversión de usuario revierte nuevamente a la matriz base, confirmando la lógica XOR existente.
- El workflow completo terminó en `success`, incluyendo arranque normal, fallback sin jsPDF y pipeline DICOM controlado.

Lo que el Paso 2A NO demuestra todavía:

- Que los sliders visibles de WL/WW actualicen correctamente `entry.pixel.windowCenter/windowWidth` y redibujen el canvas.
- Que los botones visibles Invertir, Rotar y Espejo estén correctamente conectados al estado activo.
- Que Reset WW/WL restaure exactamente los valores iniciales.
- Comportamiento de estos controles durante zoom/pan o con varios archivos activos.

## Dependencias residuales confirmadas

1. `viewer-source.html` sigue aportando la estructura HTML y estilos base del visor.
2. Siguen allí los listeners de creación/edición/movimiento de anotaciones y parte de la coordinación de herramientas.
3. Siguen allí `draw()`, selección/lista de archivos, panel de metadata, perfiles de ventana, transformaciones y coordinación de exportación, aunque varias de sus operaciones centrales ya delegan a módulos externos.
4. `viewer-loader.js` todavía transforma texto del archivo transitorio mediante marcadores; esta arquitectura debe desaparecer antes de producción.

## Siguiente fase

Validación 4, paso 2B — comprobar los controles UI reales de WL/WW, Reset, Invertir, Rotar y Espejos contra el DICOM controlado y verificar su efecto final en el canvas.

Después: paso 3 de herramientas/mediciones, paso 4 de exportación y luego pruebas con DICOM clínicos reales antes de retirar `viewer-source.html`.
