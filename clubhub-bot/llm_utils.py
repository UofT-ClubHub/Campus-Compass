import os
import google.generativeai as genai
import requests
from PIL import Image
from io import BytesIO
from transformers import pipeline
from huggingface_hub import login
from dotenv import load_dotenv
from datetime import datetime

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
    prompt = f"""
    Generate a concise, clear title for the following post:

    Text content:
    {text}"""

    if image_url:
        prompt += f"""Also consider the image content when generating the title."""

    prompt += f"""
    Your response must be exactly in this format: 'Title' and NOTHING ELSE.
    """

    # Create the model
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    content = [prompt]
    
    # Add image if provided
    if image_url:
        try: 
            # Download image from URL
            response = requests.get(image_url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            content.append(img)
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
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    prompt = f"""Extract the event date from the following post content. Look for:
            - Specific dates
            - Days of the week with context
            - Time expressions that indicate when an event occurs
            
    Current date (today): {current_date}
    Use this to interpret relative dates like "tomorrow", "next week", etc."""
                
    # Add image-specific instructions if image is provided
    if image_url:
        prompt += """
        - Calendar elements or date displays in the image
        - Any dates visible in the image content"""
    
    prompt += f"""
    Only return the date if you can determine a specific date.
    If no specific date can be determined, return 'None'.
    
    Text content:
    {text}"""

    prompt += f"""
    Your response must be exactly in this format: '%Y-%m-%dT%H:%M:%S.000Z' or 'None' and NOTHING ELSE.
    """

    # Create the model
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    content = [prompt]
    
    # Add image if provided
    if image_url:
        try:
            # Download image from URL
            response = requests.get(image_url)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            content.append(img)
        except Exception as e:
            print(f"Error loading image for date extraction: {e}")
            # Continue without image

    try:
        response = model.generate_content(content, generation_config=genai.types.GenerationConfig(temperature=0.25))
        extracted_date = response.text.strip()
        
        # Validate the response
        if extracted_date.lower() == "none" or not extracted_date:
            print(f"No event date found in post")
            return None

        print(f"Extracted event date: {extracted_date}")
        return extracted_date
        
    except Exception as e:
        print(f"Error extracting event date: {e}")
        return None
