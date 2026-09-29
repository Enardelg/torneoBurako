# Changelog

## v0.3.1 — Hotfix del bolillero

- Corregido el sorteo que quedaba indefinidamente en “Próxima pareja…” bajo React Strict Mode.
- La secuencia usa identificadores de ejecución para cancelar ciclos antiguos sin bloquear el nuevo.
- Activar sonido o cambiar pantalla completa ya no reinicia el sorteo.

# Cambios de la revisión por zonas

- Se reemplazó el torneo lineal por un modelo configurable de zonas.
- Configuración inicial: 16 parejas, 4 zonas, 4 parejas por zona y 2 mesas iniciales por zona.
- Se admiten cantidades libres de zonas, siempre que la capacidad coincida con las parejas importadas.
- Nuevo fixture permanente tipo Mundial.
- La revelación dejó de ser un popup: ahora vive en una franja reservada y no tapa casilleros.
- Nuevo bolillero WebGL con React Three Fiber.
- Gestión separada de ganadores de mesa, finales de zona y campeones de zona.
- Bracket de fase final entre campeones de zona.
- Nueva ceremonia animada del campeón.
- Documento `CLAUDE_WORKFLOW.md` con responsabilidades y prompts de refinamiento visual.

## 0.2.0 — Code Coffee Neon Design System
- Sustitución completa de la identidad verde/dorada por la paleta extraída del logo Code Coffee.
- Nuevo sistema tipográfico Barlow Condensed + Inter, escalable para TV de 75 pulgadas.
- Cards oscuras con contraste consistente; eliminación de superficies claras conflictivas.
- Nuevo fondo de circuitos, partículas y líneas neón.
- Bolillero 3D recoloreado con violeta, magenta, cian, amarillo, naranja y verde.
- Estados visuales reforzados para recepción de parejas, ganadores y campeones.
- Documentación agregada: DESIGN_SYSTEM.md, MOTION_SYSTEM.md, PRODUCT_SPEC.md y COMPONENT_LIBRARY.md.
- Tokens TypeScript centralizados en src/design-system.

## 0.2.1 — Corrección urgente de cards y bracket responsive
- El sorteo ahora distribuye las zonas en 2×2 y cada card cambia de composición según su ancho real.
- Mesas, final y campeón dejan de comprimirse en columnas imposibles.
- Las finales de zona apilan final y campeón en anchos medios y recuperan el flujo horizontal solo cuando existe espacio.
- Se agregaron límites de overflow, elipsis y máximo de dos líneas para nombres extensos.
- El bracket calcula sus columnas desde la cantidad real de rondas y elimina el track vacío que estrechaba semifinales.
- Se sincronizó el contenido de `dist` para permitir una prueba inmediata sin recompilar.
- Se agregó `CLAUDE_CARD_LAYOUT_FIX_PROMPT.md` con instrucciones exactas para auditar o continuar el trabajo en Claude Code.
