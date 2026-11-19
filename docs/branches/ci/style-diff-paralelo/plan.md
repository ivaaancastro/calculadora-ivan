# Plan — style-diff en jobs paralelos
1. Sustituir el job `style-diff` de `ci.yml` por `style-after`, `style-before` (condicional) y `style-diff` (comparación).
2. Validar YAML; dejar que el CI del PR haga la verificación (sin ejecuciones locales extra).
3. Registrar en `CHANGELOG.md` y `MEMORY.md`; PR a `develop`, sin mergear.
