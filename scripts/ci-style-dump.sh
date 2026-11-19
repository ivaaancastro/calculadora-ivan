#!/usr/bin/env bash
# Volcado de estilos para el CI (se ejecuta en el contenedor de Playwright).
#   bash scripts/ci-style-dump.sh <directorio-del-checkout> <salida>
# Sin reintentos y con 4 workers: el volcado es determinista y no necesita los 19 min del E2E.
# --timeout 120 s: con 4 workers a la vez las pruebas con estados `:hover/:focus` forzados por CDP
# superan los 30 s por defecto (visto en el PR #105: 21 de 108 con «Test timeout of 30000ms»).
set -euo pipefail
DIR="${1:?checkout}"; OUT="$(mkdir -p "${2:?salida}" && cd "$2" && pwd)"
cd "$DIR"
# --workers por CLI (no por E2E_WORKERS): al regenerar el baseline se usa el playwright.config.js de la
# base (develop), que aún no conoce esa variable y con CI=true correría con 1 worker (>20 min).
STYLE_DUMP_DIR="$OUT" \
  npx playwright test e2e/tools/style-dump.spec.js --workers="${E2E_WORKERS:-4}" --retries=0 --timeout=120000 --reporter=dot
echo "volcados: $(find "$OUT" -name '*.json' | wc -l | tr -d ' ')"
