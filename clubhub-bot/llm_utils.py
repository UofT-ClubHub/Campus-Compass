import os
from transformers import pipeline
from huggingface_hub import login
from dotenv import load_dotenv

load_dotenv()

# Authenticate once
login(token=os.getenv("HF_TOKEN"))

# Zero-shot classifier
_classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli",
    use_auth_token=os.getenv("HF_TOKEN")
)

# LLM for title generation
_title_gen = pipeline(
    "text2text-generation",
    model="google/flan-t5-base"
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
    return result["labels"][0]

def get_title(text: str) -> str:
    prompt = f"Generate a concise title for the following post:\n\n{text}"
    outputs = _title_gen(prompt, max_new_tokens=20)
    return outputs[0]["generated_text"].strip()

# Example usage
if __name__ == "__main__":
    post = "We're hosting a campus-wide hackathon this Saturday—sign up now!"
    print("Label:", classify_post(post))
    print("Title:", get_title(post))
