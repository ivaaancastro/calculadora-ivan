# Medidas — Bloque A (2026-11-19)

## Hechos medidos
| Dato | Valor | Fuente |
|------|-------|--------|
| Visibilidad del repo | **Público** (`ivaaancastro/calculadora-ivan`) | `gh repo view` |
| Duración del job `e2e` en CI (workers 1, retries 2) | **18 min 45 s** (run 44369855944, push a `develop`) | `gh run view` |
| Duración de `lint` / `test` / `build` en CI | 26 s / 37 s / 26 s | idem |
| CI total (camino crítico lint→test→e2e) | ≈ 20 min | idem |
| Artifact `playwright-report` | ≈ 360 KB cada uno | `gh api …/artifacts` |
| Volcado de estilos, 1 archivo (dashboard, desktop) | **≈ 240 KB** JSON | local, 4 archivos medidos |
| 4 archivos comprimidos (`tar czf`) | **18,9 KB** (≈ 4,7 KB/archivo, ratio ≈ 50:1) | local |
| Extrapolación de 108 archivos | ≈ 26 MB sin comprimir, **≈ 0,5–1 MB** comprimidos (estimación, no medido en conjunto) | cálculo |
| Volcado local, 4 tests desktop, 1 worker | 68 s ≈ 17 s/test **con carga de máquina 73–94 (8 núcleos)** | local |

## Qué NO se midió y por qué
- **Línea base local del procedimiento completo** (E2E Docker completo + 2 volcados): la máquina tenía `loadavg` ≈ 80–95 con 8 núcleos (otras sesiones). Un tiempo así no es comparable y lanzar 3 corridas pesadas más habría agravado la carga. **Se mide cuando `loadavg(1m)` < 8**, con la misma rama de referencia antes y después (T9); hasta entonces, la referencia de «antes» del E2E es el tiempo de CI (18 min 45 s).
- Los 17 s/test del volcado están inflados por la carga; sin ella se esperan bastantes menos. No usar como referencia.

## Consecuencias para el diseño (T1)
- **D2 resuelto: repo público ⇒ minutos de Actions gratis.** El coste de minutos deja de ser un riesgo; el único límite es el tiempo de espera de la PR.
- **Artifacts:** ≈ 1 MB por volcado ⇒ almacenamiento irrelevante. Retención **7 días** para el baseline (sobra) sin riesgo de cuota.
- **Tiempo del job `style-diff` en CI:** con 108 tests y `workers 1` se acercaría a los ~19 min del E2E. Decisión: **workers 4** y `retries 0` en ese job (runner de 4 vCPU en repos públicos); sin matriz por proyecto en la primera versión. Si en T9 supera 10 min, se parte en matriz de 3 (desktop/mobile/tablet), cosa que el repo público permite sin coste.
- El job `style-diff` corre en paralelo al `e2e` (depende solo de `lint`), por lo que no alarga el camino crítico mientras dure menos que el E2E.
