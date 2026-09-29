"""Build a complete Septa ZIP, including the updater helper and compiled UI."""
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile, ZIP_DEFLATED
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'.git', '.venv', 'venv', 'node_modules', 'uploads', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache'}


def ignore(_directory, names):
    return [name for name in names if name in SKIP_DIRS or (name.startswith('.env') and name != '.env.example') or name.endswith(('.pyc','.log','.zip'))]


def package(name, destination):
    if not (ROOT / 'frontend/build/index.html').is_file():
        raise SystemExit('Compile the frontend before packaging: npm run build')
    destination = Path(destination).resolve()
    if destination.exists():
        raise SystemExit(f'Package already exists: {destination}. Choose a new name.')
    with TemporaryDirectory(prefix='septa-release-') as temporary:
        package_root = Path(temporary) / name
        shutil.copytree(ROOT, package_root / 'site', ignore=ignore)
        for source, target in [
            ('scripts/apply-update.sh', 'apply-update.sh'),
            ('scripts/install-update.py', 'install-update.py'),
            ('scripts/update-and-run.sh', 'update-and-run.sh'),
            ('UPDATE-NOTES.md', 'START-HERE.md'),
        ]:
            shutil.copy2(ROOT / source, package_root / target)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(destination, 'w', ZIP_DEFLATED, compresslevel=7) as archive:
            for path in package_root.rglob('*'):
                if path.is_file():
                    archive.write(path, path.relative_to(package_root.parent))
    print(f'{destination} ({destination.stat().st_size} bytes)')


if __name__ == '__main__':
    if len(sys.argv) != 3 or '/' in sys.argv[1] or sys.argv[1] in ('.', '..'):
        raise SystemExit('Usage: python scripts/package-release.py septa-seo-foundation /absolute/path/release.zip')
    package(sys.argv[1], sys.argv[2])
