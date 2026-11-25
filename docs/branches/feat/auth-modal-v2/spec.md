# Especificación SDD — spec-rediseno-02-c4-pr4 (modal de acceso y correo confirmado en v2)

## 1. Identificación
- **ID:** `spec-rediseno-02-c4-pr4` · **Rama:** `feat/auth-modal-v2` (desde `develop`, `c66063f`, que incluye #80)
- **Depende de:** `spec-rediseno-02-c4` (D1–D7 aprobadas), PR 1–3 de la Capa 4 mergeados.
- **Estado:** **implementada** (aprobada el 2026-11-16; PR #81).

## 2. Objetivo
Dar piel v2 (`html[data-ui="v2"]`) al modal de acceso (3 modos: entrar, registrarse, recuperar clave) y a `EmailConfirmedPage`, coherente con la landing v2 («Panel»), **sin cambiar el flujo de acceso**.

## 3. Estado actual (verificado en `develop`)
- `AuthModal.jsx` usa `Modal variant="auth"` y campos/botones con clases sueltas (`border-slate-200 dark:border-zinc-800`, `focus:border-blue-500`, `text-[10px]`, `shadow-action-solid/20`). Copy con «Regístrate gratis» y «laboratorio» (v1).
- `Modal` no gestiona el foco: no lo mueve al abrir, no lo atrapa ni lo devuelve al cerrar. Sí: `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape, clic fuera, bloqueo de scroll.
- El botón «cerrar» (X) no tiene `aria-label`; mensajes de error/éxito sin `role`.
- `EmailConfirmedPage` (v1) con clases `slate/zinc` sueltas y sin `data-skin` (no recibe los tokens de la piel). Botón «Ir a Iniciar Sesión» → `/`.
- El modal vive dentro del `div[data-skin="landing"]` (sin portal), así que hereda los tokens v2.

## 4. Requisitos funcionales
- **RF1. Flujo intacto:** misma API de Supabase (`signInWithPassword`, `signUp` con `emailRedirectTo`, `resetPasswordForEmail`), mismas validaciones (`required`, `type=email`) y mismos mensajes de error y éxito. Misma ruta `/email-confirmado`.
- **RF2. v1 congelada:** en v1 el modal y la página no cambian ni un píxel ni un texto; el volcado de estilos `develop` vs rama = 0 en v1/app.
- **RF3. Piel v2 con primitivas:** nueva variante `auth-v2` de `Modal` (panel «Panel»: `bg-surface`, borde `line`, radio y sombra por token, sin `backdrop-blur-2xl`), variante `auth` de `Input`/etiqueta en `fieldClasses`, `Button` para enviar/enlaces, `IconButton` para cerrar/volver, `Card` para `EmailConfirmedPage`. Sin hex sueltos; `lint:colors` no sube; `lint:ui` verde. Las variantes nuevas solo se usan desde el rama v2.
- **RF4. Copy neutro (D5):** en v2, «Regístrate» (sin «gratis»), «Accede a tu panel» (sin «laboratorio»), «Entrar». Los títulos de modo se mantienen para no romper los tests.
- **RF5. Accesibilidad:** foco inicial en el primer campo al abrir; Tab atrapado dentro del diálogo; el foco vuelve al botón que lo abrió al cerrar (`Modal` ganará una prop opt-in `trapFocus`, usada solo por el acceso v2, para no alterar los otros 3 modales); `aria-label="Cerrar"` en la X; error con `role="alert"` y éxito con `role="status"`; objetivos táctiles ≥ 44 px; texto ≥ 11 px; contraste AA claro/oscuro; Escape y clic fuera intactos; `prefers-reduced-motion` desactiva la animación de entrada.
- **RF6. EmailConfirmedPage v2:** `data-skin`, `Card`, un solo `h1`, `Button`/enlace con foco visible, copy sin promesas.
- **RF7. Sin lógica:** no se tocan `hooks`, `utils`, `services`, `store` ni `supabase.js`. Los `window.location.origin` se quedan (Capa 7).

## 5. Criterios de aceptación
- [ ] `lint`, `lint:colors` (sin subir), `lint:ui`, unit, integración, `test:e2e` y `build` en verde.
- [ ] `e2e/public.spec.js`: el test existente de los 3 modos sigue verde en v1; nuevo test v2 con los 3 modos, foco inicial, atrapar Tab, Escape y devolución de foco, sin «gratis/laboratorio»; `/email-confirmado` v2.
- [ ] Capturas nuevas solo en Docker: acceso (entrar, registro, recuperar) y `EmailConfirmedPage` v2 a 390/768/1440, claro/oscuro; se leen una a una y reducidas. No se regeneran las existentes.
- [ ] Volcado `style-diff` develop vs rama = 0 en v1/app.
- [ ] taste-skill solo sobre las páginas públicas (`consistency`/`perf` sobre el build v2).
- [ ] Sin merge sin autorización escrita.

## 6. Fuera de alcance
Cambios de Supabase, login social, ruta `/login`, cierre de la Capa 4 (PR 5: verificadores globales, peso, Lighthouse), activar v2 por defecto.

## 7. Riesgos
| Riesgo | Mitigación |
|---|---|
| Romper el único acceso a la app | Lógica de `handleAuth` no se toca; v1 y v2 comparten estado y envío; E2E de ambos |
| Trampa de foco mal hecha | Prop opt-in, probada con teclado en E2E |
| Variantes nuevas ensucian primitivas v1 | Variantes nuevas aditivas, probadas por `lint:ui` y `style-diff` |

## 8. Decisión que necesito
- **P1 · Foco:** ¿apruebas la mejora de foco (RF5) como prop opt-in solo para el acceso v2 (recomendado), o aplicarla a los 4 modales (toca v1 en comportamiento, no en estilo)?
