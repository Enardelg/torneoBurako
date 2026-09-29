# Hotfix v0.3.1 — Inicio del bolillero

## Problema corregido

En el entorno de desarrollo de Vite/React, `React.StrictMode` ejecuta los efectos dos veces para detectar efectos secundarios inseguros.

El sorteo utilizaba un bloqueo persistente (`running.current`). La primera ejecución se cancelaba durante la verificación de Strict Mode, pero el bloqueo permanecía activo. Por eso la segunda ejecución no comenzaba y la interfaz quedaba indefinidamente en **“Próxima pareja…”**, con todas las zonas en `0/4 asignadas`.

## Solución

- Se eliminó el bloqueo que impedía reiniciar el efecto.
- Cada ejecución del sorteo recibe un identificador único.
- Las ejecuciones canceladas o antiguas ya no pueden modificar el estado.
- El cursor, el bolillero y la pareja revelada se reinician al comenzar una ejecución válida.
- El funcionamiento es consistente tanto en desarrollo con Strict Mode como en producción.

## Estabilidad adicional

Las callbacks que cambian de fase ahora son estables (`useCallback`). Activar el sonido o cambiar el modo de pantalla completa durante el sorteo ya no reinicia la secuencia desde cero.
