# Validación 4 — Paso 4: Exportación

Estado: COMPLETADO.

Workflow: `.github/workflows/export-validation.yml`

Corrida final exitosa: `31646367694` (commit `f8b95c56d626722dba724d137df6a57c3cfa9425`).

Se cargó un DICOM sintético controlado por el flujo normal del visor y se construyó un canvas de exportación a multiplicador 2, incluyendo overlay y una anotación.

Resultados verificados:

- Canvas exportado: 16×12 px a partir del fixture 8×6 con multiplicador 2.
- Nombre generado: `EXPORT EXP-001`.
- Sanitización de caracteres inválidos de nombres de archivo.
- PNG: Blob `image/png`, 431 bytes, cabecera/dimensiones binarias válidas 16×12.
- JPG: Blob `image/jpeg`, 947 bytes, SOF JPEG con dimensiones 16×12.
- PDF: Blob generado por jsPDF, 4220 bytes, cabecera `%PDF-` válida.
- Fallback PDF: con `window.__dvPdfFailed=true`, la exportación PDF falla de forma controlada con el mensaje previsto y no afecta PNG/JPG.

La primera corrida (`31646255884`) no produjo resultado final porque `createImageBitmap()` quedó esperando en Chromium headless. Se sustituyó esa comprobación del harness por lectura determinista de las cabeceras PNG/JPEG. No fue necesario modificar `viewer-export.js` para conseguir el resultado exitoso.

Esta prueba valida el pipeline de generación/codificación y nombres. No valida todavía la interacción con el selector nativo `showDirectoryPicker` ni la escritura física en una carpeta del sistema operativo, que depende de permisos/gesto de usuario del navegador.
