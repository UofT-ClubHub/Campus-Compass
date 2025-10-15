import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
import json
from dotenv import load_dotenv
import llm_utils
import requests
from io import BytesIO
from storage import upload_image
from datetime import datetime, timezone

load_dotenv()  

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

def get_instagram_links():
    instagram_links = []
    mapping = {}

    clubs_ref = db.collection("Clubs")
    
    doc = clubs_ref.get()

    for club in doc:
        data = club.to_dict() or {}
        instagram_link = data.get("instagram", "").strip()
        campus = data.get("campus", "").strip()
        club_id = data.get("id", "").strip()
        if instagram_link:
            # Remove @ symbol if present
            instagram_link = instagram_link.lstrip('@')
            # Format as full Instagram URL
            formatted_link = f"https://www.instagram.com/{instagram_link}/"
            instagram_links.append(formatted_link)
            # Map the link to its campus
            mapping[formatted_link] = {
                "campus": campus,
                "id": club_id
            }

    print(mapping)

    return instagram_links, mapping

#JSON key -> Firestore fields
KEY_MAP = {
    "url": "links",
    "caption": "details",
    "displayUrl": "image",
    "timestamp": "date_posted",
    "hashtags": "hashtags",
    "videoUrl": "video"
}

FIELD_DEFAULTS = {
    "campus": "",
    "club": "",
    "date_occurring": None,
    "date_posted": None,
    "details": "",
    "hashtags": [],
    "image": "",
    "likes": 0,
    "links": [],
    "title": "",
    "video": "" 
}

def upload_posts(json_path: str, mapping: str, collection_name: str = "Posts"):
    
    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    batch = db.batch()

    for item in items:
        doc_data = FIELD_DEFAULTS.copy()

        owner_url = item.get("inputUrl", "")
        post_url = item.get("url", "")
        
        for src_key, dst_key in KEY_MAP.items():
            if src_key in item and item[src_key] is not None:
                val = item[src_key]
                if src_key == "url":
                    doc_data["club"] = mapping.get(owner_url, {}).get("id")
                    doc_data["campus"] = mapping.get(owner_url, {}).get("campus")
                    hashtags = item.get('hashtags') or []
                    post_context = f"Caption: {item.get('caption')}\nHashtags: {', '.join(hashtags)}"
                    doc_data["category"] = llm_utils.classify_post(post_context)
                    doc_data["title"] = llm_utils.get_title(post_context)
                    doc_data["date_occurring"] = llm_utils.extract_event_date(post_context)
                    doc_data["links"] = [post_url]
                elif src_key == "displayUrl":
                    # Upload image to Firebase Storage
                    doc_data[dst_key] = url_to_firebase_storage(val)
                else:
                    doc_data[dst_key] = val

        doc_id = doc_data.get("postId")
        if doc_id:
            doc_ref = db.collection(collection_name).document(doc_id)
        else:
            doc_ref = db.collection(collection_name).document()

        batch.set(doc_ref, doc_data) 

    batch.commit()  
    print(f"\n✅ Uploaded {len(items)} documents to '{collection_name}'")

def url_to_firebase_storage(url):
    """
    Download image from URL and upload to Firebase Storage.
    Returns the Firebase Storage download URL.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Get file extension from URL
        file_extension = url.split('.')[-1].split('?')[0]  # Remove query params
        if file_extension not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            file_extension = 'jpg'  # Default fallback
        
        # Create filename from URL
        filename = f"instagram_post.{file_extension}"
        
        # Upload to Firebase Storage
        firebase_url = upload_image(response.content, filename, folder="posts")
        return firebase_url
        
    except Exception as e:
        print(f"Error uploading image to Firebase Storage: {e}")
        return url  # Return original URL if upload fails
