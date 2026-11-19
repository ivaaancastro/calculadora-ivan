#!/usr/bin/env bash
# Volcado de estilos para el CI (se ejecuta en el contenedor de Playwright).
#   bash scripts/ci-style-dump.sh <directorio-del-checkout> <salida>
# Sin reintentos y con 4 workers: el volcado es determinista y no necesita los 19 min del E2E.
set -euo pipefail
DIR="${1:?checkout}"; OUT="$(mkdir -p "${2:?salida}" && cd "$2" && pwd)"
cd "$DIR"
STYLE_DUMP_DIR="$OUT" E2E_WORKERS="${E2E_WORKERS:-4}" \
  npx playwright test e2e/tools/style-dump.spec.js --retries=0 --reporter=dot
echo "volcados: $(find "$OUT" -name '*.json' | wc -l | tr -d ' ')"
