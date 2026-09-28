#!/usr/bin/env bash
set -euo pipefail
SEPTA_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SEPTA_ROOT"
if [[ ! -f .env && ! -f backend/.env ]]; then
  SEPTA_PYTHON=""
  for candidate in python3.13 python3.12 python3.11 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then SEPTA_PYTHON="$candidate"; break; fi
  done
  if [[ -z "$SEPTA_PYTHON" ]]; then
    echo 'Python 3.10–3.13 is required. Install Python 3.13 and run this launcher again.'
    exit 1
  fi
  "$SEPTA_PYTHON" - <<'PY'
from pathlib import Path
import os
import secrets

destination = Path('.env')
os.umask(0o077)
with destination.open('x') as config:
    config.write('APP_ENV=development\nSITE_URL=http://localhost:8000\n')
    config.write('ALLOW_INDEXING=false\nCORS_ORIGINS=http://localhost:8000,http://localhost:3000\n')
    config.write('SECRET_KEY=' + secrets.token_urlsafe(48) + '\n')
    config.write('MONGO_URL=mongodb://localhost:27017\nDB_NAME=septa\n')
    config.write('STORAGE_PROVIDER=LOCAL\nLOCAL_UPLOAD_DIR=./backend/uploads\n')
    config.write('FRONTEND_BUILD_DIR=./frontend/build\nADMIN_EMAIL_OTP=false\n')
print('Created local settings for MongoDB localhost / septa. Existing database records will be used.')
PY
fi
exec bash "$SEPTA_ROOT/start-local.sh"
