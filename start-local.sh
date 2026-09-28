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
if [[ ! -x .venv/bin/python ]]; then python3 -m venv .venv; fi
if ! .venv/bin/python -c 'import uvicorn, fastapi, motor, jose, passlib, resend, slowapi, boto3, email_validator, multipart' >/dev/null 2>&1; then
  .venv/bin/python -m pip install -r backend/requirements.txt
fi
export FRONTEND_BUILD_DIR="$SEPTA_ROOT/frontend/build"
echo 'Septa website: http://localhost:8000'
echo 'Website Studio: http://localhost:8000/admin'
echo 'Keep this terminal open. Press Control-C to stop.'
cd backend
exec "$SEPTA_ROOT/.venv/bin/python" -m uvicorn server:app --host 127.0.0.1 --port 8000
