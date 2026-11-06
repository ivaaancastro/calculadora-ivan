# Tareas — spec-rediseno-02-c0 (Red de seguridad de UI)

Solo se marca lo verificado. Rama: `test/ui-safety-net` → PR hacia `develop`.

## 1. Limpieza (RF8, RF11)
- [x] Dejar de versionar `playwright-report/` y `test-results/` (`git rm --cached`)
- [x] Ignorar `.playwright-mcp/` y `.taste-skill/` en `.gitignore`
- [x] `VITE_GEMINI_API_KEY` opcional en `src/main.jsx` (aviso en consola, sin bloquear)
- [x] Actualizar `.env.example` y comentarios que la declaren obligatoria
- [x] Verificar: build de producción solo con variables de Supabase arranca y muestra la landing

## 2. Marca y zoom (RF9, RF10)
- [x] "FormaLab" → "Forma" en Navbar, EmailConfirmedPage, LandingPage, ProfilePage
- [x] Viewport sin `maximum-scale` ni `user-scalable=no`

## 3. Accesibilidad de formularios y selectores (RF6)
- [x] Etiquetas asociadas en `AddActivityModal`
- [x] Etiquetas asociadas en el modal de acceso (`LandingPage`)
- [x] E2E migrados a rol/etiqueta (sin texto comercial)

## 4. Soporte de pruebas (RF1)
- [x] Módulo único de datos simulados en `e2e/support/`
- [x] Fecha fija, animaciones desactivadas
- [x] Proyecto móvil en `playwright.config.js` (puerto configurable)

## 5. Layout, táctil y gestos (RF3, RF4, RF5)
- [x] Prueba de solapes de barras fijas y desbordamiento horizontal
- [x] Informe de objetivos táctiles < 44 px (no bloquea)
- [x] Pruebas de gestos (fallo esperado si hay defecto, documentado)

## 6. Visual (RF2)
- [x] Capturas de referencia en Linux (imagen oficial de Playwright), 8 rutas × 2 tamaños × 2 temas
- [x] Revisión una a una

## 7. Paridad (RF7)
- [x] `docs/branches/test/ui-safety-net/paridad.md`

## 8. Validar la red
- [x] Defecto 1: barra que tapa contenido → falla
- [x] Defecto 2: elemento más ancho que la pantalla → falla
- [x] Defecto 3: cambio visual en una tarjeta → falla
- [x] Defectos retirados

## 9. Registro y PR
- [x] CI: Playwright con imagen/entorno acorde a las capturas
- [x] Dos ejecuciones seguidas estables (en Docker local, imagen oficial; falta confirmarlo en CI)
- [ ] `npm run lint`, `test:unit`, `test:integration`, `test:e2e`, `build` en local
- [x] `MEMORY.md` y `CHANGELOG.md`
- [ ] PR hacia `develop` con resultados

## Notas de verificación
- Landing: el canvas de partículas se oculta con CSS en las capturas (animado e inestable); el resto del hero se comprueba.
- Defectos de prueba: barra fija (Navbar `fixed`) y elemento de 2400 px → fallan las pruebas de layout en 390 y 1440; icono de tarjeta con otro color → falla la captura (534 px). La tolerancia inicial (0,2 %) no lo detectaba y se bajó a 100 px. Los tres retirados.
- Pendiente: estabilidad en CI (dos ejecuciones seguidas) y resultados finales de las cinco comprobaciones en el PR.
