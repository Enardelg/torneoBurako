# Prompt para la siguiente iteración en Claude Code

Lee primero `PRODUCT_SPEC.md`, `DESIGN_SYSTEM.md`, `MOTION_SYSTEM.md`, `COMPONENT_LIBRARY.md` y `CLAUDE_WORKFLOW.md`.

Audita la implementación actual respetando estas restricciones:

1. No modifiques `src/tournament.ts` ni las reglas del torneo sin justificarlo.
2. No agregues colores literales en componentes; usa variables CSS o `src/design-system/tokens`.
3. La pantalla objetivo es 1920×1080 en un TV de 75 pulgadas.
4. Los nombres de parejas y jugadores deben permanecer legibles a distancia.
5. Ninguna animación puede superponerse al fixture o ocultar información.
6. Refina únicamente:
   - composición 16:9;
   - bolillero React Three Fiber;
   - transición reveal → slot;
   - avance de ganador entre rondas;
   - ceremonia de campeón;
   - rendimiento y reduced motion.
7. Ejecuta `npm run build` al finalizar y corrige errores TypeScript.
8. Informa archivos modificados, decisiones visuales y cualquier deuda técnica restante.
