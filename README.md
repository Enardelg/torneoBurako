# Burako Tournament Manager — Zonas

Versión funcional del fixture solicitado: zonas configurables, sorteo 3D, finales de zona, semifinales, gran final y ceremonia de campeones.

## Ejecutar

```bash
npm install
npm run dev
```

## Flujo

1. Importación de Excel o datos demo.
2. Configuración libre de cantidad de zonas y parejas por zona.
3. Sorteo con bolillero WebGL y fixture siempre visible.
4. Mesas iniciales dentro de cada zona.
5. Final y campeón de cada zona.
6. Bracket tipo Mundial entre campeones de zona.
7. Gran final y presentación animada del campeón.

## Excel

Columnas admitidas: `Pareja` o `Equipo`; `Jugador 1`/`Nombre 1`/`Jugador1`; `Jugador 2`/`Nombre 2`/`Jugador2`.

## Claude

Ver `CLAUDE_WORKFLOW.md`: define exactamente cuándo interviene Claude, qué archivos puede modificar y los prompts para pulir WebGL y motion sin romper la lógica.

## Identidad visual Code Coffee
La versión 0.2 incorpora un design system derivado de `logo.jpg`. Consultar:
- `DESIGN_SYSTEM.md`
- `MOTION_SYSTEM.md`
- `PRODUCT_SPEC.md`
- `COMPONENT_LIBRARY.md`
- `CLAUDE_NEXT_PROMPT.md`

La interfaz prioriza contraste, legibilidad y composición 16:9 para una pantalla de 75 pulgadas.

## Cambios v0.3.0

Esta entrega incorpora el sistema responsive para proyección al 125 %, animaciones de sorteo e inserción, brackets flexibles con conectores geométricos, sonido funcional, pantalla completa reversible y plantilla Excel descargable.

Consultar `GUIA_DE_USO_Y_CARGA_EXCEL.md` para el formato exacto del archivo y el flujo operativo.
