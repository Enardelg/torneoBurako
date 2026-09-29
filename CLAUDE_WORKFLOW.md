# Integración de Claude en el desarrollo visual

Claude no se integra en tiempo de ejecución dentro de la aplicación. Se utiliza como **agente de diseño y generación de código** durante el desarrollo, siempre bajo esta arquitectura.

## Momento exacto en que entra Claude

1. **Dirección de arte**: recibe capturas del fixture de referencia, tokens visuales y restricciones de legibilidad.
2. **Prototipado de motion**: genera variantes de animaciones para revelación, transferencia hacia casilleros, avance de ganadores y ceremonia final.
3. **Refinamiento WebGL**: trabaja sobre `src/components/BallMachine3D.tsx`, sin alterar modelos ni reglas del torneo.
4. **Auditoría visual**: revisa cada pantalla en 1920×1080 y 1366×768 para detectar superposiciones, clipping y jerarquía deficiente.
5. **Iteración controlada**: entrega diffs pequeños. No debe reescribir `tournament.ts`, `types.ts` ni la importación Excel sin aprobación.

## Prompt maestro para Claude

```text
Actuá como senior creative frontend engineer especializado en React, TypeScript, Framer Motion y React Three Fiber.

Proyecto: gestor visual de torneos de Burako por zonas.
Arquitectura existente: React + TypeScript + Vite. La lógica está separada de la UI.
Objetivo visual: transmisión deportiva premium, fixture tipo Mundial, verde paño profundo y detalles dorados.

Reglas obligatorias:
- No modificar src/types.ts ni src/tournament.ts.
- No usar modales ni overlays que oculten información del fixture.
- Toda revelación debe ocurrir dentro de una zona escénica reservada.
- Mantener legibilidad en 1920x1080 y 1366x768.
- Respetar prefers-reduced-motion.
- Evitar animaciones genéricas de fade/scale como efecto principal.
- Usar trayectorias, iluminación, profundidad, easing y staging cinematográfico.
- Entregar únicamente archivos modificados y una explicación breve de las decisiones.
```

## Prompt: bolillero 3D premium

```text
Refiná BallMachine3D.tsx con estética de objeto televisivo premium.
Agregar: urna de vidrio físicamente plausible, base metálica dorada/verde, bolas con colisiones visuales convincentes, iluminación de estudio, cámara estable y desaceleración progresiva.
No incorporar texto dentro de Canvas. No bloquear interacción ni exceder 16.6 ms por frame en una notebook media.
```

## Prompt: revelación de pareja sin tapar el fixture

```text
Diseñá una secuencia de 2.2 segundos dentro del componente reveal-strip existente.
La pareja aparece mediante barrido luminoso horizontal, nombre y jugadores se construyen por capas, y luego una guía visual conecta la franja con el casillero receptor.
No usar modal, popup, portal ni position fixed. El fixture debe permanecer completamente visible.
```

## Prompt: avance de ganadores

```text
Al seleccionar un ganador, animar el casillero ganador con borde dorado, atenuar al eliminado y trasladar una réplica visual del nombre por la línea del bracket hasta el siguiente cruce.
La animación debe comunicar causalidad espacial, no solo celebración.
```

## Prompt: campeón del torneo

```text
Crear una ceremonia final de 5 segundos: oscurecimiento escénico, spotlight, elevación de trofeo 3D, aparición del nombre de la pareja campeona, partículas doradas y ribbon final.
Debe incluir una variante reduced-motion sin flashes ni desplazamientos bruscos.
```
