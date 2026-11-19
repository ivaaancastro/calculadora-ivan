#!/usr/bin/env bash
# Mutex de tareas pesadas locales (E2E Docker, volcados de estilos, verify --e2e).
# Una sola a la vez en toda la máquina, aunque haya varias sesiones/worktrees en paralelo.
#
#   bash scripts/heavy-lock.sh run <comando…>   # espera turno, ejecuta, libera
#   bash scripts/heavy-lock.sh status           # quién lo tiene
#
# Variables: HEAVY_WAIT (s máx. de espera, 3600) · HEAVY_MAX_LOAD (loadavg 1 min; por defecto
# 2 × núcleos) · HEAVY_SKIP_LOAD=1 (no esperar a que baje la carga) · HEAVY_LOCK (ruta del lock).
# El lock es un directorio (mkdir es atómico; macOS no trae `flock`) con el PID y la descripción
# del dueño; si ese PID ya no existe el bloqueo se considera huérfano y se recupera.
set -uo pipefail

LOCK="${HEAVY_LOCK:-/tmp/forma-heavy.lock}"
WAIT="${HEAVY_WAIT:-3600}"

ncpu() { sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4; }
load1() {
  if [ -r /proc/loadavg ]; then cut -d' ' -f1 /proc/loadavg
  else sysctl -n vm.loadavg 2>/dev/null | tr -d '{}' | awk '{print $1}'; fi
}
max_load() { echo "${HEAVY_MAX_LOAD:-$(( $(ncpu) * 2 ))}"; }
over_load() { awk -v l="$(load1)" -v m="$(max_load)" 'BEGIN{exit !(l>m)}'; }

owner_alive() {
  local pid; pid="$(cat "$LOCK/pid" 2>/dev/null || true)"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

status() {
  if [ -d "$LOCK" ] && owner_alive; then
    echo "ocupado por PID $(cat "$LOCK/pid") — $(cat "$LOCK/desc" 2>/dev/null) (desde $(cat "$LOCK/since" 2>/dev/null))"
  else echo "libre"; fi
  echo "loadavg(1m)=$(load1) umbral=$(max_load)"
}

acquire() {
  local start; start=$(date +%s); local told=0
  while :; do
    if mkdir "$LOCK" 2>/dev/null; then
      echo "$$" >"$LOCK/pid"; date '+%H:%M:%S' >"$LOCK/since"; echo "${HEAVY_DESC:-$*} (cwd $PWD)" >"$LOCK/desc"
      return 0
    fi
    if ! owner_alive; then            # dueño muerto o lock antiguo sin PID (el fichero vacío de antes no cuenta)
      echo "heavy-lock: recuperando bloqueo huérfano" >&2
      rm -rf "$LOCK"; continue
    fi
    [ $(( $(date +%s) - start )) -ge "$WAIT" ] && { echo "heavy-lock: timeout esperando turno ($(status | head -1))" >&2; return 1; }
    [ $told -eq 0 ] && { echo "heavy-lock: esperando turno — $(status | head -1)" >&2; told=1; }
    sleep 5
  done
}

wait_for_load() {
  [ "${HEAVY_SKIP_LOAD:-}" = 1 ] && return 0
  local start; start=$(date +%s); local told=0
  while over_load; do
    [ $(( $(date +%s) - start )) -ge "$WAIT" ] && { echo "heavy-lock: timeout esperando a que baje la carga" >&2; return 1; }
    [ $told -eq 0 ] && { echo "heavy-lock: loadavg $(load1) > $(max_load); esperando a que baje (HEAVY_SKIP_LOAD=1 para ignorar)" >&2; told=1; }
    sleep 10
  done
}

release() { [ "$(cat "$LOCK/pid" 2>/dev/null)" = "$$" ] && rm -rf "$LOCK"; }

case "${1:-}" in
  status) status ;;
  run)
    shift; [ $# -gt 0 ] || { echo "uso: heavy-lock.sh run <comando…>" >&2; exit 2; }
    acquire "$@" || exit 75
    trap 'release' EXIT
    trap 'release; exit 130' INT TERM
    wait_for_load || exit 75
    "$@"; exit $? ;;
  *) echo "uso: heavy-lock.sh run <comando…> | status" >&2; exit 2 ;;
esac
