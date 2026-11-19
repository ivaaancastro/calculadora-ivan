# Spec — style-diff en jobs paralelos

## 1. Identificación
- **ID:** `spec-style-diff-paralelo` · **Autor:** agente · **Fecha:** 2026-11-19 · **Estado:** aprobada por el usuario (mejoras 1 y 2 de las propuestas de velocidad de `chore/verificacion-rapida`; la matriz por dispositivo queda descartada)

## 2. Objetivo
Bajar el tiempo del job `style-diff` del CI (≈15 min: volcado «después» 7,1 min + regenerar «antes» 7,2 min en serie) a ≈8 min, sin cambiar qué se compara.

## 3. Contexto
Medido en el PR #105 (run 44555113614). El volcado es independiente de la comparación; «antes» y «después» no se necesitan entre sí.

## 4. Requisitos funcionales
- [ ] `style-after` y `style-before` corren en paralelo (cada uno sube su volcado como artifact, retención 3 días).
- [ ] `style-before` solo corre si no hay baseline publicado por `develop` para el SHA base real (`HEAD^1` del merge).
- [ ] `style-diff` (job final, sin contenedor) descarga ambos volcados, ejecuta `scripts/style-diff.mjs` y falla con diferencias.
- [ ] Con baseline publicado (job `style-baseline` en push a `develop`, ya existente), el PR solo ejecuta el «después».

## 5. Criterios de aceptación
- [ ] En el CI de este PR (visual): `style-after` y `style-before` solapados, `style-diff` en 0 diferencias, tiempo total ≈ el del más lento (≈8 min) en lugar de la suma.
- [ ] Un PR sin cambios de estilo sigue saltándose los tres jobs.

## 6. Diseño técnico
Solo `.github/workflows/ci.yml`. Sin cambios en scripts ni en `src/`.

## 7. Pruebas
La validación es el propio CI del PR (no se repite en local, por instrucción del usuario).

## 8. Riesgos
Si falla uno de los dos volcados, `style-diff` no se ejecuta y el fallo se ve en el job que cayó. Dos runners simultáneos por PR visual (minutos gratis: repo público).

---
Versión: 0.1.0 — 2026-11-19
