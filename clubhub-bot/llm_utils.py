import os
import google.generativeai as genai
import requests
from PIL import Image
from io import BytesIO
from transformers import pipeline
from huggingface_hub import login
from dotenv import load_dotenv

load_dotenv()

# Authenticate once
login(token=os.getenv("HF_TOKEN"))

genai.configure(api_key=os.getenv("GENAI_API_KEY"))

# Zero-shot classifier
_classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli",
    device="cpu"
)

def classify_post(text: str, labels: list[str] | None = None) -> str:
    if labels is None:
        labels = [
            "Event",
            "Hiring Opportunity",
            "General Announcement",
            "Survey"
        ]
    result = _classifier(text, labels)
    print(f"Classification result: {result['labels'][0]} with score {result['scores'][0]:.4f}")
    return result["labels"][0]

def get_title(text: str, image_url: str = None) -> str:
    prompt = f"Generate a concise, clear title for the following post:\n\n{text}"

    # Create the model
    model = genai.GenerativeModel('gemini-1.5-m')
    
    content = [prompt]
    
    # Add image if provided
    if image_url:
        try: 
            # Download image from URL
            response = requests.get(image_url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            content.append(img)
            prompt = f"Generate a concise, clear title for this post. Consider both the text and image content:\n\nText: {text}"
            content[0] = prompt
        except Exception as e:
            print(f"Error loading image: {e}")
            # Continue without image

    response = model.generate_content(content, generation_config=genai.types.GenerationConfig(temperature=0.2))

    title = response.text.strip()
    print(f"Generated title: {title}")
    return title

def extract_event_date(text: str, image_url: str = None) -> str:
    """
    Extract event date from post text and image.
    Returns ISO format date string or None if no date found.
    """
    prompt = f"""Extract the event date from the following post content. Look for:
- Specific dates (e.g., "January 15", "Dec 3rd", "March 22, 2024")
- Days of the week with context (e.g., "this Friday", "next Tuesday")
- Time expressions that indicate when an event occurs

Only return the date in ISO format (YYYY-MM-DD) if you can determine a specific date. 
If no specific date can be determined, return "None".

Post content:
{text}"""

    # Create the model
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    content = [prompt]
    
    # Add image if provided
    if image_url:
        try:
            import requests
            from PIL import Image
            from io import BytesIO
            
            # Download image from URL
            response = requests.get(image_url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            content.append(img)
            prompt = f"""Extract the event date from both the text and image content. Look for:
- Specific dates in text or visible in the image
- Days of the week with context
- Calendar elements or date displays in the image
- Time expressions that indicate when an event occurs

Only return the date in the following format "%Y-%m-%dT%H:%M:%S.000Z if you can determine a specific date.
If no specific date can be determined, return "None".

Text content:
{text}"""
            content[0] = prompt
        except Exception as e:
            print(f"Error loading image for date extraction: {e}")
            # Continue without image

    try:
        response = model.generate_content(content, generation_config=genai.types.GenerationConfig(temperature=0.1))
        extracted_date = response.text.strip()
        
        # Validate the response
        if extracted_date.lower() == "none" or not extracted_date:
            print(f"No event date found in post")
            return None
        
        # Try to parse the date and convert to ISO 8601 with time and Z
        return extracted_date
        
    except Exception as e:
        print(f"Error extracting event date: {e}")
        return None
