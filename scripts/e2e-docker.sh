#!/usr/bin/env bash
# Ejecuta Playwright en la imagen oficial (Linux x86_64), idéntica a la de CI,
# para que las capturas de referencia sean comparables. Uso:
#   npm run test:e2e:docker                 # compara con las capturas guardadas
#   npm run test:e2e:update                 # regenera las capturas (revisarlas una a una)
#   npm run test:e2e:docker -- e2e/layout.spec.js   # argumentos extra para Playwright
set -euo pipefail

cd "$(dirname "$0")/.."
VERSION="$(node -p "require('@playwright/test/package.json').version")"
IMAGE="mcr.microsoft.com/playwright:v${VERSION}-noble"

# node_modules propio del contenedor (los binarios de macOS no sirven en Linux).
exec docker run --rm --platform linux/amd64 --ipc=host \
  -v "$PWD":/work \
  -v forma-e2e-node-modules:/work/node_modules \
  -e CI="${CI:-}" \
  -w /work "$IMAGE" \
  bash -c '[ node_modules/.package-lock.json -nt package-lock.json ] || npm ci --no-audit --no-fund >/dev/null; npx playwright test "$@"' _ "$@"
