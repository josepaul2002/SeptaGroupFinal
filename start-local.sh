#!/usr/bin/env bash
set -euo pipefail
SEPTA_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SEPTA_ROOT"
if [[ ! -f .env && ! -f backend/.env ]]; then
  echo 'Copy your existing working .env into this folder (or backend/.env into backend).'
  echo 'For a new installation, copy .env.example to .env and set MongoDB and owner login details.'
  exit 1
fi
if [[ ! -f frontend/build/index.html ]]; then
  echo 'Build the frontend first: cd frontend && npm ci --legacy-peer-deps && npm run build'
  exit 1
fi
if [[ ! -x .venv/bin/python ]]; then
  SEPTA_PYTHON=""
  for candidate in python3.13 python3.12 python3.11 python3; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; assert (3,10) <= sys.version_info[:2] <= (3,13)' >/dev/null 2>&1; then
      SEPTA_PYTHON="$candidate"
      break
    fi
  done
  if [[ -z "$SEPTA_PYTHON" ]]; then
    echo 'Install Python 3.13, then run this command again. These dependencies require Python 3.10–3.13.'
    exit 1
  fi
  "$SEPTA_PYTHON" -m venv .venv
fi
if ! .venv/bin/python -c 'import sys; assert (3,10) <= sys.version_info[:2] <= (3,13)' >/dev/null 2>&1; then
  echo 'This virtual environment uses an unsupported Python. Keep it as a backup with: mv .venv .venv-backup'
  echo 'Then rerun bash start-local.sh with Python 3.13 installed.'
  exit 1
fi
if ! .venv/bin/python -c 'import uvicorn, fastapi, motor, jose, passlib, resend, slowapi, boto3, email_validator, multipart' >/dev/null 2>&1; then
  .venv/bin/python -m pip install -r backend/requirements.txt
fi
.venv/bin/python scripts/ensure-local-owner.py
export FRONTEND_BUILD_DIR="$SEPTA_ROOT/frontend/build"
echo 'Septa website: http://localhost:8000'
echo 'Website Studio: http://localhost:8000/admin'
echo 'Keep this terminal open. Press Control-C to stop.'
cd backend
exec "$SEPTA_ROOT/.venv/bin/python" -m uvicorn server:app --host 127.0.0.1 --port 8000
