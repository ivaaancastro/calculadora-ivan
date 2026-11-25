# Plan — spec-rediseno-02-c0 (Red de seguridad de UI)

Un solo PR hacia `develop`, salvo que las capturas de referencia lo hagan difícil de revisar. En ese caso irían en un segundo PR.

1. **Limpieza:** dejar de versionar los informes, ampliar `.gitignore` y hacer opcional `VITE_GEMINI_API_KEY`.
2. **Marca y zoom:** aplicar "Forma" y el nuevo viewport.
3. **Accesibilidad de formularios:** asociar etiquetas y migrar los selectores E2E.
4. **Soporte de pruebas:** crear los datos simulados, la fecha fija, el desactivado de animaciones y el proyecto móvil.
5. **Layout y táctil:** añadir las pruebas de solapes, desbordamiento, tamaño táctil y gestos.
6. **Visual:** generar las capturas de referencia en Linux y revisarlas una a una.
7. **Paridad:** escribir la lista de acciones por pantalla.
8. **Validar la red:** introducir los tres defectos de prueba, confirmar que falla y retirarlos.
9. **Registrar:** actualizar `MEMORY.md` y `CHANGELOG.md`, y abrir el PR.

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Capturas inestables por fechas, animaciones o fuentes | Fecha fija, animaciones desactivadas y entorno único en Linux |
| CI más lenta | Solo las rutas principales y dos tamaños |
| El informe táctil genera ruido | No bloquea hasta la Capa 2, cuando existan las primitivas |

---
Versión: 0.1.0 — 2026-11-06
