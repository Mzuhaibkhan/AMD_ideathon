import os
import json
import re
import google.generativeai as genai
from flask import Blueprint, request, jsonify
from ..supabase_client import supabase
from dotenv import load_dotenv

# Robustly load .env from the project root
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=api_key)

# Safety settings: Ensure Gemini doesn't block nutrition analysis
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    safety_settings=safety_settings
)

llm_bp = Blueprint("llm", __name__)

NUTRITION_PROMPT = """You are a precise nutrition extraction API.
Given a food description, extract nutritional data and return ONLY valid JSON.

Schema:
{{
  "food_item": "string",
  "calories": integer,
  "protein_g": float,
  "carbs_g": float,
  "fats_g": float,
  "fiber_g": float,
  "sugar_g": float,
  "sodium_mg": float,
  "category": "one of: Fast Food, Healthy, Protein, Fruit, Vegetable, Dairy, Grain, Snack, Beverage, Other",
  "meal_type": "one of: breakfast, lunch, dinner, snack",
  "cost": float (USD)
}}

Food description: "{text}"
Meal type hint: "{meal_type}"
"""

def extract_json(text):
    """Robustly extract JSON from a string that might contain markdown."""
    try:
        # Find anything between { and }
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(text)
    except Exception:
        # Fallback: remove markdown backticks manually
        clean = re.sub(r'```json|```', '', text).strip()
        return json.loads(clean)

@llm_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    text = data.get("text", "").strip()
    meal_type = data.get("meal_type", "lunch")

    if not text:
        return jsonify({"error": "No description provided"}), 400

    try:
        # Call Gemini
        response = model.generate_content(NUTRITION_PROMPT.format(text=text, meal_type=meal_type))
        
        if not response.text:
            return jsonify({"error": "Gemini returned an empty response. Check your API key or quota."}), 500
            
        nutrition = extract_json(response.text)
        nutrition["meal_type"] = meal_type

        # Attempt to save to Supabase
        try:
            supabase.table("food_logs").insert(nutrition).execute()
        except Exception as db_err:
            print(f"Database error (skipping save): {db_err}")
            # We still return the data even if DB save fails for this demo

        return jsonify(nutrition)

    except Exception as e:
        # Return the actual error message for debugging
        return jsonify({"error": f"Gemini Error: {str(e)}"}), 500
