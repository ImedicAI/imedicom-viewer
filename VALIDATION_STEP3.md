# Validación 4 — Paso 3: herramientas y mediciones

Estado: COMPLETADO en Chromium headless con DICOM sintético controlado.

Workflow: `.github/workflows/tools-validation.yml`.

Corridas:

- Run 1 `31645712623`: falló en `arrow_create` porque el candado mantiene `#dv-root` con `display:none` en CI y el canvas no tenía geometría CSS utilizable para eventos de mouse.
- Run 2 `31645846823`: falló por una condición demasiado estricta del harness (`canvas_rect_8x6`); el tamaño nativo 8×6 del fixture es válido.
- Run 3 `31645959114`: Flecha pasó; Length quedó interferido por el radio mínimo de hit-test de flecha (10 px), que en un fixture de 8×6 cubre prácticamente todo el canvas. No se cambió ese radio del visor.
- Run 4 `31646070356`, commit `b8bd2775ba88256a713f4a8771eacb0aae9dc2b3`: `success` completo.

Validado mediante controles y eventos reales del visor:

- Flecha: creación mediante clic + arrastre.
- Length: creación mediante clic + arrastre.
- Length + PixelSpacing: con `PixelSpacing=0.20\\0.20 mm`, el trazo controlado produjo `0.08 cm` dentro de la tolerancia definida.
- Ángulo: tres clics A → vértice → B y cálculo de 90.0° mediante el mismo helper del visor.
- Cobb: cuatro puntos que forman dos líneas perpendiculares y cálculo de 90.0°.
- Texto: activación de herramienta, apertura del input flotante, entrada `CONTROL TXT` y confirmación con Enter.
- Movimiento de texto: hit-test del canvas + drag de una anotación existente.
- Undo: restaura el estado anterior de las anotaciones después del movimiento.
- Redo: restaura exactamente el estado posterior al movimiento.

Nota sobre el fixture:

El DICOM de CI es deliberadamente pequeño (8×6) para mantener la prueba determinista. El visor usa un radio mínimo de agarre de 10 px para flechas, razonable en radiografías reales pero mayor que este fixture. Para evitar que ese detalle artificial contamine otras herramientas, después de verificar Flecha el harness limpia únicamente el estado de anotaciones de CI. No se modificó la lógica del visor ni sus hit-tests de producción.

Pendiente después de este paso:

- Exportación PNG/JPG/PDF con DICOM cargado.
- Pruebas con DICOM radiográficos clínicos reales y distintas fuentes/equipos.
- Pruebas específicas de PixelSpacing anisotrópico antes de considerar precisión métrica en ese escenario.
- Retirada de `viewer-source.html` solo después de cerrar validaciones funcionales restantes.
