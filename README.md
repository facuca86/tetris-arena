# Tetris Arena — Sunset 8BIT

Un Tetris clásico con estética retro 8-bit, fondos dinámicos y banda sonora en shuffle.
Funciona directamente en el navegador: abre `index.html` sin servidor ni build.

---

## Controles

### Teclado (escritorio)
| Tecla | Acción |
|-------|--------|
| ← → | Mover pieza |
| ↑ | Rotar |
| ↓ | Bajar suave |
| Espacio | Hard drop |
| C | Hold (guardar pieza) |
| P | Pausa / Reanudar |

### Pantalla táctil (móvil)
Los botones en pantalla replican todas las acciones. LEFT/RIGHT/SOFT tienen DAS (auto-repetición tras 200 ms).

---

## Características

- Piezas I J L O S T Z con rotación y wall-kick
- Ghost piece (sombra de caída)
- Hold piece [C]
- Progressive difficulty: sube de nivel cada 10 líneas
- Puntuación: 40 / 100 / 300 / 1200 × nivel para 1–4 líneas
- Animación de líneas completas (flash 250 ms)
- Popup de puntos flotantes al limpiar líneas
- Overlay de pausa
- High score guardado en localStorage
- Música en **shuffle** aleatorio con cambio de fondo por pista
- Controles: mute y saltar pista

---

## Música

Las pistas están en `assets/music/`:

1. *There Must Be an Angel* — Eurythmics
2. *Karma Police* — Radiohead
3. *Let It Be* — The Beatles
4. *Fanky* — (pista original)
5. *Enjoy the Silence* — Depeche Mode

---

## Estructura

```
tetris-arena/
├── index.html       — estructura y botones
├── style.css        — estilos (responsive, overlays, animaciones)
├── script.js        — lógica del juego, audio y controles
└── assets/
    ├── img/         — fondos 1–8 (.jpeg)
    ├── music/       — pistas 1–5 (.mp3)
    └── sfx/         — gameover.mp3
```
