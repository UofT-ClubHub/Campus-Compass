import json
import os
import firebase_client
from firebase_client import db
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

instagram_links = firebase_client.get_instagram_links()


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

# Save results to a JSON file
with open("output.json", "w", encoding="utf-8") as f:
    json.dump(items, f, indent=4, ensure_ascii=False)


firebase_client.upload_posts("output.json", collection_name="Posts")