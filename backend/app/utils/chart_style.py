import io
import base64
from collections import defaultdict
from datetime import date, timedelta

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server
import matplotlib.pyplot as plt
import numpy as np

# ── Juno Watts color palette ──────────────────────────────────
JUNO = {
    "bg":      "#0a0a0a",
    "text":    "#f9f4eb",
    "muted":   "#686560",
    "grid":    "#1a1a1a",
    "accent1": "#b1c1ef",   # periwinkle — protein
    "accent2": "#f2acac",   # coral      — fat / spending
    "accent3": "#ffdd94",   # gold       — calories
    "accent4": "#a8e6cf",   # mint       — carbs
}


def apply_juno_style(fig, ax):
    fig.patch.set_facecolor(JUNO["bg"])
    ax.set_facecolor(JUNO["bg"])
    ax.tick_params(colors=JUNO["muted"], labelsize=8, length=0)
    ax.xaxis.label.set_color(JUNO["muted"])
    ax.yaxis.label.set_color(JUNO["muted"])
    for spine in ax.spines.values():
        spine.set_color(JUNO["grid"])
        spine.set_linewidth(0.5)
    ax.grid(True, color=JUNO["grid"], linewidth=0.5, linestyle="--", alpha=0.8)
    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_color(JUNO["muted"])
        label.set_fontsize(8)
    return fig, ax


def fig_to_b64(fig) -> str:
    buf = io.BytesIO()
    plt.tight_layout(pad=1.5)
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=JUNO["bg"], edgecolor="none")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


def _group_by_date(rows: list[dict], metric: str) -> tuple[list, list]:
    agg = defaultdict(float)
    for r in rows:
        agg[r["log_date"]] += r.get(metric, 0) or 0
    dates = sorted(agg.keys())
    vals = [agg[d] for d in dates]
    return dates, vals


def _short_date(d: str, range_: str) -> str:
    try:
        dt = date.fromisoformat(d)
        if range_ in ("day", "week"):
            return dt.strftime("%b %d")
        if range_ == "month":
            return dt.strftime("%b %d")
        return dt.strftime("%b '%y")
    except Exception:
        return d


def generate_line_chart(rows: list[dict], metric: str, range_: str, goal: float = None) -> str:
    dates, vals = _group_by_date(rows, metric)
    if not dates:
        return ""

    labels = [_short_date(d, range_) for d in dates]
    x = np.arange(len(labels))

    fig, ax = plt.subplots(figsize=(8, 3.5))
    apply_juno_style(fig, ax)

    color = JUNO["accent3"] if metric == "calories" else JUNO["accent2"]
    ax.plot(x, vals, color=color, linewidth=2, zorder=3)
    ax.fill_between(x, vals, alpha=0.12, color=color)
    ax.scatter(x, vals, color=color, s=40, zorder=4)

    if goal:
        ax.axhline(y=goal, color=JUNO["muted"], linewidth=1, linestyle="--", alpha=0.6, label=f"Goal: {goal:.0f}")
        ax.legend(facecolor=JUNO["bg"], labelcolor=JUNO["muted"], fontsize=7, framealpha=0.4)

    step = max(1, len(labels) // 8)
    ax.set_xticks(x[::step])
    ax.set_xticklabels(labels[::step], rotation=30, ha="right")
    ax.set_ylabel(metric.replace("_", " ").title(), color=JUNO["muted"], fontsize=8)

    return fig_to_b64(fig)


def generate_bar_chart(rows: list[dict], range_: str) -> str:
    dates_p, protein = _group_by_date(rows, "protein_g")
    _, carbs = _group_by_date(rows, "carbs_g")
    _, fats = _group_by_date(rows, "fats_g")

    if not dates_p:
        return ""

    labels = [_short_date(d, range_) for d in dates_p]
    x = np.arange(len(labels))
    w = 0.28

    fig, ax = plt.subplots(figsize=(8, 3.5))
    apply_juno_style(fig, ax)

    ax.bar(x - w, protein, w, color=JUNO["accent1"], label="Protein", alpha=0.9)
    ax.bar(x,     carbs,   w, color=JUNO["accent4"], label="Carbs",   alpha=0.9)
    ax.bar(x + w, fats,    w, color=JUNO["accent2"], label="Fat",     alpha=0.9)

    step = max(1, len(labels) // 8)
    ax.set_xticks(x[::step])
    ax.set_xticklabels(labels[::step], rotation=30, ha="right")
    ax.set_ylabel("grams", color=JUNO["muted"], fontsize=8)
    ax.legend(facecolor=JUNO["bg"], labelcolor=JUNO["text"], fontsize=8, framealpha=0.3)

    return fig_to_b64(fig)


def generate_comparison_chart(this_vals: list, last_vals: list, labels: list) -> str:
    x = np.arange(len(labels))
    w = 0.35

    fig, ax = plt.subplots(figsize=(8, 4))
    apply_juno_style(fig, ax)

    ax.bar(x - w / 2, last_vals, w, color=JUNO["muted"], label="Last Period", alpha=0.7)
    ax.bar(x + w / 2, this_vals, w, color=JUNO["accent1"], label="This Period", alpha=0.95)

    ax.set_xticks(x)
    ax.set_xticklabels(labels, color=JUNO["text"], fontsize=8)
    ax.legend(facecolor=JUNO["bg"], labelcolor=JUNO["text"], fontsize=8, framealpha=0.3)

    for i, (a, b) in enumerate(zip(last_vals, this_vals)):
        if a > 0:
            pct = ((b - a) / a) * 100
            c = JUNO["accent4"] if pct < 0 else JUNO["accent2"]
            ax.text(i + w / 2, b + max(b * 0.02, 0.5), f"{pct:+.1f}%",
                    ha="center", fontsize=7, color=c, fontweight="bold")

    return fig_to_b64(fig)


def generate_category_chart(rows: list[dict]) -> str:
    cat_spend: dict[str, float] = defaultdict(float)
    for r in rows:
        cat_spend[r.get("category", "Other")] += r.get("cost", 0) or 0
    if not cat_spend:
        return ""

    cats = sorted(cat_spend, key=cat_spend.get, reverse=True)[:8]
    vals = [cat_spend[c] for c in cats]
    colors = [JUNO["accent1"], JUNO["accent2"], JUNO["accent3"], JUNO["accent4"],
              "#c5b4e3", "#89cff0", "#f4a460", "#98fb98"]

    fig, ax = plt.subplots(figsize=(8, 3.5))
    apply_juno_style(fig, ax)

    y = np.arange(len(cats))
    bars = ax.barh(y, vals, color=colors[:len(cats)], alpha=0.9)
    ax.set_yticks(y)
    ax.set_yticklabels(cats, color=JUNO["text"], fontsize=8)
    ax.set_xlabel("Total Spend ($)", color=JUNO["muted"], fontsize=8)

    for bar, val in zip(bars, vals):
        ax.text(bar.get_width() + max(val * 0.01, 0.1), bar.get_y() + bar.get_height() / 2,
                f"${val:.1f}", va="center", color=JUNO["muted"], fontsize=7)

    return fig_to_b64(fig)
