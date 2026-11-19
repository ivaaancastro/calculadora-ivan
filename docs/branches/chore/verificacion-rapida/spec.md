# Spec — Verificación rápida por carriles

## 1. Identificación
- **ID:** `spec-verificacion-rapida`
- **Título:** Verificación local en dos carriles y delegación del trabajo pesado al CI
- **Autor:** agente (sesión `chore/verificacion-rapida`)
- **Fecha:** 2026-11-19
- **Estado:** en curso (spec aprobada; revisión v0.2 el mismo día: la verificación visual pesada se difiere al CI y al cierre de capa)

## 2. Objetivo
Reducir el coste de verificar cada PR (tiempo y carga de la máquina) sin perder cobertura: lo barato se corre en local; el E2E completo, el volcado «antes» y la regeneración de capturas pasan al CI o a un workflow manual con la imagen idéntica a la de CI.

## 3. Contexto y justificación
- Hoy cada `feat` repite en local un E2E Docker completo (`npm run test:e2e:docker`: 3 proyectos × todas las specs) y un `style-dump` completo del «antes» (develop) y del «después» (rama): 8 pantallas + 10 estados extra × 2 temas × 3 proyectos (desktop/mobile/tablet) ≈ 108 tests por volcado, con 2,5 s de espera de Recharts cada uno y estados `:hover/:focus/:active` forzados por CDP.
- El CI (`.github/workflows/ci.yml`) **ya** ejecuta en cada PR y push: `lint`, `lint:colors`, `lint:ui`, `test:coverage`, `build` y **E2E completo** en `mcr.microsoft.com/playwright:v1.61.1-noble` (workers 1, retries 2). Es decir, el E2E local duplica al CI. Lo que el CI **no** hace es `style-diff`.
- Con varias sesiones en paralelo la máquina llegó a carga ~480. El «mutex» `/tmp/forma-docker.lock` es hoy solo un fichero vacío por convención: ningún script lo toma (`scripts/e2e-docker.sh` no lo usa), y los volcados ni se enteran.
- Afecta a: `scripts/`, `.github/workflows/`, `package.json`, `AGENTS.md`, `MEMORY.md`, `docs/sdd/`. **No toca código de producción ni estilos.**

## 3 bis. Principio (v0.2)
**Local barato en cada feat; lo pesado, una vez y fuera de la máquina.** En cada feat solo se corre en local el carril rápido (lint, `lint:ui`, `lint:colors`, vitest, build), incluso si el PR toca estilos. El E2E completo y las capturas los hace el CI en cada PR (ya lo hace). El `style-diff` completo se ejecuta (a) automáticamente en el CI cuando el PR toca rutas de estilo y (b) una pasada completa manual al **cerrar cada capa** del rediseño. Un fallo se detecta en el PR en que aparece, no 10 PR después.

## 4. Validación de la propuesta del coordinador (qué es viable y qué se corrige)

| # | Propuesta | Veredicto | Corrección |
|---|-----------|-----------|------------|
| 1 | Dos carriles | Viable | La clasificación debe ser **automática y única** (un script que lee el diff contra `develop`), no a criterio de cada agente; la usan el local y el CI. |
| 2 | E2E local solo del spec afectado, `--workers=2` | Viable | Hoy `workers` solo está fijado en CI (`1`); en local es «todos los núcleos» (causa de la carga). Se limita por defecto a 2 en el script Docker. Además `--project=` para no correr los 3 tamaños. |
| 3 | «Antes» de `develop` calculado una vez | Viable con **artifact, no caché** | La caché de Actions no se puede descargar con `gh` desde local; un artifact sí. Se publica en cada push a `develop` (clave = SHA) y el PR lo descarga por el SHA base del PR (`pull_request.base.sha`, que es contra lo que GitHub construye el merge). Si falta (caducado, develop aún sin su job), el propio job lo regenera en un checkout del SHA base. Tamaño: **no medido** (ver §8 y T1); ~108 JSON por volcado, comprimen muy bien; se mide antes de fijar retención. |
| 4 | `style-diff` en CI solo si el diff toca rutas de estilo | Viable | Filtro por script propio (`changed-lane`), sin acción de terceros. Rutas «de estilo» = CSS, `.jsx/.js` bajo `src/` (las clases Tailwind viven en JSX), `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/styles/**`, `e2e/support/**`, `e2e/tools/**`, `scripts/style-diff.mjs`. Se prefiere el falso positivo al falso negativo: cualquier `.jsx/.css` dispara. Solo se salta en lógica pura (`utils`, `services`, `store`, `__tests__`, docs). |
| 5 | Workflow manual que regenera snapshots | Viable con un punto a decidir | Hay que añadir `workflow_dispatch`, permisos `contents: write` y commitear a la rama del PR. **Los pushes hechos con `GITHUB_TOKEN` no disparan el CI**: hace falta un PAT/deploy key (decisión D3) o relanzar el CI a mano. Solo ramas del propio repo; nunca `main`/`develop`. Usa la misma imagen y versión de Playwright que el job `e2e`. |
| 6 | Mutex y anti-solapes | Viable, hoy **no existe** | Se implementa de verdad (directorio atómico `mkdir` con PID y detección de bloqueo caducado; macOS no trae `flock`) y se aplica a Docker, volcados y `verify`. Más una guarda de carga: no arranca trabajo pesado si `loadavg(1m) > umbral`. |
| 7 | Actualizar `AGENTS.md` y plantilla | Viable | §8.6 dice hoy «E2E Docker y capturas se ejecutan en el momento que toca, sin aplazarlos por cuota»: **contradice** la nueva regla y se reescribe (el resto de §8 no cambia). Se tocan también `MEMORY.md` §2 («capturas solo en Docker»), `docs/sdd/plantilla-especificacion.md` §7 y `guia-sdd.md` paso 4. |

Cobertura: el CI sigue ejecutando el E2E completo y las capturas en **cada** PR (esa parte no se recorta), así que no se pierde ninguna comprobación; lo que se pierde es el aviso temprano local de los E2E, compensado por `verify --e2e <spec>` bajo demanda y por el workflow de capturas.

## 5. Requisitos funcionales
- [ ] **RF1 Clasificador.** `node scripts/changed-lane.mjs [--base develop]` imprime `fast` o `visual` (y la lista de pantallas/specs afectadas) a partir de `git diff --name-only <merge-base>...HEAD`. Reglas en un único módulo con tests unitarios. Salida de GitHub Actions (`visual=true|false`) con `--github-output`.
- [ ] **RF2 `npm run verify`.** Ejecuta el carril detectado, en orden y en silencio (resumen o fallo, AGENTS §8.3): `lint`, `lint:ui`, `lint:colors`, `vitest run`, `build`; `--style-diff [pantallas]` (opcional, bajo demanda) añade el `style-diff` parcial local; por defecto **ni siquiera el carril visual lo ejecuta en local**. Imprime la duración de cada paso y el total. Opciones: `--lane fast|visual`, `--e2e <spec>`, `--project <p>`.
- [ ] **RF3 E2E local acotado.** `scripts/e2e-docker.sh` toma el mutex, usa `--workers=2` por defecto (sobrescribible) y acepta `--project`. El E2E completo local deja de ser obligatorio; solo se corre el spec afectado y solo si hay que regenerar capturas.
- [ ] **RF4 `style-diff` parcial.** `style-diff.mjs` admite `--only a,b` (filtra por nombre de pantalla/estado); el volcado admite el mismo filtro vía `STYLE_DUMP_ONLY` (equivale a `--grep`). El modo completo y el código de salida 1 se mantienen.
- [ ] **RF5 Baseline de develop.** Job `style-baseline` en push a `develop`: genera el volcado con el workers de §8, lo comprime y lo sube como artifact `style-dump-<sha>`. `scripts/fetch-style-baseline.sh <sha>` lo descarga (`gh run download`) para uso local y de CI, con regeneración si falta.
- [ ] **RF6 Job `style-diff` en CI.** En PR, solo si `changed-lane` da `visual=true`: descarga el baseline del SHA base, genera el «después», ejecuta `style-diff` completo y falla si hay diferencias (v1 protegido). Sube los JSON de diferencias como artifact si falla.
- [ ] **RF7 Workflow `update-snapshots`.** `workflow_dispatch` con input `branch`; checkout de esa rama, imagen `mcr.microsoft.com/playwright:v1.61.1-noble` (versión leída de `package.json`, no escrita dos veces), `playwright test --update-snapshots` (opcional `--grep`/spec), commit `test(e2e): regenerar capturas` con rutas explícitas bajo `e2e/__screenshots__/`, push a esa rama. Rechaza `main`/`develop`.
- [ ] **RF8 Mutex y guarda de carga.** `scripts/heavy-lock.sh` (`acquire`/`release`/wrapper `run`): una sola tarea pesada local a la vez (Docker, volcados, `verify --e2e`), espera con timeout y mensaje de quién la tiene; guarda de `loadavg`. Sustituye al fichero vacío `/tmp/forma-docker.lock`.
- [ ] **RF8 bis Pasada de cierre de capa.** `npm run verify:layer` ejecuta bajo mutex el `style-diff` completo (baseline de `develop` descargado + «después» local o del artifact de la rama) y la regeneración/comparación de capturas necesarias; se corre una vez al cerrar cada capa y su resultado se anota en el `tasks.md` de cierre.
- [ ] **RF9 Reglas anti-solapes** documentadas: puertos `E2E_PORT` distintos por sesión, una sola tarea pesada a la vez (el mutex lo impone), no lanzar dos `verify` a la vez en el mismo worktree.
- [ ] **RF10 Documentación.** `AGENTS.md` (nueva §8 bis «Verificación por carriles»; §8.6 reescrita), `MEMORY.md` §2, plantilla (campo «Carril de verificación: fast | visual» en §7), `guia-sdd.md`.

## 6. Criterios de aceptación
- [ ] **Cobertura intacta:** el CI sigue ejecutando lint, `lint:colors`, `lint:ui`, `test:coverage`, `build` y E2E completo en todo PR (diff de `ci.yml` lo demuestra; solo se **añaden** jobs).
- [ ] **v1 protegido:** un PR de prueba que cambia una clase/color en JSX hace fallar el job `style-diff`; un PR de prueba de solo docs/`utils` lo salta; en ambos casos el resultado coincide con el de correr a mano el procedimiento actual (completo) sobre el mismo diff.
- [ ] **Medible (local, mismo equipo, misma rama de referencia):** tiempo total de verificación local y pico de `loadavg` medidos **antes** (procedimiento actual completo) y **después**:
  - carril rápido: ≤ 3 min y ≥ 85 % menos que hoy;
  - carril visual local (sin `style-diff` ni E2E): igual que el rápido, ≥ 85 % menos que hoy; pasada `verify:layer`: una por capa, medida y anotada;
  - pico de carga con 3 sesiones lanzando `verify` a la vez: sin pasar del umbral de la guarda (el mutex serializa lo pesado).
- [ ] **Mutex probado:** dos invocaciones simultáneas de `heavy-lock.sh run` se serializan; un bloqueo con PID muerto se recupera.
- [ ] **Baseline:** el PR de prueba descarga el artifact del SHA base y no regenera «antes»; con el artifact borrado, regenera y pasa igualmente.
- [ ] **Snapshots:** el workflow `update-snapshots` ejecutado sobre una rama de prueba produce capturas que el job `e2e` del CI acepta sin diferencias (sin Docker local).
- [ ] `npm run lint`, `lint:ui`, `lint:colors`, vitest y build verdes; CHANGELOG y MEMORY actualizados.

## 7. Diseño técnico
- **Nuevos:** `scripts/changed-lane.mjs`, `scripts/verify.mjs`, `scripts/heavy-lock.sh`, `scripts/fetch-style-baseline.sh`, `.github/workflows/update-snapshots.yml`, tests `src/__tests__/unit/changedLane.test.js`.
- **Modificados:** `scripts/e2e-docker.sh`, `scripts/style-diff.mjs` (`--only`), `e2e/tools/style-dump.spec.js` (filtro `STYLE_DUMP_ONLY`, sin cambiar el volcado), `playwright.config.js` (`workers` local = 2 vía `E2E_WORKERS`; CI sin cambios), `.github/workflows/ci.yml` (+`changes`, +`style-baseline`, +`style-diff`; `workflow_dispatch`), `package.json` (`verify`, `verify:visual`), `AGENTS.md`, `MEMORY.md`, `docs/sdd/*`.
- **Sin tocar:** `src/**`, tokens, capturas existentes, `lint:*`.
- Los volcados comparan valores calculados, no píxeles, por lo que **no dependen del SO**: pueden generarse en el runner del CI y compararse con otros generados en local si hiciera falta.
- Versión de Playwright única: el workflow nuevo y `e2e-docker.sh` la leen de `@playwright/test/package.json`; el `container.image` de `ci.yml` ya la escribe a mano (mantener sincronizado: nota en el plan).

## 8. Riesgos
| Riesgo | Mitigación |
|--------|-----------|
| CI más lento: el volcado va con workers 1 y 108 tests × ≥ 4 s | Job `style-diff` en paralelo al `e2e` (necesita solo `lint`), workers 4 en ese job (`E2E_WORKERS`), `retries 0`; medir en T1; si > 15 min, dividir por proyecto (matriz desktop/mobile/tablet). |
| Coste de minutos de Actions (+1 volcado «después» por PR visual, +1 baseline por push a develop, +1 regeneración si falta baseline) | Solo PR visuales; baseline único por SHA; matriz solo si hace falta. Dato pendiente: si el repo es público (minutos gratis) o privado → D2. Estimación inicial a validar en T1, no un hecho. |
| Almacenamiento de artifacts (cuota compartida con `playwright-report`, 30 días) | Retención 3–5 días, `tar.gz`, medir tamaño real antes (T1) y decidir; el baseline se regenera si caduca. |
| Snapshots divergentes (local macOS/Docker vs CI vs workflow) | Una sola fuente de verdad: el workflow y el CI usan la misma imagen; `test:e2e:docker` se mantiene como alternativa equivalente. Prohibido commitear capturas generadas fuera de Linux/imagen oficial. |
| El commit del workflow no relanza el CI | PAT/deploy key (D3) o `gh workflow run ci.yml --ref <rama>` con `workflow_dispatch` en `ci.yml` (el resultado no sale como check del PR). |
| Clasificador con falsos negativos (PR «lógica» que cambia clases) | Regla conservadora (todo `.jsx/.css` = visual) y el CI protege igualmente: el E2E visual completo sigue corriendo siempre. |
| Pérdida del aviso temprano local | `verify --e2e <spec>` y el workflow de capturas; el agente puede pedir pasar a carril visual con `--lane visual`. |
| Mutex huérfano si se mata el proceso | PID en el lock + recuperación si el PID no existe; timeout de espera configurable. |

## 9. Pruebas
- **Unitarias:** `changed-lane` (tabla ruta → carril, límites: `src/components/ui`, `*.css`, `docs/**`, mezcla), parser de `--only` de `style-diff`.
- **Integración/scripts:** simulación de dos `heavy-lock run` concurrentes y de lock huérfano (script shell temporal, no E2E).
- **CI:** PR de prueba visual y PR de prueba solo-docs (se cierran sin merge).
- **E2E:** sin specs nuevas; las existentes no cambian.

## 10. Decisiones a aprobar
- **D1.** Clasificación automática con regla conservadora (todo `.jsx/.css` ⇒ visual).
- **D2.** ¿El repo es público o privado (coste de minutos)? Condiciona si el job `style-diff` puede ir en matriz de 3 proyectos.
- **D3.** Cómo se relanza el CI tras el commit del workflow de capturas: PAT/deploy key como secreto (recomendado) o relanzar a mano.
- **D4.** El E2E del CI se mantiene completo en todo PR (no se filtra por paths) y solo se filtra `style-diff`.
- **D5.** Reescribir AGENTS §8.6 y crear una §8 bis; confirmar que el E2E completo local deja de ser obligatorio.
- **D6.** Umbral de la guarda de carga (propuesta: `loadavg(1m)` > 2× núcleos).
- **D7 (v0.2, aprobada).** Verificación visual diferida: en cada feat solo carril rápido local; `style-diff` en CI por paths y pasada completa al cerrar cada capa.

## 11. Notas adicionales
- Fuera de alcance: partir el E2E del CI en shards, caché de Playwright, cambios en el volcado `full` de Capa 2.
- No se tocan las ramas de las sesiones en curso (borrar actividad, coach insights).

---
Versión: 0.2.0 — 2026-11-19
