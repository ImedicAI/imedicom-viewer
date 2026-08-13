# Validación 6 — Rendimiento y regresiones

Fecha: 2026-08-12

## Regresión corregida

Durante la modularización, el listener de `#dv-warn-toggle` quedó dentro del bloque legacy de viewport que es sustituido por `viewer-loader.js`. `viewer-viewport.js` no restauraba ese listener, por lo que el aviso de privacidad podía quedar visible pero sin responder al clic.

Corrección aplicada en `viewer-ui.js`:
- restaura exactamente el comportamiento original de expandir/contraer;
- actualiza el chevrón `▴/▾`;
- evita enlazar el listener más de una vez mediante `data-premium-privacy-toggle-bound`.

## Validación de regresiones

Workflow: `.github/workflows/regression-validation.yml`

Run validado: `31648760362`
Resultado: **success**

Comprobaciones:
- el visor inicia bloqueado cuando no hay sesión de acceso;
- la pantalla de acceso está visible al inicio;
- los controles de fullscreen no se muestran mientras el visor está bloqueado;
- el runtime de fullscreen está disponible;
- el toggle de privacidad expande y contrae de forma reversible;
- el chevrón cambia correctamente;
- un código vacío no desbloquea el visor y muestra el mensaje controlado.

## Rendimiento con DICOM clínico grande

Estudios reales Carestream evaluados localmente: matriz 2660 x 2180, 5,798,800 píxeles, 16 bits asignados / 12 bits almacenados, MONOCHROME1.

El parser y la extracción de píxeles/metadata funcionan correctamente. El punto costoso es el render inicial y el recálculo de WW/WL a resolución completa.

`viewer-render.js` genera temporalmente varias superficies de tamaño completo (`ImageData`, canvas intermedio sin transformar, canvas rotado y canvas final/cache). Para una matriz de 5.8 Mpx, cada superficie RGBA ocupa aproximadamente 23.2 MB decimales; por tanto el pico transitorio puede superar 90 MB solo en superficies de render, antes de contar Pixel Data, canvas visible y overhead del navegador.

No se modifica todavía el algoritmo de render. Cualquier optimización de resolución interactiva durante WW/WL debe compararse contra el render completo y no degradar la presentación radiográfica.

## Pendiente

- prueba manual de fullscreen real bajo gesto de usuario (la política del navegador limita su validación fiable en headless);
- prueba manual de `showDirectoryPicker`/escritura física de exportaciones;
- benchmark en hardware real con los DICOM clínicos 2660 x 2180;
- Safari/iPad/Edge;
- optimización del render solo si el benchmark real demuestra latencia problemática.
