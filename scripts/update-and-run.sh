#!/usr/bin/env bash
set -euo pipefail
SEPTA_PACKAGE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export SEPTA_START_AFTER_UPDATE=1
exec bash "$SEPTA_PACKAGE/apply-update.sh" "$@"
