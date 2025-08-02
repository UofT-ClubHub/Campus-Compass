import json
import os
import firebase_client
from apify_client import ApifyClient
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

# Capture the current scrape time
scrape_time = datetime.now(timezone.utc)

instagram_links, mapping = firebase_client.get_instagram_links()

# Initialize the ApifyClient with your API token
apify_api_key = os.getenv("APIFY_API_KEY")
client = ApifyClient(apify_api_key)

# Prepare the Actor input
run_input = {
    "directUrls": instagram_links,
    "resultsType": "posts",
    "resultsLimit": 1,
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


# Get last scraped date from firebase
last_scraped_date = firebase_client.get_last_scraped_date()
print(f"Last scraped date: {last_scraped_date}")
print(f"Current scrape time: {scrape_time}")

if last_scraped_date is None:
    print("No previous scrape date found - this is the first run or there was a parsing error")

print(f"Found {len(items)} total items from scraping")

# Filter items based on timestamp comparison
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
    # Save results to a JSON file
    with open("output.json", "w", encoding="utf-8") as f:
        json.dump(new_items, f, indent=4, ensure_ascii=False)

    firebase_client.upload_posts("output.json", mapping)

    # Clean up the output file
    if os.path.exists("output.json"):
        os.remove("output.json")
        print("\nCleaned up output.json")
    
    print(f"Added {len(new_items)} new posts to database")
    
    # Only update last scraped timestamp after successful processing
    firebase_client.update_last_scraped_date(scrape_time.isoformat())
else:
    print("No new posts to add")

