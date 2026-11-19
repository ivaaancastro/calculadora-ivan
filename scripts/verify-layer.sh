#!/usr/bin/env bash
# Pasada completa de cierre de capa (spec-verificacion-rapida, RF8 bis). `npm run verify:layer`.
#   npm run verify:layer                 # style-diff completo contra develop (debe dar 0 diferencias en v1)
#   npm run verify:layer -- --snapshots  # además compara las capturas visuales en Docker
# Una vez por capa, no por feat. Baseline: artifact del CI en el merge-base con develop.
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="$(git merge-base origin/develop HEAD)"
WORK="${TMPDIR:-/tmp}/forma-layer-$$"; mkdir -p "$WORK"; trap 'rm -rf "$WORK"' EXIT

echo "→ baseline de develop ($BASE)"
bash scripts/fetch-style-baseline.sh "$BASE" "$WORK/before" || {
  echo "Sin baseline publicado: espera al CI de ese commit en develop, o genera el «antes» a mano en un worktree de $BASE." >&2; exit 3; }

echo "→ volcado «después» (nativo: los volcados comparan valores, no píxeles)"
HEAVY_DESC="verify:layer volcado" bash scripts/heavy-lock.sh run \
  env STYLE_DUMP_DIR="$WORK/after" \
  npx playwright test e2e/tools/style-dump.spec.js --workers="${E2E_WORKERS:-2}" --retries=0 --timeout=120000 --reporter=dot

echo "→ style-diff completo"
node scripts/style-diff.mjs "$WORK/before" "$WORK/after"

if [ "${1:-}" = "--snapshots" ]; then
  echo "→ capturas visuales (Docker, bajo mutex)"
  bash scripts/e2e-docker.sh e2e/visual.spec.js e2e/visual-v2.spec.js e2e/access-visual-v2.spec.js --reporter=dot
fi
echo "verify:layer OK"
