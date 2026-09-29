# Code Coffee Design System

## Dirección de arte
La aplicación debe sentirse como una transmisión nocturna dentro de un bar-café tecnológico. La identidad se obtiene del logo principal: fondo negro azulado, circuitos violetas/cian, acentos magenta, rojo/naranja, amarillo y verde neón.

## Reglas innegociables
- Ningún componente puede declarar colores de marca ad hoc. Debe usar variables CSS o tokens de `src/design-system`.
- Texto principal sobre panel oscuro: blanco cálido (`--text-1`).
- Texto secundario: lavanda grisácea (`--text-2`).
- Sobre superficies claras solo se permite texto oscuro; en esta versión no se usan cards blancas.
- El glow nunca reemplaza al contraste. Primero debe leerse sin sombra; luego se agrega el efecto.
- Los nombres de parejas no deben bajar de 18 px en escritorio ni de 16 px en móvil.
- En modo TV 16:9, títulos de ronda: 28–44 px; nombres de pareja: 20–30 px; etiquetas: 14–18 px.
- El ancho de texto se limita y usa elipsis para evitar romper el fixture.

## Tipografía
- Display y títulos: Barlow Condensed 700/800.
- Interfaz y nombres: Inter 500/600/700.
- Mayúsculas solo para títulos, rondas, estados y etiquetas. Los nombres conservan capitalización natural.

## Paleta
- Canvas: `#05040D`
- Panel: `#111024`
- Texto: `#FFF9FF`
- Violeta: `#9B4DFF`
- Magenta: `#FF2BC2`
- Cian: `#28D7FF`
- Rojo: `#FF3B46`
- Naranja: `#FF6A24`
- Amarillo: `#FFD43B`
- Verde de éxito: `#38F28A`

## Cards
- Superficies oscuras, nunca blancas.
- Borde de 1 px con gradiente o color neón de baja opacidad.
- Radio entre 14 y 22 px.
- Contraste mínimo visual equivalente a WCAG AA para texto normal.
- Estados: neutral, active, receiving, winner, disabled.

## Modo TV
- Layout diseñado prioritariamente para 1920×1080.
- La zona de revelación es fija y no superpone fixture.
- Evitar scroll vertical durante sorteo y eliminatorias en relación 16:9.
- Usar `clamp()` para escalar tipografía sin perder jerarquía.
