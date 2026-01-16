import os
import google.generativeai as genai
import requests
import json
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
from datetime import datetime, timedelta
import pytz

load_dotenv()

genai.configure(api_key=os.getenv("GENAI_API_KEY"))

class PostAnalyzer:

    def __init__(self):
        self._last_analysis = {}

    def analyze_post_complete(self, text: str, image_url: str = None) -> dict:
        """
        Analyze post content using Gemini in a single call.
        Returns a dictionary with category, title, date_occurring, and location.
        """
        # Get current date in EST/Toronto timezone, subtract 1 day to catch posts from "today"
        toronto_tz = pytz.timezone('America/Toronto')
        current_date = (datetime.now(toronto_tz) - timedelta(days=1)).strftime("%Y-%m-%d")

        prompt = f"""
        Analyze the following post and provide a JSON response with the following fields:

        1. "category": Classify into one of these categories:
            - "Event": a planned activity that could have a specific date and time.
            - "Hiring Opportunity": a job opportunity or role that is currently available.
            - "General Announcement": a post that is not related to a specific event or hiring opportunity.
            - "Survey": a survey that is asking for feedback or opinions.
        2. "title": Generate a concise, clear title for the post
        3. "date_occurring": Extract the event date and time in ISO format (YYYY-MM-DDTHH:MM:SS.000Z), or "none" if no specific date.
           - Use the EXACT dates as mentioned in the pos
           - DO NOT perform any timezone conversions
           - If a specific time is mentioned, include it exactly as stated
           - If NO specific time is mentioned, default to 00:00:00 (midnight/12 AM)
        4. "location": Extract the location of the event or activity, or "none" if no specific location can be determined.

        Current date (reference for today): {current_date}
        This date is in EST timezone. Use this to interpret relative dates like "tomorrow", "next week", etc.
        DO NOT convert times to different timezones - use times exactly as stated in the post.

        Here is the text content of the post: {text}
        """

        if image_url:
            prompt += f"""Also consider the image content when analyzing."""

        prompt += f"""
        Your response must be ONLY a valid JSON object exactly in this format:
        {{
            "category": "Event" or "Hiring Opportunity" or "General Announcement" or "Survey",
            "title": "Title of the post",
            "date_occurring": "YYYY-MM-DDTHH:MM:SS.000Z" or "none" (use 00:00:00 if no time specified),
            "location": "Location of the event or activity" or "none"
        }}

        CRITICAL: Use exact times from the post. DO NOT convert timezones. If no time is given, use 00:00:00.
        """

        # Create the model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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
                print(f"Error loading image for analysis: {e}")
        
        print(content)

        try:
            response = model.generate_content(content, generation_config=genai.types.GenerationConfig(temperature=0.2))
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            # Validate category
            if result.get("category") not in ["Event", "Hiring Opportunity", "General Announcement", "Survey"]:
                result["category"] = "General Announcement"

            # Validate date_occurring
            date_occurring = result.get("date_occurring")
            if not date_occurring or date_occurring.lower() == "none":
                result["date_occurring"] = None
            else:
                result["date_occurring"] = date_occurring

            # Validate location
            if result.get("location") and result["location"].lower() == "none":
                result["location"] = None
            
            # Cache the result
            self._last_analysis = result
            
            print(f"Analysis complete - Category: {result['category']}, Title: {result['title']}, Date: {result.get('date_occurring')}, Location: {result.get('location')}")
            return result
            
        except Exception as e:
            print(f"Error analyzing post: {e}")
            # Return default values
            default_result = {
                "category": "General Announcement",
                "title": "Untitled Post",
                "date_occurring": None,
                "location": None
            }
            self._last_analysis = default_result
            return default_result
    
    def get_category(self) -> str:
        return self._last_analysis.get("category")
    
    def get_title(self) -> str:
        return self._last_analysis.get("title")
    
    def get_date_occurring(self) -> str:
        return self._last_analysis.get("date_occurring")
    
    def get_location(self) -> str:
        return self._last_analysis.get("location")

analyzer = PostAnalyzer()
