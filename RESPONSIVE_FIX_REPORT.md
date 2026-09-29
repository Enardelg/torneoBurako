# Informe de corrección responsive — v0.2.1

## Causa raíz

Las cards no fallaban por los datos ni por Framer Motion. El problema era geométrico:

- `fixture-live-board` permitía tres zonas por fila, pero cada `ZoneBoard` conservaba cinco tracks internos, incluido un bloque de campeón con ancho mínimo de 180 px.
- `zone-result-flow` intentaba conservar cuatro columnas dentro de cards de aproximadamente 550–650 px.
- `world-bracket` reservaba siempre tres tracks de rondas aunque el fixture de cuatro campeones solo genera semifinales y final.
- Varios hijos flex/grid no tenían una política completa de `min-width: 0`, truncado y límites de líneas.

## Correcciones aplicadas

### Sorteo

- Grilla de zonas en dos columnas en desktop.
- Layout compacto por card: dos mesas arriba; final y campeón abajo.
- Container query para recuperar el flujo horizontal solo cuando la card tiene ancho suficiente.
- Elipsis estable para casilleros y máximo de dos líneas para el campeón.

### Finales de zona

- Mesas a la izquierda y final/campeón apilados a la derecha en anchos medios.
- Cuatro columnas únicamente en cards realmente anchas.
- Una sola card por fila antes de alcanzar el punto de compresión.
- Protección de overflow en `TeamLine`, resultados y card de campeón.

### Semifinales

- Cantidad de columnas de ronda derivada de `rounds.length` mediante `--round-count`.
- Eliminación de la columna fantasma.
- Cards y badges protegidos contra overflow.

## Archivos principales modificados

- `src/App.tsx`
- `src/styles.css`
- `dist/assets/index-B1Ikhu1J.js`
- `dist/assets/index-CGtFpe7M.css`
- `CHANGELOG.md`
- `CLAUDE_CARD_LAYOUT_FIX_PROMPT.md`

## Validación

- TypeScript validado con `tsc -b` sin errores.
- El `dist` incluido fue sincronizado con las correcciones de CSS y con el track dinámico del bracket.
