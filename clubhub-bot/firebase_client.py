import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
import json
from dotenv import load_dotenv  
from datetime import datetime

load_dotenv()  

cred_path = os.getenv("FIREBASE_CREDENTIALS")
if not cred_path:
    raise ValueError("FIREBASE_CREDENTIALS environment variable not set")


cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

def get_instagram_links():
    instagram_links = []

    clubs_ref = db.collection("Clubs")
    
    doc = clubs_ref.get()

    for club in doc:
        data = club.to_dict() or {}
        instagram_link = data.get("instagram", "").strip()
        if instagram_link:
            # Remove @ symbol if present
            instagram_link = instagram_link.lstrip('@')
            # Format as full Instagram URL
            formatted_link = f"https://www.instagram.com/{instagram_link}/"
            instagram_links.append(formatted_link)

    return instagram_links

#JSON key -> Firestore fields
KEY_MAP = {
    "url": "links",
    "caption": "details",
    "displayUrl": "image",
    "timestamp": "date_posted",
    "hashtags": "hashtags"
}

CAMPUS_MAP = {
    "utsc": {"@amacss_utsc", "@gdscutsc", "@ds3.utsc", "@csecutsc", "@tennis.utsc", "@utscfooty", "@utschoops"},
    "utsg": {"@uoft_utmist", "@uoftfsae", "@uoftcssu"},
    "utm": {}
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
    "title": ""
}

def find_campus(handle: str):
    for campus, handles in CAMPUS_MAP.items():
        if handle in handles:
            return campus
    return None

def upload_posts(json_path: str, collection_name: str = "Posts"):
    
    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    batch = db.batch()

    for item in items:
        doc_data = FIELD_DEFAULTS.copy()

        for src_key, dst_key in KEY_MAP.items():
            if src_key in item and item[src_key] is not None:
                val = item[src_key]
                if src_key == "url":
                    club = val.removeprefix("https://www.instagram.com/").rstrip('/')
                    clubIG = f"@{club}"
                    doc_data["club"] = clubIG
                
                    # Find and assign campus if club handle exists in CAMPUS_MAP
                    campus = find_campus(clubIG)
                    if campus:
                        doc_data["campus"] = campus
                else:
                    doc_data[dst_key] = val

        doc_id = doc_data.get("postId")
        if doc_id:
            doc_ref = db.collection(collection_name).document(doc_id)
        else:
            doc_ref = db.collection(collection_name).document()

        batch.set(doc_ref, doc_data) 

    batch.commit()  
    print(f"✅ Uploaded {len(items)} documents to '{collection_name}'") 

if __name__ == "__main__":
    links = get_instagram_links()
    print("Instagram links found:")
    for url in links:
        print(" •", url)
