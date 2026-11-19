#!/usr/bin/env bash
# Descarga el volcado de estilos de `develop` publicado por el CI (artifact `style-dump-<sha>`).
#   bash scripts/fetch-style-baseline.sh <sha> <directorio-destino>
# Sale con 3 si no existe o caducó (retención 7 días): hay que regenerarlo.
set -euo pipefail
SHA="${1:?uso: fetch-style-baseline.sh <sha> <destino>}"; OUT="${2:?uso: fetch-style-baseline.sh <sha> <destino>}"
NAME="style-dump-$SHA"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
RUN="$(gh api "repos/$REPO/actions/artifacts?name=$NAME&per_page=5" \
  --jq '[.artifacts[] | select(.expired|not)][0].workflow_run.id // empty')"
if [ -z "$RUN" ]; then echo "fetch-style-baseline: no hay artifact $NAME (¿aún sin CI en develop o caducado?)" >&2; exit 3; fi
rm -rf "$OUT"; mkdir -p "$OUT"
gh run download "$RUN" --repo "$REPO" -n "$NAME" -D "$OUT"
echo "baseline $NAME → $OUT ($(find "$OUT" -name '*.json' | wc -l | tr -d ' ') volcados)"
