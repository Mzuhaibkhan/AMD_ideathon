from datetime import date, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify
from ..supabase_client import supabase
from ..utils.chart_style import generate_comparison_chart

compare_bp = Blueprint("compare", __name__)


def _sum_period(from_d: str, to_d: str) -> dict:
    rows = (supabase.table("food_logs")
            .select("calories,protein_g,carbs_g,fats_g,cost")
            .gte("log_date", from_d)
            .lte("log_date", to_d)
            .execute().data)
    totals = defaultdict(float)
    for r in rows:
        totals["calories"] += r.get("calories", 0) or 0
        totals["protein"]  += r.get("protein_g", 0) or 0
        totals["carbs"]    += r.get("carbs_g", 0) or 0
        totals["fats"]     += r.get("fats_g", 0) or 0
        totals["spend"]    += r.get("cost", 0) or 0
    return dict(totals)


@compare_bp.route("/compare", methods=["GET"])
def compare():
    mode = request.args.get("mode", "week")
    today = date.today()

    if mode == "week":
        this_start = today - timedelta(days=today.weekday())
        this_end   = today
        last_start = this_start - timedelta(weeks=1)
        last_end   = this_start - timedelta(days=1)
    else:  # month
        this_start = today.replace(day=1)
        this_end   = today
        last_month = (this_start - timedelta(days=1)).replace(day=1)
        last_start = last_month
        last_end   = this_start - timedelta(days=1)

    this_period = _sum_period(str(this_start), str(this_end))
    last_period = _sum_period(str(last_start), str(last_end))

    labels  = ["Calories", "Protein", "Carbs", "Fat", "Spend"]
    metrics = ["calories", "protein", "carbs", "fats", "spend"]
    this_vals = [this_period.get(m, 0) for m in metrics]
    last_vals = [last_period.get(m, 0) for m in metrics]

    chart = generate_comparison_chart(this_vals, last_vals, labels)

    return jsonify({
        "this_period": this_period,
        "last_period": last_period,
        "chart": chart,
        "period": mode,
        "this_range": f"{this_start} to {this_end}",
        "last_range": f"{last_start} to {last_end}",
    })
