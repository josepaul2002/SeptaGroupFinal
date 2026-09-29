"""Recover local Septa uploads from older installations without overwriting files.

The release ZIP intentionally excludes private, user-uploaded media. This script
looks for copies in other Septa folders under Downloads and merges only missing
files into the active upload directory. It never reads or prints secrets.
"""
from __future__ import annotations

import os
from pathlib import Path
import shutil
import sys


def upload_directory(site: Path) -> Path:
    value = ''
    for env_file in (site / '.env', site / 'backend' / '.env'):
        if not env_file.is_file():
            continue
        for line in env_file.read_text(encoding='utf-8').splitlines():
            if line.strip().startswith('LOCAL_UPLOAD_DIR='):
                value = line.split('=', 1)[1].strip().strip('"\'')
    configured = Path(value) if value else Path('backend/uploads')
    return (configured if configured.is_absolute() else site / configured).resolve()


def upload_sources(downloads: Path, active: Path):
    for root, dirs, _ in os.walk(downloads, followlinks=False):
        current = Path(root)
        depth = len(current.relative_to(downloads).parts)
        dirs[:] = [d for d in dirs if d not in {'.venv', 'venv', 'node_modules', '.git', '__pycache__'}]
        if depth > 6:
            dirs[:] = []
            continue
        if current.name == 'uploads' and current.parent.name == 'backend':
            dirs[:] = []
            if current.resolve() != active and not current.is_symlink():
                yield current


def recover(site: Path, downloads: Path) -> tuple[int, int, int]:
    target = upload_directory(site)
    if not (site / 'backend/server.py').is_file():
        raise ValueError(f'Not an installed Septa website: {site}')
    target.mkdir(parents=True, exist_ok=True)
    copied = conflicts = sources = 0
    search_roots = [downloads]
    trash = Path.home() / '.Trash'
    if trash.is_dir() and trash != downloads:
        search_roots.append(trash)
    for source in (folder for root in search_roots for folder in upload_sources(root, target)):
        sources += 1
        for path in source.rglob('*'):
            if not path.is_file() or path.is_symlink():
                continue
            relative = path.relative_to(source)
            destination = target / relative
            if not destination.resolve().is_relative_to(target):
                continue
            if destination.exists():
                if destination.stat().st_size != path.stat().st_size:
                    conflicts += 1
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
            copied += 1
    print(f'Media folders checked: {sources}; missing uploads recovered: {copied}; existing-file conflicts left untouched: {conflicts}.')
    print(f'Active upload folder: {target}')
    if not sources and not any(path.is_file() for path in target.rglob('*')):
        print('No local upload files were found. Existing /uploads/ links will remain broken until the original media is restored or reuploaded.')
    return sources, copied, conflicts


if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        raise SystemExit('Usage: repair-local-media.py <installed-site> [Downloads-folder]')
    recover(Path(sys.argv[1]).expanduser().resolve(), Path(sys.argv[2] if len(sys.argv) == 3 else '~/Downloads').expanduser().resolve())
