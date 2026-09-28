"""Validate actual image bytes and their destination before public upload."""
from io import BytesIO
from PIL import Image, UnidentifiedImageError

IMAGE_RULES = {
    'portrait_image': (4/5, '4:5', 600),
    'testimonial_portrait': (1, '1:1', 600),
    'logo_image': (1, '1:1', 256),
    'social_image': (1.91, '1.91:1', 600),
    'virtual_tour_image': (2, '2:1', 1200),
    **{name: (16/9, '16:9', 600) for name in (
        'card_image', 'hero_image', 'gallery_images', 'video_poster', 'project_cover',
        'project_gallery', 'project_render', 'testimonial_cover', 'page_hero',
        'page_image', 'public_plan', 'page_video', 'partner_video', 'project_video')},
}

def validate_image(content, role='page_image'):
    if role not in IMAGE_RULES:
        return 'Choose a supported image destination before uploading.'
    ratio, label, minimum = IMAGE_RULES[role]
    try:
        with Image.open(BytesIO(content)) as image:
            if image.format not in {'JPEG', 'PNG', 'WEBP', 'GIF'}:
                return 'Upload a JPG, PNG, WebP or GIF image.'
            width, height = image.size
            if width * height > 40_000_000:
                return 'Use an image under 40 megapixels.'
            if image.getexif().get(274) in (5, 6, 7, 8):
                width, height = height, width
            if abs(width - ratio * height) > max(1, ratio):
                return f'{label} required for {role.replace("_", " ")}. This file is {width} × {height}. Crop or pad it before uploading.'
            if width < minimum:
                return f'Use an image at least {minimum}px wide.'
            if role == 'logo_image':
                alpha = image.convert('RGBA').getchannel('A')
                if alpha.getextrema()[0] == 255:
                    return 'Logo background must be transparent. Export a PNG or WebP with a real alpha channel; do not add a white box.'
        with Image.open(BytesIO(content)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        return 'This image could not be decoded. Export a fresh JPG, PNG or WebP.'
    return ''
