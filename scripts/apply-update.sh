#!/usr/bin/env bash
set -euo pipefail
SEPTA_PACKAGE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -d "$SEPTA_PACKAGE/site" ]]; then
  echo 'Extract the complete update ZIP before running apply-update.sh.'
  exit 1
fi
SEPTA_TARGET="${1:-}"
if [[ -z "$SEPTA_TARGET" ]]; then
  SEPTA_MATCHES=()
  for candidate in "$HOME/Downloads/septa-original-style-with-admin-recovery" "$HOME/Downloads/septa-layout-original-style"; do
    if [[ -f "$candidate/backend/server.py" ]]; then SEPTA_MATCHES+=("$candidate"); fi
  done
  if [[ ${#SEPTA_MATCHES[@]} -eq 1 ]]; then
    SEPTA_TARGET="${SEPTA_MATCHES[0]}"
  else
    echo 'Enter the full path of the Septa folder you currently run (you can drag it from Finder):'
    IFS= read -r SEPTA_TARGET
    SEPTA_TARGET="${SEPTA_TARGET#\'}"; SEPTA_TARGET="${SEPTA_TARGET%\'}"
    SEPTA_TARGET="${SEPTA_TARGET#\"}"; SEPTA_TARGET="${SEPTA_TARGET%\"}"
    SEPTA_TARGET="${SEPTA_TARGET//\\ / }"
    SEPTA_TARGET="${SEPTA_TARGET/#\~/$HOME}"
  fi
fi
if [[ ! -f "$SEPTA_TARGET/backend/server.py" ]]; then
  echo 'That folder does not contain backend/server.py. No files were changed.'
  exit 1
fi
SEPTA_PYTHON=""
for candidate in python3.13 python3.12 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then SEPTA_PYTHON="$candidate"; break; fi
done
if [[ -z "$SEPTA_PYTHON" ]]; then echo 'Python 3 is needed to apply this update.'; exit 1; fi
"$SEPTA_PYTHON" "$SEPTA_PACKAGE/install-update.py" "$SEPTA_PACKAGE/site" "$SEPTA_TARGET"
echo
echo 'Update complete. Restart the site with:'
printf 'cd %q && bash start-local.sh\n' "$SEPTA_TARGET"
echo 'Then open http://localhost:8000/admin and refresh the page.'
