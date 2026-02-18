"""
Storage service for media uploads
Supports Cloudflare R2 and AWS S3
"""
import os
import io
import uuid
import logging
from typing import Optional, Tuple
from datetime import datetime, timezone

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Configuration
STORAGE_PROVIDER = os.environ.get("STORAGE_PROVIDER", "R2")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "septa-media")
PUBLIC_CDN_BASE_URL = os.environ.get("PUBLIC_CDN_BASE_URL", "")

# S3-compatible config
ACCESS_KEY = os.environ.get("R2_ACCESS_KEY") or os.environ.get("AWS_ACCESS_KEY_ID", "")
SECRET_KEY = os.environ.get("R2_SECRET_KEY") or os.environ.get("AWS_SECRET_ACCESS_KEY", "")
ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL") or os.environ.get("S3_ENDPOINT_URL", "")

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf"}
ALLOWED_MODEL_TYPES = {"model/gltf-binary", "model/gltf+json", "application/octet-stream"}

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif",  # Images
    ".mp4", ".webm", ".mov",  # Videos
    ".pdf",  # Documents
    ".glb", ".gltf",  # 3D models
}

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB for videos


def get_s3_client():
    """Get S3-compatible client"""
    if not ACCESS_KEY or not SECRET_KEY:
        logger.warning("Storage credentials not configured")
        return None
    
    config = Config(
        signature_version='s3v4',
        retries={'max_attempts': 3}
    )
    
    client_params = {
        'service_name': 's3',
        'aws_access_key_id': ACCESS_KEY,
        'aws_secret_access_key': SECRET_KEY,
        'config': config
    }
    
    if ENDPOINT_URL:
        client_params['endpoint_url'] = ENDPOINT_URL
    
    return boto3.client(**client_params)


def validate_file(filename: str, content_type: str, file_size: int) -> Tuple[bool, str]:
    """Validate uploaded file"""
    # Check extension
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File type {ext} not allowed"
    
    # Check content type
    all_allowed = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES | ALLOWED_DOCUMENT_TYPES | ALLOWED_MODEL_TYPES
    if content_type not in all_allowed and ext not in {'.glb', '.gltf'}:
        return False, f"Content type {content_type} not allowed"
    
    # Check size
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large (max {MAX_FILE_SIZE // (1024*1024)}MB)"
    
    return True, ""


def get_file_category(filename: str) -> str:
    """Determine file category from extension"""
    ext = os.path.splitext(filename.lower())[1]
    if ext in {'.jpg', '.jpeg', '.png', '.webp', '.gif'}:
        return 'images'
    elif ext in {'.mp4', '.webm', '.mov'}:
        return 'videos'
    elif ext == '.pdf':
        return 'documents'
    elif ext in {'.glb', '.gltf'}:
        return 'models'
    return 'other'


def generate_storage_key(filename: str, category: str = None) -> str:
    """Generate unique storage key with organized path"""
    ext = os.path.splitext(filename.lower())[1]
    if not category:
        category = get_file_category(filename)
    
    # Organize by date and category
    date_prefix = datetime.now(timezone.utc).strftime("%Y/%m")
    unique_id = str(uuid.uuid4())[:8]
    
    # Clean filename
    clean_name = "".join(c for c in filename if c.isalnum() or c in '._-').lower()
    clean_name = clean_name[:50]  # Limit length
    
    return f"{category}/{date_prefix}/{unique_id}_{clean_name}"


async def upload_file(
    file_content: bytes,
    filename: str,
    content_type: str,
    custom_key: str = None
) -> Optional[dict]:
    """
    Upload file to storage
    Returns dict with url and metadata
    """
    client = get_s3_client()
    if not client:
        logger.error("Storage client not available")
        return None
    
    # Validate
    is_valid, error = validate_file(filename, content_type, len(file_content))
    if not is_valid:
        logger.error(f"File validation failed: {error}")
        return None
    
    # Generate key
    storage_key = custom_key or generate_storage_key(filename)
    
    try:
        # Upload to S3/R2
        client.put_object(
            Bucket=BUCKET_NAME,
            Key=storage_key,
            Body=file_content,
            ContentType=content_type,
        )
        
        # Build URL
        if PUBLIC_CDN_BASE_URL:
            file_url = f"{PUBLIC_CDN_BASE_URL.rstrip('/')}/{storage_key}"
        else:
            file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{storage_key}"
        
        logger.info(f"File uploaded successfully: {storage_key}")
        
        return {
            "url": file_url,
            "key": storage_key,
            "filename": filename,
            "content_type": content_type,
            "size": len(file_content),
            "category": get_file_category(filename),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
    except ClientError as e:
        logger.error(f"Upload failed: {str(e)}")
        return None


async def delete_file(storage_key: str) -> bool:
    """Delete file from storage"""
    client = get_s3_client()
    if not client:
        return False
    
    try:
        client.delete_object(Bucket=BUCKET_NAME, Key=storage_key)
        logger.info(f"File deleted: {storage_key}")
        return True
    except ClientError as e:
        logger.error(f"Delete failed: {str(e)}")
        return False


async def get_presigned_upload_url(
    filename: str,
    content_type: str,
    expires_in: int = 3600
) -> Optional[dict]:
    """
    Generate presigned URL for direct client upload
    Used for large files to avoid server memory issues
    """
    client = get_s3_client()
    if not client:
        return None
    
    storage_key = generate_storage_key(filename)
    
    try:
        presigned_url = client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': storage_key,
                'ContentType': content_type
            },
            ExpiresIn=expires_in
        )
        
        # Final URL after upload
        if PUBLIC_CDN_BASE_URL:
            final_url = f"{PUBLIC_CDN_BASE_URL.rstrip('/')}/{storage_key}"
        else:
            final_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{storage_key}"
        
        return {
            "upload_url": presigned_url,
            "final_url": final_url,
            "key": storage_key,
            "expires_in": expires_in
        }
    except ClientError as e:
        logger.error(f"Presigned URL generation failed: {str(e)}")
        return None
