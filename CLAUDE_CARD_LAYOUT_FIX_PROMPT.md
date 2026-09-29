# Prompt para Claude Code — reparación urgente de cards y responsive

Trabajá sobre el proyecto existente. **No lo reescribas desde cero**. Antes de modificar código, leé completos estos archivos:

- `PRODUCT_SPEC.md`
- `DESIGN_SYSTEM.md`
- `MOTION_SYSTEM.md`
- `COMPONENT_LIBRARY.md`
- `CLAUDE_WORKFLOW.md`
- `src/App.tsx`
- `src/styles.css`
- `src/tournament.ts`
- `src/types.ts`

## Problemas que deben corregirse

Hay dos fallas visuales críticas:

1. Durante el sorteo con el bolillero, las cuatro cards de zonas se comprimen demasiado. Las columnas internas de `ZoneBoard` quedan con anchos mínimos incompatibles con el ancho real de cada card; los nombres terminan mostrando una letra por línea o quedan recortados.
2. En “Finales por zona” y al habilitar semifinales, las cards vuelven a comprimirse. El layout intenta mostrar mesas, conector, final y campeón en cuatro columnas dentro de una card de aproximadamente 550–650 px. La card del campeón queda extremadamente angosta y los nombres se rompen.
3. El bracket final usa una cantidad fija de columnas CSS para tres rondas aunque el torneo de cuatro zonas solo genera dos rondas. Esa columna fantasma reduce innecesariamente el ancho de semifinales y final.

## Objetivo

Mantener exactamente la identidad visual neon Code Coffee, el flujo funcional y las animaciones, pero hacer que todas las cards sean legibles y estables en:

- 1920×1080
- 1600×900
- 1366×768
- 1280×720
- tablet y móvil mediante apilado progresivo

## Implementación requerida

### A. Sorteo / `ZoneBoard`

- No cambies la lógica de asignación ni el orden de los partidos.
- La grilla principal de zonas debe mostrar **2 columnas × 2 filas** en desktop estándar; no tres cards comprimidas en una fila.
- Convertí cada `.zone-board` en un query container (`container-type: inline-size`).
- En cards angostas, usá un layout compacto de dos niveles:
  - arriba: Mesa 1 y Mesa 2 en dos columnas;
  - abajo: Final de zona + Campeón de zona;
  - ocultá las flechas horizontales cuando no haya ancho suficiente.
- Solo recuperá el flujo horizontal completo cuando la card tenga ancho real suficiente mediante `@container`.
- Todos los nombres deben usar elipsis o un máximo de dos líneas. Está prohibido que una palabra se renderice letra por letra.

### B. Finales por zona / `ZoneResultCard`

- Convertí `.zone-result-card` en query container.
- Para cards de aproximadamente 550–800 px, usá tres columnas reales:
  - mesas iniciales;
  - conector;
  - columna derecha con Final de zona arriba y Campeón de zona abajo.
- Solo mostrálos en cuatro columnas cuando el ancho interno sea suficientemente grande.
- En pantallas donde dos cards por fila ya no caben, pasá `.zone-results-grid` a una sola columna antes de que el contenido se comprima.
- `TeamLine`, `.result-match`, `.final-result`, `.zone-crown-card` y todos sus hijos deben tener `min-width: 0` donde corresponda.
- Los nombres de pareja y jugadores deben conservar elipsis; la card del campeón admite como máximo dos líneas completas, sin `word-break: break-all` ni `overflow-wrap: anywhere`.

### C. Semifinales y gran final

- La cantidad de tracks de `.world-bracket` debe depender de `rounds.length`.
- Pasá una variable CSS desde React, por ejemplo:

```tsx
style={{ '--round-count': rounds.length } as CSSProperties}
```

- Usá esa variable en `repeat(var(--round-count), ...)`.
- Eliminá cualquier override responsive que vuelva a fijar `repeat(3, ...)`.
- Protegé `.world-match` y `.team-line` contra overflow.
- El badge “SEMIFINALISTA/CAMPEÓN” no puede destruir el ancho disponible para el nombre; debe truncarse si es necesario.

## Restricciones

- No alteres la estética general, paleta, tipografía, bolillero 3D ni flujo del torneo.
- No elimines información para “hacerla entrar”.
- No uses transformaciones globales con `scale()` ni reduzcas todo el sitio artificialmente.
- No fijes alturas que corten contenido.
- No agregues scroll horizontal en la pantalla del sorteo. En el bracket final se permite como fallback únicamente en pantallas pequeñas.
- No modifiques reglas deportivas ni datos salvo que detectes un bug independiente y lo documentes por separado.

## Validación obligatoria

1. Ejecutá `npm run build`.
2. Verificá que no haya errores TypeScript.
3. Probá el flujo completo:
   - setup;
   - bolillero y asignación;
   - selección de ganadores de las ocho mesas;
   - selección de los cuatro campeones de zona;
   - semifinales;
   - gran final.
4. Tomá capturas en 1366×768 y 1920×1080 de:
   - sorteo en curso;
   - finales de zona completas;
   - semifinales.
5. Confirmá específicamente que:
   - ningún nombre aparece letra por letra;
   - no hay cards superpuestas;
   - ninguna card sale de su contenedor;
   - no existe una columna vacía en el bracket;
   - no aparece scroll horizontal en el sorteo.

## Entrega

Al finalizar, informá:

- causa raíz;
- archivos modificados;
- cambios de layout realizados;
- resoluciones verificadas;
- resultado de `npm run build`;
- cualquier deuda técnica restante.
