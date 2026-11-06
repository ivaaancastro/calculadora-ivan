# Tareas — spec-rediseno-02-c0 (Red de seguridad de UI)

Solo se marca lo verificado. Rama: `test/ui-safety-net` → PR hacia `develop`.

## 1. Limpieza (RF8, RF11)
- [ ] Dejar de versionar `playwright-report/` y `test-results/` (`git rm --cached`)
- [ ] Ignorar `.playwright-mcp/` y `.taste-skill/` en `.gitignore`
- [ ] `VITE_GEMINI_API_KEY` opcional en `src/main.jsx` (aviso en consola, sin bloquear)
- [ ] Actualizar `.env.example` y comentarios que la declaren obligatoria
- [ ] Verificar: build de producción solo con variables de Supabase arranca y muestra la landing

## 2. Marca y zoom (RF9, RF10)
- [ ] "FormaLab" → "Forma" en Navbar, EmailConfirmedPage, LandingPage, ProfilePage
- [ ] Viewport sin `maximum-scale` ni `user-scalable=no`

## 3. Accesibilidad de formularios y selectores (RF6)
- [ ] Etiquetas asociadas en `AddActivityModal`
- [ ] Etiquetas asociadas en el modal de acceso (`LandingPage`)
- [ ] E2E migrados a rol/etiqueta (sin texto comercial)

## 4. Soporte de pruebas (RF1)
- [ ] Módulo único de datos simulados en `e2e/support/`
- [ ] Fecha fija, animaciones desactivadas
- [ ] Proyecto móvil en `playwright.config.js` (puerto configurable)

## 5. Layout, táctil y gestos (RF3, RF4, RF5)
- [ ] Prueba de solapes de barras fijas y desbordamiento horizontal
- [ ] Informe de objetivos táctiles < 44 px (no bloquea)
- [ ] Pruebas de gestos (fallo esperado si hay defecto, documentado)

## 6. Visual (RF2)
- [ ] Capturas de referencia en Linux (imagen oficial de Playwright), 8 rutas × 2 tamaños × 2 temas
- [ ] Revisión una a una

## 7. Paridad (RF7)
- [ ] `docs/branches/test/ui-safety-net/paridad.md`

## 8. Validar la red
- [ ] Defecto 1: barra que tapa contenido → falla
- [ ] Defecto 2: elemento más ancho que la pantalla → falla
- [ ] Defecto 3: cambio visual en una tarjeta → falla
- [ ] Defectos retirados

## 9. Registro y PR
- [ ] CI: Playwright con imagen/entorno acorde a las capturas
- [ ] Dos ejecuciones seguidas estables
- [ ] `npm run lint`, `test:unit`, `test:integration`, `test:e2e`, `build` en local
- [ ] `MEMORY.md` y `CHANGELOG.md`
- [ ] PR hacia `develop` con resultados
