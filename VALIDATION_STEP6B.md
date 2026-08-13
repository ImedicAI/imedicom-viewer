# Validación 6 — Paso 2

Estado: **COMPLETADO**

Workflow: `.github/workflows/session-folder-fullscreen-validation.yml`
Run: `31649359266`
Resultado: **success**

## Cobertura

- acceso válido simulado por el mismo endpoint esperado por `viewer-access.js`;
- solicitud de fullscreen asociada al clic de acceso;
- persistencia de `dv_access_session` en `localStorage`;
- aparición de controles de fullscreen solo tras desbloqueo;
- minimizar sale de fullscreen;
- carga posterior de DICOM rearma/restaura fullscreen;
- `showDirectoryPicker()` se ejerce a través del flujo real de exportación;
- escritura real del Blob a través de `getFileHandle -> createWritable -> write -> close`;
- archivo PNG esperado: `SESSION SESS-001.png`;
- el selector de carpeta actualiza el estado visual del botón;
- el handle de carpeta se reutiliza en una segunda exportación sin volver a pedir carpeta;
- tras la salida de fullscreen causada por el selector de carpeta, el siguiente clic rearma el fullscreen.

## Alcance

El harness sustituye únicamente las APIs dependientes del sistema/navegador (`requestFullscreen`, `showDirectoryPicker` y respuesta del Worker) para hacerlas observables en Chromium headless. La lógica de imeDICOM que decide cuándo invocarlas, persiste sesión, carga el DICOM y escribe el Blob es la lógica real de la rama.

No se utilizaron DICOM clínicos ni datos de pacientes.
