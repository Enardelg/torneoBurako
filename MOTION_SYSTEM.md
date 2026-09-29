# Code Coffee Motion System

## Principios
1. El movimiento narra el torneo; no debe ocultar información.
2. Toda revelación ocurre en una franja escénica reservada.
3. El destino se ilumina antes de recibir una pareja.
4. Los ganadores avanzan con un pulso de energía; el perdedor baja intensidad, pero permanece legible.
5. Se respeta `prefers-reduced-motion`.

## Secuencias
- `ball-spin`: energía 3D dentro del bolillero, 900–1200 ms.
- `pair-reveal`: entrada vertical + foco de luz, 350–500 ms.
- `slot-receive`: pulso cian/magenta, 700–1000 ms.
- `winner-confirm`: borde amarillo, corona y expansión breve, 500–800 ms.
- `winner-travel`: conexión visual entre rondas, 700–1100 ms.
- `champion-ceremony`: spotlight, órbita de trofeo y partículas, 2.5–4 s.

## Restricciones
- No usar modales durante sorteo.
- No aplicar zoom que saque el fixture del viewport.
- No animar más de tres focos de atención simultáneos.
