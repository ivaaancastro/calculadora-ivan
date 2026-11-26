# Spec — Coach Insights del detalle sin texto

**Estado:** aprobada por el usuario (propuesta en sesión) · implementada en `fix/detalle-coach-insights`.

## Problema
La tarjeta «Coach Insights» (`AnalysisSidebar.jsx`) sale con título y sin texto. En `fitnessAnalysis` solo había frase de IF si ≥0,85 o ≤0,70 (nada en 0,70–0,85, el caso común) y de `primaryBenefit` solo Umbral/VO2 Max/Capacidad Anaeróbica/Base Aeróbica (nada para «Mantenimiento»). La tarjeta se pintaba aunque `insights` estuviera vacío.

## Requisitos
1. Frase nueva para IF 0,70 < IF < 0,85 (intensidad moderada/tempo) y otra para «Mantenimiento», con el tono de las existentes.
2. No pintar la tarjeta si `insights.length === 0`.
3. Respetar el detalle por deporte: las frases de IF y de pico de 5 min (potencia) solo se generan si la matriz `SPORT_BLOCKS` muestra esas métricas (bici). En carrera, senderismo, fuerza y genérico no se generan (antes podían salir en carrera con potencia estimada: se corrige).
4. Tests de las reglas nuevas y de ocultar la tarjeta.

## Fuera de alcance
Cambiar textos existentes, la puntuación, `description`/`conclusion` o estilos (v1 sin cambios).
