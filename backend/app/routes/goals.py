import os
import json
import re
from datetime import date, timedelta
from collections import defaultdict
import google.generativeai as genai
from flask import Blueprint, request, jsonify
from ..supabase_client import supabase
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-1.5-flash")

goals_bp = Blueprint("goals", __name__)

MEAL_PLAN_PROMPT = """You are a certified nutritionist and AI meal planner.

User's recent 30-day average daily intake:
- Calories: {avg_calories:.0f} kcal
- Protein: {avg_protein:.1f}g
- Carbs: {avg_carbs:.1f}g
- Fat: {avg_fats:.1f}g
- Daily food spend: ${avg_spend:.2f}

User's goals:
- Target daily calories: {calorie_goal} kcal
- Target protein: {protein_goal}g/day
- Target carbs: {carbs_goal}g/day
- Target fat: {fats_goal}g/day
- Daily budget: ${budget}/day
- Goal description: "{goal_description}"
- Target duration: {target_weeks} weeks

Generate a detailed 7-day meal plan to help this user reach their goal.
Return ONLY valid JSON with NO extra text:
{{
  "summary": "brief 2-sentence plan overview",
  "weekly_plan": [
    {{
      "day": "Monday",
      "meals": [
        {{"meal_type": "breakfast", "name": "Meal name", "calories": 400, "protein_g": 25, "carbs_g": 45, "fats_g": 12, "estimated_cost": 4.5}},
        {{"meal_type": "lunch", "name": "Meal name", "calories": 550, "protein_g": 35, "carbs_g": 60, "fats_g": 15, "estimated_cost": 7.0}},
        {{"meal_type": "dinner", "name": "Meal name", "calories": 600, "protein_g": 40, "carbs_g": 55, "fats_g": 18, "estimated_cost": 8.5}},
        {{"meal_type": "snack", "name": "Meal name", "calories": 200, "protein_g": 10, "carbs_g": 20, "fats_g": 8, "estimated_cost": 2.0}}
      ],
      "day_total": {{"calories": 1750, "protein_g": 110, "carbs_g": 180, "fats_g": 53, "cost": 22.0}}
    }}
  ],
  "tips": ["tip 1", "tip 2", "tip 3"],
  "projected_progress": "What the user can expect after {target_weeks} weeks"
}}"""


def _get_avg_intake() -> dict:
    from_date = str(date.today() - timedelta(days=30))
    rows = (supabase.table("food_logs")
            .select("calories,protein_g,carbs_g,fats_g,cost")
            .gte("log_date", from_date)
            .execute().data)
    if not rows:
        return {"calories": 2000, "protein": 100, "carbs": 250, "fats": 70, "spend": 20}
    totals = defaultdict(float)
    for r in rows:
        totals["calories"] += r.get("calories", 0) or 0
        totals["protein"]  += r.get("protein_g", 0) or 0
        totals["carbs"]    += r.get("carbs_g", 0) or 0
        totals["fats"]     += r.get("fats_g", 0) or 0
        totals["spend"]    += r.get("cost", 0) or 0
    n = max(len(set(r.get("log_date", "") for r in rows)), 1)
    return {k: v / n for k, v in totals.items()}


@goals_bp.route("/goals", methods=["POST"])
def save_goal():
    data = request.get_json()
    result = supabase.table("user_goals").insert(data).execute()
    return jsonify(result.data[0] if result.data else data)


@goals_bp.route("/goals", methods=["GET"])
def get_goal():
    result = supabase.table("user_goals").select("*").order("created_at", desc=True).limit(1).execute()
    return jsonify(result.data[0] if result.data else {})


@goals_bp.route("/goals/meal-plan", methods=["POST"])
def generate_meal_plan():
    goal = request.get_json()
    avg = _get_avg_intake()

    prompt = MEAL_PLAN_PROMPT.format(
        avg_calories=avg.get("calories", 2000),
        avg_protein=avg.get("protein", 100),
        avg_carbs=avg.get("carbs", 250),
        avg_fats=avg.get("fats", 70),
        avg_spend=avg.get("spend", 20),
        calorie_goal=goal.get("daily_calorie_goal", 2000),
        protein_goal=goal.get("daily_protein_goal_g", 150),
        carbs_goal=goal.get("daily_carbs_goal_g", 250),
        fats_goal=goal.get("daily_fats_goal_g", 65),
        budget=goal.get("daily_budget_usd", 30),
        goal_description=goal.get("goal_description", "Eat healthier"),
        target_weeks=goal.get("target_weeks", 4),
    )

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?", "", raw, flags=re.MULTILINE).strip()
        raw = re.sub(r"```$", "", raw, flags=re.MULTILINE).strip()
        plan = json.loads(raw)

        # Save goal + plan
        goal_result = supabase.table("user_goals").insert(goal).execute()
        goal_id = goal_result.data[0]["id"] if goal_result.data else None
        if goal_id:
            supabase.table("meal_plans").insert({
                "goal_id": goal_id,
                "week_label": f"Week of {date.today()}",
                "plan_json": plan,
            }).execute()

        return jsonify({"plan": plan, "goal_id": goal_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@goals_bp.route("/goals/meal-plans", methods=["GET"])
def list_meal_plans():
    result = supabase.table("meal_plans").select("*").order("generated_at", desc=True).limit(10).execute()
    return jsonify(result.data)
