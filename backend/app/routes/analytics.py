from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from ..supabase_client import supabase
from ..utils.chart_style import (
    generate_line_chart, generate_bar_chart, generate_category_chart
)

analytics_bp = Blueprint("analytics", __name__)

RANGE_DAYS = {"day": 1, "week": 7, "month": 30, "3m": 90, "6m": 180}


@analytics_bp.route("/analytics", methods=["GET"])
def analytics():
    range_ = request.args.get("range", "week")
    days = RANGE_DAYS.get(range_, 7)
    from_date = str(date.today() - timedelta(days=days))

    rows = (supabase.table("food_logs")
            .select("log_date,calories,protein_g,carbs_g,fats_g,cost,category")
            .gte("log_date", from_date)
            .order("log_date")
            .execute().data)

    calorie_chart = generate_line_chart(rows, "calories", range_)
    macro_chart   = generate_bar_chart(rows, range_)
    spend_chart   = generate_line_chart(rows, "cost", range_)
    category_chart = generate_category_chart(rows)

    return jsonify({
        "rows": rows,
        "calorie_chart":  calorie_chart,
        "macro_chart":    macro_chart,
        "spend_chart":    spend_chart,
        "category_chart": category_chart,
    })


@analytics_bp.route("/analytics/daily-summary", methods=["GET"])
def daily_summary():
    from_date = request.args.get("from")
    to_date   = request.args.get("to")

    rows = (supabase.table("food_logs")
            .select("log_date,calories")
            .gte("log_date", from_date)
            .lte("log_date", to_date)
            .execute().data)

    # Aggregate calories per day
    agg: dict[str, float] = {}
    for r in rows:
        d = r["log_date"]
        agg[d] = agg.get(d, 0) + (r.get("calories") or 0)

    result = {d: {"calories": c, "on_target": c <= 2200} for d, c in agg.items()}
    return jsonify(result)
