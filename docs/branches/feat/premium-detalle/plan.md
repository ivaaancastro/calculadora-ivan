# Plan — `feat/premium-detalle`

Deriva de `spec.md`. PRs pequeños desde `develop`; el root mergea con CI en verde.

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-detalle` | Spec+plan+tasks; `DetailHero` (cifras protagonistas + ledger), cabecera v2 de una fila, `pickHeroMetrics` + test, CSS del hero. |
| 2 | `feat/premium-detalle-telemetria` | Picos y HUD, cursor compartido, esqueleto de carga, estados parciales/error. |
| 3 | `feat/premium-detalle-lateral` | Panel de impacto/Coach, pestañas Laps y Detalle, snapshots v2 (Docker) y cierre documental. |

Verificación por PR: `npm run verify` (carril visual); E2E y style-diff en el CI. Snapshots v2 del detalle: `npm run test:e2e:update` (Docker) solo en el PR que cambie capturas, revisando como mucho 2–3 reducidas.
