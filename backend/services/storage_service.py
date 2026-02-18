"""
Storage service for media uploads
Supports Cloudflare R2 / AWS S3 with local fallback
"""
import os
import io
import uuid
import shutil
import logging
from typing import Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path

try:
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

logger = logging.getLogger(__name__)

# Configuration
STORAGE_PROVIDER = os.environ.get("STORAGE_PROVIDER", "LOCAL")  # R2, S3, or LOCAL
BUCKET_NAME = os.environ.get("BUCKET_NAME", "septa-media")
PUBLIC_CDN_BASE_URL = os.environ.get("PUBLIC_CDN_BASE_URL", "")

# S3-compatible config
ACCESS_KEY = os.environ.get("R2_ACCESS_KEY") or os.environ.get("AWS_ACCESS_KEY_ID", "")
SECRET_KEY = os.environ.get("R2_SECRET_KEY") or os.environ.get("AWS_SECRET_ACCESS_KEY", "")
ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL") or os.environ.get("S3_ENDPOINT_URL", "")

# Local storage config
LOCAL_UPLOAD_DIR = Path(os.environ.get("LOCAL_UPLOAD_DIR", "/app/uploads"))
LOCAL_UPLOAD_URL_PREFIX = "/uploads"

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


def is_cloud_storage_configured() -> bool:
    """Check if cloud storage (R2/S3) is properly configured"""
    if not HAS_BOTO3:
        return False
    if not ACCESS_KEY or ACCESS_KEY == "placeholder":
        return False
    if not SECRET_KEY or SECRET_KEY == "placeholder":
        return False
    if STORAGE_PROVIDER not in ["R2", "S3"]:
        return False
    return True


def get_s3_client():
    """Get S3-compatible client"""
    if not is_cloud_storage_configured():
        logger.info("Cloud storage not configured, using local fallback")
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
    
    try:
        return boto3.client(**client_params)
    except Exception as e:
        logger.error(f"Failed to create S3 client: {e}")
        return None


def validate_file(filename: str, content_type: str, file_size: int) -> Tuple[bool, str]:
    """Validate uploaded file"""
    # Check extension
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File type {ext} not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
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


async def upload_file_local(
    file_content: bytes,
    filename: str,
    content_type: str
) -> Optional[dict]:
    """Upload file to local storage"""
    storage_key = generate_storage_key(filename)
    file_path = LOCAL_UPLOAD_DIR / storage_key
    
    # Create directories
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        file_url = f"{LOCAL_UPLOAD_URL_PREFIX}/{storage_key}"
        
        logger.info(f"File uploaded locally: {storage_key}")
        
        return {
            "url": file_url,
            "key": storage_key,
            "filename": filename,
            "content_type": content_type,
            "size": len(file_content),
            "category": get_file_category(filename),
            "storage": "local",
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Local upload failed: {e}")
        return None


async def upload_file_cloud(
    file_content: bytes,
    filename: str,
    content_type: str
) -> Optional[dict]:
    """Upload file to cloud storage (R2/S3)"""
    client = get_s3_client()
    if not client:
        return None
    
    storage_key = generate_storage_key(filename)
    
    try:
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
        
        logger.info(f"File uploaded to cloud: {storage_key}")
        
        return {
            "url": file_url,
            "key": storage_key,
            "filename": filename,
            "content_type": content_type,
            "size": len(file_content),
            "category": get_file_category(filename),
            "storage": STORAGE_PROVIDER.lower(),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
    except ClientError as e:
        logger.error(f"Cloud upload failed: {e}")
        return None


async def upload_file(
    file_content: bytes,
    filename: str,
    content_type: str,
    custom_key: str = None
) -> Optional[dict]:
    """
    Upload file to storage (cloud or local fallback)
    Returns dict with url and metadata
    """
    # Validate
    is_valid, error = validate_file(filename, content_type, len(file_content))
    if not is_valid:
        logger.error(f"File validation failed: {error}")
        return None
    
    # Try cloud storage first
    if is_cloud_storage_configured():
        result = await upload_file_cloud(file_content, filename, content_type)
        if result:
            return result
        logger.warning("Cloud upload failed, falling back to local")
    
    # Fallback to local storage
    return await upload_file_local(file_content, filename, content_type)


async def delete_file(storage_key: str, storage_type: str = None) -> bool:
    """Delete file from storage"""
    if storage_type == "local" or not is_cloud_storage_configured():
        # Delete from local
        file_path = LOCAL_UPLOAD_DIR / storage_key
        try:
            if file_path.exists():
                os.remove(file_path)
                logger.info(f"Local file deleted: {storage_key}")
                return True
        except Exception as e:
            logger.error(f"Local delete failed: {e}")
        return False
    
    # Delete from cloud
    client = get_s3_client()
    if not client:
        return False
    
    try:
        client.delete_object(Bucket=BUCKET_NAME, Key=storage_key)
        logger.info(f"Cloud file deleted: {storage_key}")
        return True
    except ClientError as e:
        logger.error(f"Cloud delete failed: {e}")
        return False


async def get_presigned_upload_url(
    filename: str,
    content_type: str,
    expires_in: int = 3600
) -> Optional[dict]:
    """
    Generate presigned URL for direct client upload
    Only works with cloud storage
    """
    client = get_s3_client()
    if not client:
        return {"error": "Cloud storage not configured", "use_direct_upload": True}
    
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
        logger.error(f"Presigned URL generation failed: {e}")
        return None


def get_storage_status() -> dict:
    """Get current storage configuration status"""
    return {
        "provider": STORAGE_PROVIDER if is_cloud_storage_configured() else "LOCAL",
        "cloud_configured": is_cloud_storage_configured(),
        "local_path": str(LOCAL_UPLOAD_DIR),
        "bucket": BUCKET_NAME if is_cloud_storage_configured() else None,
        "cdn_url": PUBLIC_CDN_BASE_URL if is_cloud_storage_configured() else None
    }
