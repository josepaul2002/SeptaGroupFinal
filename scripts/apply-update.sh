#!/usr/bin/env bash
set -euo pipefail
SEPTA_PACKAGE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -d "$SEPTA_PACKAGE/site" ]]; then
  echo 'Extract the complete update ZIP before running apply-update.sh.'
  exit 1
fi
SEPTA_TARGET="${1:-}"
SEPTA_TARGET="$(python3 -c 'import os,sys; print(os.path.expanduser(sys.argv[1].strip().strip("\"\x27")))' "$SEPTA_TARGET")"
SEPTA_MATCHES=()
find_installs() {
  while IFS= read -r candidate; do
    [[ "$candidate" == "$SEPTA_PACKAGE"/* ]] && continue
    [[ "$candidate" == *-backup-* ]] && continue
    [[ -f "$candidate/backend/server.py" ]] && SEPTA_MATCHES+=("$candidate")
  done < <(find "$HOME/Downloads" -maxdepth 5 -type f -path '*/backend/server.py' -print 2>/dev/null | sed 's#/backend/server.py$##')
}
choose_install() {
  find_installs
  SEPTA_CONFIGURED=()
  for candidate in "${SEPTA_MATCHES[@]}"; do
    if [[ -f "$candidate/.env" || -f "$candidate/backend/.env" ]]; then SEPTA_CONFIGURED+=("$candidate"); fi
  done
  if [[ ${#SEPTA_CONFIGURED[@]} -eq 1 ]]; then
    SEPTA_TARGET="${SEPTA_CONFIGURED[0]}"
    echo "Found your configured Septa installation: $SEPTA_TARGET"
  elif [[ ${#SEPTA_MATCHES[@]} -eq 1 ]]; then
    SEPTA_TARGET="${SEPTA_MATCHES[0]}"
    echo "Found your Septa installation: $SEPTA_TARGET"
  elif [[ ${#SEPTA_MATCHES[@]} -gt 1 ]]; then
    echo 'These Septa website folders were found (backups are excluded):'
    for i in "${!SEPTA_MATCHES[@]}"; do
      marker=''
      [[ -f "${SEPTA_MATCHES[$i]}/.env" || -f "${SEPTA_MATCHES[$i]}/backend/.env" ]] && marker=' [local settings]'
      echo "$((i+1))) ${SEPTA_MATCHES[$i]}$marker"
    done
    echo 'Type ONLY the number of the folder you normally run, then press Return (do not paste the launch command here):'
    IFS= read -r choice
    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#SEPTA_MATCHES[@]} )); then
      SEPTA_TARGET="${SEPTA_MATCHES[$((choice-1))]}"
    else
      echo 'Invalid selection. No files were changed.'; exit 1
    fi
  else
    echo 'No older Septa source folder was found in Downloads.'
    echo 'Starting the complete website included in this update. It will reconnect to MongoDB localhost / septa.'
    exec bash "$SEPTA_PACKAGE/site/launch-local.sh"
  fi
}
if [[ -z "$SEPTA_TARGET" ]]; then
  choose_install
fi
if [[ ! -f "$SEPTA_TARGET/backend/server.py" ]]; then
  if [[ "$SEPTA_TARGET" == "$SEPTA_PACKAGE" || "$SEPTA_TARGET" == "$SEPTA_PACKAGE/site" ]]; then
    echo 'That is the update package folder, not the installed website. Searching Downloads for the installed Septa copy.'
  else
    echo "The previous site folder is unavailable: $SEPTA_TARGET"
    echo 'Searching Downloads for the installed Septa copy.'
  fi
  SEPTA_MATCHES=()
  choose_install
  if [[ ! -f "$SEPTA_TARGET/backend/server.py" ]]; then
    echo 'That folder does not contain backend/server.py. No files were changed.'
    exit 1
  fi
fi
SEPTA_PYTHON=""
for candidate in python3.13 python3.12 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then SEPTA_PYTHON="$candidate"; break; fi
done
if [[ -z "$SEPTA_PYTHON" ]]; then echo 'Python 3 is needed to apply this update.'; exit 1; fi
"$SEPTA_PYTHON" "$SEPTA_PACKAGE/install-update.py" "$SEPTA_PACKAGE/site" "$SEPTA_TARGET"
"$SEPTA_PYTHON" "$SEPTA_PACKAGE/site/scripts/repair-local-media.py" "$SEPTA_TARGET"
echo
echo 'Update complete. Restart the site with:'
printf 'cd %q && bash start-local.sh\n' "$SEPTA_TARGET"
echo 'Then open http://localhost:8000/admin and refresh the page.'

if [[ "${SEPTA_START_AFTER_UPDATE:-0}" == "1" ]]; then
  exec bash "$SEPTA_TARGET/start-local.sh"
fi
