"""Bounded responsive variants of already-public local uploads. Never fetch URLs."""
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from fastapi import HTTPException, Query
from fastapi.responses import Response, FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from config import UPLOADS_DIR


@lru_cache(maxsize=48)
def variant(filename, modified, size, width):
    with Image.open(filename) as source:
        if source.width * source.height > 40_000_000:
            raise ValueError('Image too large')
        if getattr(source, 'n_frames', 1) > 1:
            return None
        image = ImageOps.exif_transpose(source).convert('RGBA' if source.mode in ('RGBA','LA','P') else 'RGB')
        image.thumbnail((width, width * 4), Image.Resampling.LANCZOS)
        out = BytesIO()
        image.save(out, format='WEBP', quality=84, method=4)
        return out.getvalue()


def attach_media_delivery(router):
    @router.get('/media/image')
    def image(path: str, width: int = Query(960)):
        if width not in (480, 960, 1600) or not path.startswith('/uploads/'):
            raise HTTPException(400, 'Unsupported image request')
        root = UPLOADS_DIR.resolve()
        candidate = (root / path.removeprefix('/uploads/')).resolve()
        if not candidate.is_relative_to(root) or candidate.suffix.lower() not in ('.jpg','.jpeg','.png','.webp','.gif') or not candidate.is_file():
            raise HTTPException(404, 'Image not found')
        try:
            info = candidate.stat()
            content = variant(str(candidate),info.st_mtime_ns,info.st_size,width)
        except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombError):
            raise HTTPException(422, 'Unable to process image')
        headers={'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}
        return FileResponse(candidate,headers=headers) if content is None else Response(content,media_type='image/webp',headers=headers)
