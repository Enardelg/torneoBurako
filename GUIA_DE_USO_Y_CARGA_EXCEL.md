# Guía de uso — Torneo de Burako Code Coffee

## 1. Resolución y proyección

La interfaz responde al **viewport efectivo del navegador**, no al tamaño físico del televisor.

Para un televisor Full HD de 1920×1080 con Chrome configurado al **125 %**, el viewport aproximado es **1536×864 CSS px**. El proyecto incluye una media query específica para esa combinación y ajustes adicionales para:

- Full HD a 100 %.
- Notebooks y proyectores con poca altura disponible.
- Tablets y teléfonos en orientación vertical u horizontal.
- Pantallas ultrawide o superiores a 2K.

En resoluciones compactas, los brackets conservan el orden del fixture mediante desplazamiento horizontal interno, evitando deformar las cards.

## 2. Formato del Excel

La aplicación lee **la primera hoja** del archivo. Los formatos admitidos son `.xlsx`, `.xls` y `.csv`.

La fila 1 debe tener estos encabezados:

| Pareja | Jugador 1 | Jugador 2 |
|---|---|---|
| Los Cafeteros | Ana Pérez | Luis Gómez |
| Doble Canasta | María Díaz | Carlos Ruiz |

Reglas:

- `Jugador 1` y `Jugador 2` son obligatorios.
- `Pareja` es opcional. Si está vacía, la aplicación genera `Pareja 1`, `Pareja 2`, etc.
- Cada fila representa una pareja.
- No colocar títulos antes de los encabezados.
- No usar celdas combinadas, subtítulos ni filas de totales dentro de la tabla.
- Se toleran variantes como `Equipo`, `Nombre de pareja`, `Nombre 1`, `Nombre 2`, `Jugador1`, `Jugador2`, `Integrante 1` e `Integrante 2`.

En la pantalla inicial está disponible el botón **Descargar plantilla**, que genera un Excel listo para completar.

## 3. Sonido

El botón con la nota musical activa o silencia los efectos del torneo.

El navegador exige una interacción del usuario para habilitar audio. Al pulsar **Iniciar sorteo por zonas**, la aplicación desbloquea el contexto de audio y utiliza efectos para:

- movimiento del bolillero;
- revelación de una pareja;
- avance de ronda;
- cierre de una zona;
- proclamación del campeón.

No depende de archivos MP3 externos: los efectos se generan con Web Audio API.

## 4. Pantalla completa

El botón de expandir solicita pantalla completa. Cuando el modo está activo, el icono cambia automáticamente por el de contraer. Al pulsarlo nuevamente, se vuelve a la ventana normal.

También se sincroniza si se sale con `Esc`.

## 5. Flujo del torneo

1. Importar el Excel o usar los datos demo.
2. Definir cantidad de zonas y parejas por zona. La capacidad debe coincidir exactamente con la cantidad importada.
3. Iniciar el sorteo. Las parejas se revelan una por zona en cada vuelta y entran animadas en su casillero.
4. En **Finales por zona**, seleccionar los ganadores de cada partido.
5. Cuando todas las zonas tengan campeón, habilitar la fase final.
6. Seleccionar ganadores de semifinales, final y campeón del torneo.
