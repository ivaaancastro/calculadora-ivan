# Especificación SDD — rama `feat/ui-skin-v2` (piel v2 de la Capa 3)

## 1. Identificación
- **ID:** `spec-rediseno-02-c3-skin` (extensión operativa de `spec-rediseno-02-c3`)
- **Título:** Piel v2 tras `html[data-ui="v2"]`: mecanismo de activación, dirección visual y extensión
- **Autor:** agente OpenCode
- **Fecha:** 2026-11-11
- **Estado:** PR 4 implementado y verificado (2026-11-11); pendiente de PR y de los PRs 5–7.
- **Spec de la capa:** `docs/branches/feat/ui-shell/spec.md` — **no se duplica**. Esta carpeta solo detalla lo que la capa dejó abierto (RF9–RF11 y D7) y cómo se implementa en esta rama.
- **Plan de la capa:** `docs/branches/feat/ui-shell/plan.md` (PRs 4–7).
- **Depende de:** `feat/ui-shell` cerrada y mergeada en `develop` (`d0c8329`, PRs #70–#72): la estructura, la red de capturas de v1 y la escala `--z-*` ya están en su sitio.

## 2. Objetivo
Encender una piel v2 **detrás de un atributo** (`html[data-ui="v2"]`) que se pueda activar por entorno y por `localStorage`, con conmutador en Ajustes y sin recargar ni perder sesión ni datos; y definir esa piel (tipografía, radios, paleta y gráficas) sobre Dashboard y Calendario primero, con parada de aprobación antes de extenderla.

El PR 4 (mecanismo) **no pinta nada**: su entrega es la red que demuestra que v1 sigue congelada y que v2 arranca idéntica a v1.

## 3. Contexto y justificación

### 3.1 Punto de partida
- La estructura de la Capa 3 está cerrada: `--nav-h` = 60 px, escala de capas `--z-*`, cabecera ligera y capturas de v1 regeneradas una sola vez en el PR 2 (D1). Desde entonces **v1 está congelada**: 0 diferencias de volcado en cada PR.
- En `src/styles/tokens.css` hay un hueco reservado para `html[data-ui="v2"]` (escala de texto, radios, paleta). Está **vacío** y `data-ui` no lo escribe nadie.
- No existe ninguna captura de v2. Sin ella, la piel no tendría red y volvería el problema que la Capa 0 resolvió para v1.
- El cambio de tema ya sigue el patrón que hace falta: script en línea en `index.html` antes del primer pintado + hook global con suscriptores (`src/hooks/useTheme.js`).

### 3.2 Qué deja abierto la capa (RF9–RF11)

| Requisito de la capa | Estado | Qué falta |
|---|---|---|
| RF9. Activación de v2 por `VITE_UI` y `localStorage`, antes del primer pintado, con cambio en caliente | abierto | hook, script de arranque, conmutador |
| RF10. v1 congelada (sin `data-ui` o distinto de `v2`, 0 diferencias) | abierto | el mecanismo que lo garantiza (hoy v1 no se puede comparar contra v2 porque no hay v2) |
| RF11. v2 con red propia (8 pantallas × 2 temas × 3 tamaños) | abierto | `e2e/visual-v2.spec.js` y sus 48 referencias |

### 3.3 Decisiones que se cierran con esta rama
- **D8 (cerrada el 2026-11-11, con la aprobación «D1–D8» del 2026-11-10):** el conmutador vive en **Ajustes → General** y es visible para todos mientras v2 sea una vista previa. Alternativa descartada: solo por entorno (dejaría la vista previa fuera del alcance de quien no despliega).
- **D7 (abierta):** la dirección visual se elige sobre **Dashboard y Calendario** en el PR 5 y se para para aprobación antes de extender. Esta rama no la decide por su cuenta.

### 3.4 Decisiones de mecanismo de esta rama
- **M1. `localStorage` gana sobre `VITE_UI`.** Orden: `localStorage.getItem('ui') || VITE_UI || 'v1'`. Es lo único que permite **apagar** v2 en un despliegue con `VITE_UI=v2`, y lo que exige el criterio «apagar v2 devuelve a v1 sin recargar».
- **M2. En v1 el atributo está ausente**, no vale `"v1"`. Así el selector de la piel es `html[data-ui="v2"]` y cualquier valor desconocido cae en v1 por construcción.
- **M3. Las capturas de v2 tienen carpeta propia** (`e2e/__screenshots__/visual-v2.spec.js/`) y, en el PR 4, deben ser **idénticas a las de v1**: si el mecanismo pinta algo, se ve en el mismo PR. A partir del PR 5 divergen a propósito y se revisan una a una.
- **M4. El conmutador es el único cambio de v1 en esta rama (aprobado el 2026-11-11).** Una fila nueva en Ajustes → General necesariamente cambia la captura de `perfil`: es el control que enciende v2, no piel. Se regeneraron y revisaron las 6 capturas afectadas (3 tamaños × 2 temas) y la diferencia entre v1 y v2 quedó confinada al propio control (bbox 52×31 px). Alternativas descartadas: moverlo a Seguridad y Datos (v1 intacta, peor sitio) o dejarlo solo por entorno (revierte D8).

## 4. Requisitos funcionales

Los RF9–RF11 de la capa se conservan tal cual. Esta rama los concreta:

- [x] **RF9.1 Arranque sin parpadeo.** `index.html` aplica `data-ui="v2"` en un script en línea **antes del primer pintado**, con el mismo patrón que el tema. Sin `localStorage`, manda `VITE_UI`; sin variable, v1. *(PR 4, probado con sonda en el primer frame.)*
- [x] **RF9.2 Cambio en caliente.** `useUiMode()` devuelve `{ ui, isV2, setUi, toggleUi }`, escribe/retira el atributo y `localStorage`, y avisa a todos los suscriptores. **No recarga, no remonta la app, no repite peticiones y no toca la sesión.** *(PR 4, `e2e/ui-mode.spec.js`.)*
- [x] **RF9.3 Conmutador accesible.** «Vista previa v2» en Ajustes → General, con `role="switch"`, `aria-checked`, etiqueta asociada y objetivo táctil ≥ 44 px. Refleja el estado real (también si v2 llegó por entorno). *(PR 4; el informe táctil sigue en 113.)*
- [x] **RF10.1 v1 intacta.** Con `data-ui` ausente: volcado de estilos frente a `develop` **0 diferencias** y las 48 capturas de v1 **sin cambios**. *(PR 4, con la excepción M4: las 6 capturas de perfil y 104 diferencias del volcado son la fila nueva del conmutador, ninguna de color, tipografía, sombra o `z-index`.)*
- [x] **RF10.2 v2 vacía en el PR 4.** Las 48 capturas de v2 son idénticas a las de v1 (misma sesión, mismos datos, misma fecha fija): la prueba de que el mecanismo no pinta nada. *(PR 4: 42/48 byte a byte; las 6 de perfil solo difieren en el estado del conmutador, bbox 52×31 px.)*
- [x] **RF11.1 Red de v2.** Existe `e2e/visual-v2.spec.js` con las mismas 8 pantallas × 2 temas × 3 tamaños que v1, corriendo en los tres proyectos de Playwright. *(PR 4.)*
- [x] **RF11.2 Sin duplicar la captura.** La preparación de la captura (expansión del pager en móvil, ocultación de ruido, `settleForScreenshot`) es **una sola** para v1 y v2, para que las dos redes no deriven por separado. *(PR 4: `e2e/support/visual.js`.)*
- [ ] **RF12 (de la capa). Sin cambios de lógica:** no se tocan `src/services`, `src/store`, `src/utils` ni `src/supabase.js`. La piel es CSS y atributos.
- [ ] **RF13 (de la capa). Accesibilidad conservada:** no desaparece ningún `aria-label`/rol que usen los E2E; el control nuevo cumple 4.1.2 (nombre, rol, estado).

## 5. Criterios de aceptación

### Del PR 4 (mecanismo) — **hecho el 2026-11-11**
- [x] `localStorage ui=v2` antes de cargar deja `data-ui="v2"` **en el primer frame** (probado, no supuesto).
- [x] `VITE_UI=v2` sin `localStorage` deja `data-ui="v2"`; con `localStorage ui=v1`, manda `localStorage` (M1). Comprobado a mano y anotado en el PR.
- [x] El conmutador enciende y apaga v2 **sin recargar**, actualiza `localStorage`, conserva la sesión y **no repite** las peticiones de actividades.
- [x] Tras recargar, el estado del conmutador es el que se dejó.
- [x] Con v2 activa, `data-ui` **no** aparece en v1 y el atributo es exactamente `"v2"` (no `data-ui="true"` ni `"v1"`).
- [x] `node scripts/style-diff.mjs <develop> <rama>` = **0 diferencias**. *(Excepción M4: 104 diferencias, todas en los 6 estados de `perfil`, todas del conmutador, ninguna de color/tipografía/sombra/`z-index`.)*
- [x] Las 48 capturas de v1 **no cambian**; las 48 de v2 se generan en Docker y son **idénticas** a las de v1 (`cmp` archivo a archivo; si el PNG no fuera byte a byte, diff de píxeles = 0). *(M4: 42/48 byte a byte; las 6 de perfil solo difieren en el conmutador.)*
- [x] Unitaria nueva (`uiMode.test.js`): aplica, retira y sincroniza suscriptores.
- [x] `lint`, `lint:colors` (no sube), `lint:ui` (14), `test:unit`, `test:integration`, `build`, E2E macOS y Docker en verde, con los números copiados en el PR.

### De la rama (PRs 5–7)
- [ ] La dirección visual (PR 5) se presenta sobre Dashboard y Calendario **antes** de extenderla y la aprueba el usuario (D7).
- [ ] La paleta v2 pasa `validate_palette.js` en claro y oscuro (hoy `#eab308` falla con 1,87:1).
- [ ] Las gráficas tienen valores `.dark` propios (D-10) y las escalas ordinales solo si la dirección las pide.
- [ ] Al cerrar: v1 y v2 comparan sin diferencias cada una contra su referencia, y `MEMORY.md`, `CHANGELOG.md`, `paridad.md` y el roadmap quedan actualizados.

## 6. Diseño técnico

### 6.1 Archivos del PR 4

| Archivo | Cambio |
|---|---|
| `src/hooks/useUiMode.js` | **Nuevo.** Estado global fuera del hook (como `useTheme`), suscriptores, lectura inicial del atributo ya aplicado y `setUi`/`toggleUi` |
| `index.html` | Script en línea de `data-ui` justo después del de tema, con `%VITE_UI%` (sustitución de entorno de Vite en HTML) |
| `src/components/pages/ProfilePage.jsx` | Fila «Vista previa v2» en General, con `role="switch"` |
| `e2e/support/mockApp.js` | Opción `ui` en `setupApp` (escribe `localStorage.ui` en el init script, antes de cualquier script de página) |
| `e2e/support/visual.js` | **Nuevo.** Captura compartida por `visual.spec.js` y `visual-v2.spec.js` (RF11.2) |
| `e2e/visual.spec.js` | Pasa a usar `e2e/support/visual.js`; **comportamiento idéntico** (0 capturas cambiadas) |
| `e2e/visual-v2.spec.js` | **Nuevo.** Mismas pantallas con `ui: 'v2'` |
| `playwright.config.js` | `VISUAL_SPECS`/`TABLET_SPECS` incluyen `visual-v2`, para que corra también en móvil y tablet |
| `e2e/ui-mode.spec.js` | **Nuevo.** Arranque, cambio en caliente, persistencia |
| `e2e/__screenshots__/visual-v2.spec.js/**` | **Nuevo.** 48 referencias (Linux) |
| `src/__tests__/unit/uiMode.test.js` | **Nuevo.** Con `@vitest-environment jsdom` (la carpeta de unit corre en `node`) |
| `.env.example` | `VITE_UI` documentada como opcional |
| `docs/branches/feat/ui-skin-v2/` | `spec.md` (este), `plan.md` y `tasks.md` |

### 6.2 `useUiMode` (esbozo)

```js
const UI_KEY = 'ui';
const V2 = 'v2';

// El atributo ya lo puso index.html antes del primer pintado: es la fuente de verdad.
const readInitial = () =>
  document.documentElement.dataset.ui === V2 ? V2 : 'v1';

let globalUi = typeof document === 'undefined' ? 'v1' : readInitial();
const listeners = new Set();

const applyUi = (ui) => {
  const root = document.documentElement;
  if (ui === V2) root.dataset.ui = V2;
  else delete root.dataset.ui;            // M2: en v1 no queda atributo
  try { localStorage.setItem(UI_KEY, ui); } catch { /* storage no disponible */ }
};

export const useUiMode = () => {
  const [ui, setUiState] = useState(globalUi);
  useEffect(() => { listeners.add(setUiState); return () => listeners.delete(setUiState); }, []);
  const setUi = useCallback((next) => {
    const value = (typeof next === 'function' ? next(globalUi) : next) === V2 ? V2 : 'v1';
    globalUi = value;
    applyUi(value);
    listeners.forEach((listener) => listener(value));
  }, []);
  return { ui, isV2: ui === V2, setUi, toggleUi: useCallback(() => setUi(globalUi === V2 ? 'v1' : V2), [setUi]) };
};
```

- **No** se usa `VITE_UI` dentro del hook: el valor de entorno ya lo resolvió `index.html`. Una sola fuente de verdad.
- `setUi('v1')` escribe `localStorage='v1'` a propósito (M1): así se apaga v2 en un despliegue con `VITE_UI=v2`.
- No hay `storage` listener entre pestañas: `useTheme` tampoco lo tiene y el alcance es una pestaña (documentado como no-objetivo).

### 6.3 `index.html`

```html
<script>
  (function () {
    var stored = localStorage.getItem('ui');
    var ui = stored || '%VITE_UI%';
    if (ui === 'v2') document.documentElement.dataset.ui = 'v2';
  })();
</script>
```

- `%VITE_UI%` es la **sustitución de variables de entorno en HTML** de Vite: se resuelve en `dev` y en `build`. Si la variable no existe, el placeholder queda literal y no coincide con `'v2'` (v1). El build de Vercel puede fijarla sin tocar código.
- `localStorage` puede lanzar en modo privado: el script del tema tampoco lo protege; se mantiene igual (una línea, mismo riesgo ya asumido).
- Va **después** del script del tema y **antes** de las fuentes: nada de lo que se pinta depende de la red.

### 6.4 Conmutador (Ajustes → General)

Nueva sección «Apariencia» al final de General, con el patrón visual existente (`SectionHeader` + `Card divided`):

```jsx
<button
  type="button"
  role="switch"
  aria-checked={isV2}
  onClick={() => setUi(isV2 ? 'v1' : 'v2')}
  className="w-full min-h-[44px] p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left"
>
  <span>
    <span className="block text-xs sm:text-sm font-semibold text-ink">Vista previa v2</span>
    <span className="block text-[10px] text-ink-4">Piel nueva, todavía en pruebas. No cambia tus datos.</span>
  </span>
  <span aria-hidden="true" className={/* pista + bola con tokens */} />
</button>
```

- El `role="switch"` va en **toda la fila**: el objetivo táctil es la fila entera (≥ 44 px), no la pista de 51×31.
- La pista y la bola se pintan con tokens de superficie/acción; **no** se introducen colores nuevos (`lint:colors` no debe subir).
- Nombre accesible = «Vista previa v2»; el estado lo lleva `aria-checked`.

### 6.5 Pruebas

| Prueba | Qué fija |
|---|---|
| `uiMode.test.js` (jsdom) | `setUi('v2')` pone el atributo y `localStorage`; `setUi('v1')` los retira; dos suscriptores reciben el cambio; la lectura inicial respeta el atributo ya aplicado |
| `e2e/ui-mode.spec.js` — arranque | con `localStorage ui=v2`, el atributo existe **en el primer frame** |
| `e2e/ui-mode.spec.js` — caliente | el conmutador enciende/apaga sin recargar, guarda en `localStorage`, conserva la sesión y no repite peticiones de actividades |
| `e2e/ui-mode.spec.js` — persistencia | recargar mantiene el estado elegido y el `aria-checked` coincide |
| `e2e/visual-v2.spec.js` | 48 capturas de v2 (idénticas a v1 en el PR 4) |
| `e2e/visual.spec.js` | 48 capturas de v1, **sin cambios** |

### 6.6 Piel (PR 5 en adelante; aquí solo se reserva)
`html[data-ui="v2"]` sobreescribirá escala de texto (`--text-*`), radios (`--radius-*`), sombras y paleta, más los valores `.dark` de `chartTheme` (D-10). El PR 5 lo hace **solo** sobre Dashboard y Calendario y para.

## 7. Pruebas (comandos)

```bash
npm run lint && npm run lint:colors && npm run lint:ui
npm run test:unit && npm run test:integration
npm run build
npx playwright test                 # macOS: visual* se omiten
npm run test:e2e:docker             # capturas de referencia (Linux)
npm run test:e2e:update             # solo al crear/regenerar referencias
```

Volcado (en serie; `develop` vive en `wt-develop` con `E2E_PORT=5274`):

```bash
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-develop" npx playwright test e2e/tools/style-dump.spec.js
STYLE_DUMP_PROPS=full STYLE_DUMP_DIR="$TMPDIR/dump-rama"    npx playwright test e2e/tools/style-dump.spec.js
node scripts/style-diff.mjs "$TMPDIR/dump-develop" "$TMPDIR/dump-rama"
```

## 8. Notas adicionales

### Lo que esta rama NO hace
- No convierte v2 en la vista por defecto (Capa 6).
- No reescribe pantallas ni unifica etiquetas de pestañas (Capa 5).
- No toca la landing ni el acceso (Capa 4); sus `z-50`/`z-[400]` literales siguen ahí.
- No añade escalas ordinales de color salvo que la dirección visual aprobada las pida.
- No sincroniza `data-ui` entre pestañas.

### Riesgos
- **Bajo (PR 4):** si el mecanismo pinta algo, lo delatan 48 capturas de v2 idénticas a v1 en el mismo PR.
- **Medio (PR 5):** es la única parte creativa; se hace sobre dos pantallas y con parada de aprobación.
- **Medio-alto (PR 6):** extender a 6 pantallas y a todas las gráficas; se va pantalla a pantalla comparando v2 contra v2.

### Hallazgos que esta rama puede dejar anotados
- El selector `html[data-ui="v2"]` convive con `.dark`: toda la piel necesita valores en ambos temas o el resultado se rompe en uno de los dos.
- Si el cambio en caliente provoca un `refetch`, será porque algún componente lee el atributo fuera de un hook; la prueba de «no repite peticiones» existe para detectarlo.
