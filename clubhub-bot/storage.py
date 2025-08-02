# storage_utils.py
import re
import time
from pathlib import Path
from urllib.parse import urlparse, unquote

from firebase_admin import storage as admin_storage
import firebase_admin

# Grab the default bucket (ensure firebase_admin.initialize_app(...) has been called)
def _default_bucket():
    # If not initialized elsewhere, you can uncomment and configure:
    # if not firebase_admin._apps:
    #     firebase_admin.initialize_app(options={"storageBucket": "your-project-id.appspot.com"})
    return admin_storage.bucket()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _url_encode_gcs_path(path: str) -> str:
    """URL encode a GCS object path for use in Firebase Storage URLs."""
    from urllib.parse import quote
    return quote(path, safe='')


def get_content_type(extension: str) -> str:
    """Return the MIME type for the given file extension."""
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg", 
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp"
    }
    return content_types.get(extension.lower(), "image/jpeg")


def upload_image(file_buffer: bytes, file_name: str, folder: str = "posts") -> str:
    """
    Upload an image to Firebase Storage and return a public download URL
    (firebase-style: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media).
    """
    if not file_buffer:
        raise ValueError("No file provided")

    extension = Path(file_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.")

    if len(file_buffer) > MAX_BYTES:
        raise ValueError("File size must be less than 5MB")

    try:
        timestamp = int(time.time() * 1000)
        safe_name = re.sub(r"[^a-zA-Z0-9.\-]", "_", file_name)
        object_path = f"{folder}/{timestamp}_{safe_name}"
        content_type = get_content_type(extension)

        bucket = _default_bucket()
        blob = bucket.blob(object_path)

        # Upload bytes
        blob.upload_from_string(file_buffer, content_type=content_type)

        # Make public (optional, but mirrors your TS code)
        blob.make_public()

        # Return Firebase-style download URL (matches your original)
        return (
            f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
            f"{_url_encode_gcs_path(object_path)}?alt=media"
        )
    except Exception as e:
        print("Upload error:", e)
        raise RuntimeError("Failed to upload image") from e