from flask import Blueprint, request, jsonify
from ..supabase_client import supabase

food_bp = Blueprint("food", __name__)


@food_bp.route("/logs", methods=["GET"])
def get_logs():
    date = request.args.get("date")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    query = supabase.table("food_logs").select("*")
    if date:
        query = query.eq("log_date", date)
    elif from_date and to_date:
        query = query.gte("log_date", from_date).lte("log_date", to_date)
    result = query.order("logged_at", desc=True).execute()
    return jsonify(result.data)


@food_bp.route("/logs/<log_id>", methods=["DELETE"])
def delete_log(log_id):
    supabase.table("food_logs").delete().eq("id", log_id).execute()
    return jsonify({"success": True})
