# Spec de rama — `feat/premium-tokens` (Fase B, PR 1: acabado por CSS)

Deriva de `docs/branches/feat/premium-design/{spec,auditoria}.md`. Solo v2 (`html[data-ui="v2"]`); v1 intacto. Autorizada por el usuario vía la sesión coordinadora (2026-11-19).

## Tokens exactos
| Token | Claro | Oscuro |
|---|---|---|
| Radios `--skin-radius-md/lg/xl/2xl/3xl` | 6 / 8 / 12 / 16 / 20 px (concéntricos: tarjeta 16 → ficha 12 → control 8; dock 20 → tecla 16) | igual |
| `--skin-shadow-xs/sm/card` (nivel 1, reposo) | anillo 1 px + contacto + difusión fría, 3 capas | anillo blanco 7–9 % + brillo superior 3 % |
| `--elev-2` (flotante), `--elev-3` (modal) | 3 capas transparentes con tinte frío | anillo blanco 10–12 % + brillo + sombra negra |
| Lienzo oscuro `--sunken-2` / tarjeta `--surface` | — | `12 14 17` / `22 25 30` (antes 26 29 34 / 20 22 26: la tarjeta quedaba más oscura que el lienzo) |
| Escala `--skin-type-8/9/10/11` | 10 / 10 / 11 / 12 px (antes 9/10/11/12) | igual |
| Movimiento | `--dur-fast/base/slow` 120/200/400 ms, `--ease-out`, `--press-scale` 0.97 | igual |

## Reglas (`skin-v2.css`)
Foco global 2 px (`--action`, excluye inputs), `text-wrap` balance/pretty, tracking y peso de rótulos contenidos, `shadow-lg/xl/2xl` → elev 2/3, `transition-all` acotado a propiedades de pintura, pulsación única 0.97, contorno neutro en mapas e imágenes.

## Trinquete
`npm run lint:motion` (`scripts/check-motion.mjs`, base en `motion-baseline.json`): `transition-all` no puede crecer; incluido en `verify` y CI.

## Fuera de este PR (siguientes PR de Fase B)
COL-1 (hex sueltos → tokens/`chartTheme.js`), COL-2/3 (paleta Forma validada con `dataviz`, unificar color por deporte), EST-1/2/3 (recetas Skeleton/EmptyState/ErrorState), RAD-4 (doble borde, pendiente de captura), TIP-3 fuente variable (pendiente de medida), migración de `transition-all` a `transition-[…]` en componentes.

## Verificación
CI (lint, lint:ui, lint:colors, lint:motion, vitest, build, E2E, style-diff). Los snapshots v2 que cambian a propósito se regeneran con el workflow `Update snapshots`.
