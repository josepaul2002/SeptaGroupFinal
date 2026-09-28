"""Copy a source/build update while preserving local configuration and data."""
from datetime import datetime, timezone
from pathlib import Path
import shutil
import sys
import tempfile


def apply(source, target):
    source, target = Path(source).resolve(), Path(target).resolve()
    if not (target / 'backend/server.py').is_file():
        raise SystemExit('Target is not a Septa site. No files changed.')
    protected = {'.git', '.venv', 'venv', 'node_modules', 'uploads', '__pycache__'}
    files = []
    for path in source.rglob('*'):
        relative = path.relative_to(source)
        if any(part in protected for part in relative.parts):
            continue
        if path.name.startswith('.env') and path.name != '.env.example':
            continue
        if path.is_symlink():
            raise SystemExit('Unexpected symlink in update package. No files changed.')
        if not path.is_file():
            continue
        destination = target / relative
        if not destination.resolve().is_relative_to(target):
            raise SystemExit('Target contains a symlink outside the site. No files changed.')
        files.append((path, relative, destination))
    if not (source / 'frontend/build/index.html').is_file():
        raise SystemExit('Compiled website is missing from this update. No files changed.')
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    backup = target.parent / f'{target.name}-backup-{stamp}'
    backup.mkdir()
    # Back up every replaced file before changing any source files.
    for _, relative, destination in files:
        if destination.is_file():
            saved = backup / relative
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(destination, saved)
    for path, _, destination in files:
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as temp:
            temporary = Path(temp.name)
        try:
            shutil.copy2(path, temporary)
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
    print(f'Updated {len(files)} files in: {target}')
    print(f'Previous replaced files backed up to: {backup}')
    print('Your .env files, virtual environment, uploads and MongoDB were preserved.')
    return backup


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: install-update.py <update/site> <existing-site>')
    apply(sys.argv[1], sys.argv[2])
