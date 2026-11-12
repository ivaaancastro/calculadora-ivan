# Plan — rama `feat/ui-skin-v2-extension` (PR 6)

Derivado de `spec.md` y de `docs/branches/feat/ui-skin-v2/plan.md` (PR 6). Un PR, un commit por pantalla, v1 siempre con 0 diferencias.

## 1. Pasos
1. **Ámbito genérico.** Selectores de `tokens.css` y `skin-v2.css` a `[data-skin]` (sin cambiar valores); comprobar que el volcado de Dashboard y Calendario sigue idéntico y `check-palette.mjs` verde.
2. **Por pantalla** (cada una: `data-skin` + `ChartSkinProvider` si tiene gráficas + capturas de v2 de esa pantalla):
   1. Perfil (formularios; valida las primitivas bajo v2).
   2. Actividades (`/history`).
   3. Rendimiento (`/stats`: tarjetas FTP, MMP, potencia, volumen).
   4. Salud (`HealthPage`, gráficas de biomarcadores).
   5. Detalle de actividad (mapa, gráficas, cabecera propia con `z-50`/`glass-nav`: no se altera).
3. **`chartTheme` completo (D-10).** Valores `.dark` propios para `zones`, `sports`, `distribution`, `map` y anatomía; extender `chartTheme.test.js`.
4. **Colores de categoría y métrica (D-07/D-09)** en lo que toquen las 5 pantallas; escalas ordinales solo si D9 lo exige.
5. **Pager móvil:** revisar la altura por pestaña bajo v2.
6. **Verificación** (abajo) y registro: `CHANGELOG.md`, `MEMORY.md` (rama actual, que hoy dice `feat/ui-skin-v2-visual`, y estado de PR 6), `tasks.md`.

## 2. Verificación
```bash
node scripts/check-palette.mjs
npm run lint && npm run lint:colors && npm run lint:ui
npm run test:unit && npm run test:integration
npm run build
npx playwright test                 # macOS
npm run test:e2e:docker             # capturas (solo Docker)
```
Volcado `develop` vs rama (en serie, `develop` en `wt-develop` con `E2E_PORT=5274`) con `STYLE_DUMP_PROPS=full` y `node scripts/style-diff.mjs`: **0 diferencias**.
Referencia de partida (fin del PR 5): unit 192, integración 10, E2E macOS 109 ✓, Docker 205 ✓, táctil 113, `lint:colors` 756/3/100/9/168, `lint:ui` 14.

## 3. Paradas de aprobación
1. **Este `spec.md` y `plan.md`** (antes de `tasks.md` y de cualquier código) — **ahora**.
2. **Capturas de v2 de las 5 pantallas** (claro/oscuro/móvil/tablet) revisadas una a una antes de abrir/mergear el PR.
3. Merge: solo con autorización explícita.

## 4. Riesgos
| Riesgo | Mitigación |
|---|---|
| `[data-skin]` genérico filtra la piel a una pantalla no prevista | Volcado de v1 = 0 y capturas de la landing de v2 idénticas a v1 |
| Detalle (1.017 líneas, mapa) y Salud (964) con muchos colores sueltos | Un commit por pantalla; `lint:colors` sin subir |
| Capturas de v2 numerosas | Comparar por píxeles; leer solo las que cambian a propósito, una a una |
