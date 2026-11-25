# Tasks — Objetivos táctiles v2

Spec y plan aprobados por el usuario.

- [x] 1. Línea base: `TOUCH_UI=v2 npx playwright test e2e/touch.spec.js --project=mobile` (informe y desborde por pantalla).
- [x] 2. Cabecera (perfil, tema, «Conectar»): `skin-v2.css`, bloque «Objetivos táctiles».
- [x] 3. Selectores de rango (Dashboard `data-dash="range-btn"`; Rendimiento `[data-skin="stats"] button[aria-pressed]`).
- [x] 4. Actividades (buscador, selects, `data-history="add"`).
- [x] 5. Perfil «Volver».
- [x] 6. Medida después: 0 controles < 44 px en dashboard, rendimiento, calendario, actividades y salud; desborde 0 en las 8.
- [x] 7. lint, lint:colors (sin subir), lint:ui, vitest (264), build.
- [x] 8. `style-diff` origin/develop vs rama: 104 volcados, 0 diferencias (v1 intacta).
- [x] 9. E2E Docker: 220 OK; solo fallaron las 14 capturas v2 móviles (cabecera), regeneradas. **D7: pendiente de revisión del usuario, una a una.**
- [x] 10. CHANGELOG, MEMORY, PR a develop (sin mergear).

## Antes → después (390 px, v2)
| Control | Antes | Después |
|---|---|---|
| Menú de perfil | 136×36 | ≥ 44 alto |
| Botón de tema | 36×36 | 44×44 |
| «Conectar» | 100×32 | ≥ 44 alto (se anula `scale-90`) |
| Rango Dashboard | 83×30 | ≥ 44 alto |
| Rango Rendimiento | 48–57×27 | ≥ 44 alto |
| Buscador / deporte / periodo | 36 / 32 / 32 | 44 |
| «+ Añadir manual» | 135×35 | ≥ 44 alto |
| Perfil «Volver» | 18×18 | 44×44 |

Fuera de alcance (siguen < 44): «Saltar al contenido» (1×1, solo foco), «Leaflet» 49×14, inputs de Perfil.
