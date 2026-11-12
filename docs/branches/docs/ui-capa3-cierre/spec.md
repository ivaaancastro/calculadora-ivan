# Spec — `docs/ui-capa3-cierre` (PR 7 de la Capa 3): cierre documental

Solo documentación: `src/` idéntico a `develop`, sin volcado ni capturas.

## Requisitos
- R1. `ui-shell/spec.md`: marcar RF9–RF11 y los criterios «al terminar la capa» de v2 como cumplidos (con la evidencia: `index.html`, `useUiMode`, `ProfilePage` «Vista previa v2», `visual-v2.spec.js`); actualizar «Estado».
- R2. `ui-shell/tasks.md`: sección «Cierre de la Capa 3» con PRs #70–#76 y cifras finales.
- R3. `MEMORY.md` al día (estaba en «PR 6 en curso»); `CHANGELOG.md` con la entrada del PR 7.
- R4. Roadmap (`webapp-redesign/plan.md`): Capa 3 hecha.
- R5. Dejar constancia de la decisión abierta sobre la vista por defecto, **sin decidirla** (el usuario elige).

## Decisión abierta (D12): qué vista es la de por defecto
D8 ya está resuelta (conmutador en Ajustes → General, implementado). Falta decidir cuándo y cómo v2 pasa a ser la vista por defecto:
- **A. Mantener v1 por defecto hasta la Capa 6.** Coste: cero ahora; v2 sigue siendo opt-in (Ajustes o `VITE_UI=v2`) y shell y lienzo siguen en v1 (D11), así que v2 está a medias.
- **B. Poner v2 por defecto ya** (`VITE_UI=v2` en producción/preview). Coste: se ve una v2 inacabada (cabecera y fondo v1), capturas de referencia por defecto cambian, y hay que mantener el modo v1 como retirada.
- **C. v2 por defecto en `develop`/preview, v1 en producción.** Coste: dos entornos con valor distinto; prueba real de v2 sin riesgo en producción; requiere configurar la variable en el despliegue (fuera de este PR).
- Recomendación: A (la Capa 6 es la que activa v2 y retira el conmutador).
