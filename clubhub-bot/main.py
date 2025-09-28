import json
import os
import firebase_client
from apify_client import ApifyClient
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta

load_dotenv()

# Capture the current scrape time
scrape_time = datetime.now(timezone.utc)
# Get last scraped date from firebase
last_scraped_date = scrape_time - timedelta(days=1)

instagram_links, mapping = firebase_client.get_instagram_links()

def _select_apify_key():
    """Select APIFY key based on day rotation, with fallback."""
    today_utc = datetime.now(timezone.utc).date()
    day_of_year = today_utc.timetuple().tm_yday
    index = ((day_of_year - 1) % 8) + 1

    selected_env_name = f"APIFY_KEY_{index}"
    selected_key = os.getenv(selected_env_name)

    if not selected_key:
        raise RuntimeError("No APIFY key found in environment. Set APIFY_KEY_1..8")

    print(f"Rotating APIFY key: using {selected_env_name} (index {index})")
    return selected_key

# Initialize the ApifyClient with the selected API token
apify_api_key = _select_apify_key()
client = ApifyClient(apify_api_key)

# Prepare the Actor input
run_input = {
    "directUrls": instagram_links,
    "resultsType": "posts",
    "resultsLimit": 10,
    "searchType": "hashtag",
    "searchLimit": 1,
    "addParentData": False,
    "scrapeComments": False,
    "scrapeLikes": False,
    "scrapeReels": False,
    "scrapeStories": False,
    "scrapePosts": True,
    "scrapeMentions": False,
}

# Run the Actor and wait for it to finish
run = client.actor("RB9HEZitC8hIUXAha").call(run_input=run_input)
items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
items = [item for item in items if "error" not in item]

print(f"Last scraped date: {last_scraped_date}")
print(f"Current scrape time: {scrape_time}")

if last_scraped_date is None:
    print("No previous scrape date found - this is the first run or there was a parsing error")

print(f"Found {len(items)} total items from scraping")

new_items = []
for item in items:
    if 'timestamp' in item:
        # Parse post timestamp
        post_timestamp = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
        print(f"Post timestamp: {post_timestamp}")
        
        # If no previous scrape date or post is newer, include it
        if last_scraped_date is None or post_timestamp > last_scraped_date:
            new_items.append(item)
            print(f"  -> Including post (newer than last scrape)")
        else:
            print(f"  -> Skipping post (already scraped)")

# Only proceed if there are new items
if new_items:
    with open("output.json", "w", encoding="utf-8") as f:
        json.dump(new_items, f, indent=4, ensure_ascii=False)

    firebase_client.upload_posts("output.json", mapping)

    if os.path.exists("output.json"):
        os.remove("output.json")
        print("\nCleaned up output.json")
    
    print(f"Added {len(new_items)} new posts to database")
    
else:
    print("No new posts to add")
