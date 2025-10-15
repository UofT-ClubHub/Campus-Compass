import json
import os
import firebase_client
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

# Get all Instagram links and mapping from Firebase
instagram_links, mapping = firebase_client.get_instagram_links()
print(f"Found {len(instagram_links)} Instagram accounts to scrape")

# Filter to only scrape specific account(s) if desired
instagram_links = ["https://www.instagram.com/ds3.utsc/"]

# Initialize the ApifyClient with the API token from .env
apify_api_key = os.getenv("APIFY_KEY")
if not apify_api_key:
    raise RuntimeError("APIFY_KEY not found in environment variables")
client = ApifyClient(apify_api_key)

# Prepare the Actor input
run_input = {
    "directUrls": instagram_links,
    "resultsType": "posts",
    "resultsLimit": 2,
    "searchType": "hashtag",
    "searchLimit": 1,
    "addParentData": False,
    "scrapeComments": False,
    "scrapeLikes": False,
    "scrapeReels": False,
    "scrapeStories": False,
    "scrapePosts": True,
    "scrapeMentions": False,
    "videoUrl": True,
}

# Run the Actor and wait for it to finish
run = client.actor("RB9HEZitC8hIUXAha").call(run_input=run_input)
items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
items = [item for item in items if "error" not in item]

print(f"Found {len(items)} total items from scraping")

if items:
    with open("output.json", "w", encoding="utf-8") as f:
        json.dump(items, f, indent=4, ensure_ascii=False)

    firebase_client.upload_posts("output.json", mapping)

    if os.path.exists("output.json"):
        os.remove("output.json")
        print("\nCleaned up output.json")
    
    print(f"Added {len(items)} posts to database")
else:
    print("No posts to add")
