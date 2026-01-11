import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage as admin_storage
import os
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse, unquote
import re

load_dotenv()

# Initialize Firebase Admin if not already initialized
if not firebase_admin._apps:
    cred_config = {
        "type": "service_account",
        "project_id": os.getenv("ADMIN_FIREBASE_PROJECT_ID"),
        "private_key": os.getenv("ADMIN_FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("ADMIN_FIREBASE_CLIENT_EMAIL"),
        "token_uri": "https://oauth2.googleapis.com/token",
    }

    if not all(cred_config.values()):
        raise ValueError("One or more Firebase admin environment variables are not set")

    cred = credentials.Certificate(cred_config)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'clubhub-10e01.firebasestorage.app'
    })

db = firestore.client()
bucket = admin_storage.bucket()


def extract_storage_path_from_url(url: str) -> str | None:
    """
    Extract the storage path from a Firebase Storage URL.
    Returns: posts/123_image.jpg
    """
    if not url or "firebasestorage.googleapis.com" not in url:
        return None

    try:
        # Parse URL and extract the path component after /o/
        match = re.search(r'/o/([^?]+)', url)
        if match:
            # URL decode the path
            encoded_path = match.group(1)
            decoded_path = unquote(encoded_path)
            return decoded_path
    except Exception as e:
        print(f"Error extracting storage path from URL: {e}")

    return None


def delete_image_from_storage(image_url: str) -> bool:
    """
    Delete an image from Firebase Storage given its URL.
    Returns True if successful or if image doesn't exist, False on error.
    """
    if not image_url:
        return True

    storage_path = extract_storage_path_from_url(image_url)
    if not storage_path:
        print(f"Could not extract storage path from URL: {image_url}")
        return False

    try:
        blob = bucket.blob(storage_path)
        if blob.exists():
            blob.delete()
            print(f"  Deleted image: {storage_path}")
            return True
        else:
            print(f"  Image not found (already deleted?): {storage_path}")
            return True
    except Exception as e:
        print(f"  Error deleting image {storage_path}: {e}")
        return False


def cleanup_old_posts(days_old: int = 30):
    """
    Delete posts older than the specified number of days and their associated images.

    Args:
        days_old: Delete posts older than this many days (default: 30)

    Returns:
        Number of posts deleted
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)

    posts_ref = db.collection("Posts")

    # Query posts with date_posted older than cutoff
    old_posts = posts_ref.where("date_posted", "<", cutoff_date.isoformat()).stream()

    deleted_count = 0

    batch = db.batch()
    batch_count = 0
    MAX_BATCH_SIZE = 500  # Firestore batch limit

    for post in old_posts:
        post_data = post.to_dict()
        post_id = post.id
        image_url = post_data.get("image", "")

        # Delete associated image from storage
        if image_url:
            delete_image_from_storage(image_url)

        # Add post deletion to batch
        batch.delete(posts_ref.document(post_id))
        batch_count += 1

        # Commit batch if we've reached the limit
        if batch_count >= MAX_BATCH_SIZE:
            batch.commit()
            batch = db.batch()
            batch_count = 0

        deleted_count += 1

    # Commit any remaining deletions in the batch
    if batch_count > 0:
        batch.commit()

    return deleted_count


def cleanup_old_pending_clubs(days_old: int = 30):
    """
    Delete pending clubs older than the specified number of days and their associated images.

    Args:
        days_old: Delete pending clubs older than this many days (default: 30)

    Returns:
        Number of pending clubs deleted
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)

    pending_clubs_ref = db.collection("Pending_Clubs")

    # Query pending clubs with created_at older than cutoff
    old_pending_clubs = pending_clubs_ref.where("created_at", "<", cutoff_date.isoformat()).stream()

    deleted_count = 0

    batch = db.batch()
    batch_count = 0
    MAX_BATCH_SIZE = 500  # Firestore batch limit

    for pending_club in old_pending_clubs:
        pending_club_data = pending_club.to_dict()
        pending_club_id = pending_club.id
        club_image = pending_club_data.get("club_image", "")

        # Delete associated image from storage
        if club_image:
            delete_image_from_storage(club_image)

        # Add pending club deletion to batch
        batch.delete(pending_clubs_ref.document(pending_club_id))
        batch_count += 1

        # Commit batch if we've reached the limit
        if batch_count >= MAX_BATCH_SIZE:
            batch.commit()
            batch = db.batch()
            batch_count = 0

        deleted_count += 1

    # Commit any remaining deletions in the batch
    if batch_count > 0:
        batch.commit()

    return deleted_count


def cleanup_old_storage_images(days_old: int = 30):
    """
    Directly scan storage bucket and delete images older than the specified number of days
    from the 'posts' and 'pending-clubs' folders.

    Args:
        days_old: Delete images older than this many days (default: 30)

    Returns:
        Tuple of (posts_images_deleted, pending_clubs_images_deleted)
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)

    posts_deleted = 0
    pending_clubs_deleted = 0

    # Delete old images from posts folder
    posts_blobs = bucket.list_blobs(prefix="posts/")
    for blob in posts_blobs:
        if blob.time_created and blob.time_created < cutoff_date:
            try:
                blob.delete()
                print(f"  Deleted old post image: {blob.name}")
                posts_deleted += 1
            except Exception as e:
                print(f"  Error deleting {blob.name}: {e}")

    # Delete old images from pending-clubs folder
    pending_clubs_blobs = bucket.list_blobs(prefix="pending-clubs/")
    for blob in pending_clubs_blobs:
        if blob.time_created and blob.time_created < cutoff_date:
            try:
                blob.delete()
                print(f"  Deleted old pending club image: {blob.name}")
                pending_clubs_deleted += 1
            except Exception as e:
                print(f"  Error deleting {blob.name}: {e}")

    return posts_deleted, pending_clubs_deleted
