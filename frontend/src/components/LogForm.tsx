"use client";
import { useState, useTransition } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface LogResult {
  food_item: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  category: string;
  meal_type: string;
  cost: number;
  smart_score?: number;
  smart_label?: string;
  smart_advice?: string;
}

interface LogFormProps {
  onSuccess?: (result: LogResult) => void;
}

export default function LogForm({ onSuccess }: LogFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState(false);

  const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
  const [mealType, setMealType] = useState("lunch");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setFlipped(false);

    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, meal_type: mealType }),
      });
      
      const data: LogResult = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      // Get ML score
      const mlRes = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calories: data.calories, cost: data.cost, category: data.category }),
      });
      if (mlRes.ok) {
        const mlData = await mlRes.json();
        data.smart_score = mlData.score;
        data.smart_label = mlData.label;
        data.smart_advice = mlData.advice;
      }

      setResult(data);
      setTimeout(() => setFlipped(true), 300);
      onSuccess?.(data);
    } catch (err: any) {
      setError(err.message || "Could not analyze meal. Check your API connection.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s?: number) => {
    if (!s) return "var(--base-secondary-dark)";
    if (s >= 75) return "var(--accent-4)";
    if (s >= 50) return "var(--accent-3)";
    return "var(--accent-2)";
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Meal type toggle */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {MEAL_TYPES.map(m => (
            <button key={m} type="button" onClick={() => setMealType(m)}
              style={{ padding: "0.3rem 0.75rem", borderRadius: 6, fontFamily: "DM Mono, monospace", fontSize: "0.72rem", textTransform: "uppercase", cursor: "pointer", border: "none", backgroundColor: mealType === m ? "var(--base-300)" : "var(--base-200)", color: mealType === m ? "var(--base-100)" : "var(--base-secondary-dark)", transition: "all 0.2s ease" }}>
              {m}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div style={{ position: "relative" }}>
          <textarea className="input-field" value={text} onChange={e => setText(e.target.value)}
            placeholder="e.g. grilled chicken salad with olive oil, cost ₹250..."
            rows={3} style={{ resize: "none", lineHeight: 1.6 }} />
        </div>

        <button type="submit" disabled={loading || !text.trim()} className="btn-primary"
          style={{ alignSelf: "flex-start", opacity: loading || !text.trim() ? 0.5 : 1 }}>
          {loading ? "Analyzing..." : "▶ Analyze Meal"}
        </button>

        {error && <p className="mono" style={{ color: "var(--accent-2)" }}>{error}</p>}
      </form>

      {/* Result flip card */}
      {result && (
        <div style={{ marginTop: "2rem", perspective: 1200 }}>
          <div style={{ position: "relative", width: "100%", minHeight: 280, transformStyle: "preserve-3d", transition: "transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
            {/* Front - loading state */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", backgroundColor: "var(--accent-3)", borderRadius: 12, padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="mono">Processing with Gemini AI...</p>
            </div>
            {/* Back - result */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "var(--base-300)", borderRadius: 12, padding: "1.75rem", color: "var(--base-100)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.25rem" }}>Food Item</p>
                  <h4 style={{ textTransform: "uppercase", fontFamily: "Barlow Condensed", fontSize: "1.75rem", lineHeight: 1 }}>{result.food_item}</h4>
                </div>
                {result.smart_score !== undefined && (
                  <div style={{ textAlign: "right" }}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Smart Score</p>
                    <div style={{ fontFamily: "Barlow Condensed", fontSize: "3rem", fontWeight: 900, color: scoreColor(result.smart_score), lineHeight: 1 }}>
                      {Math.round(result.smart_score)}
                    </div>
                    <span className="tag tag-1" style={{ fontSize: "0.65rem" }}>{result.smart_label}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                {[
                  { label: "Calories", val: result.calories, unit: "kcal", color: "var(--accent-3)" },
                  { label: "Protein", val: result.protein_g, unit: "g", color: "var(--accent-1)" },
                  { label: "Carbs", val: result.carbs_g, unit: "g", color: "var(--accent-4)" },
                  { label: "Fat", val: result.fats_g, unit: "g", color: "var(--accent-2)" },
                ].map(m => (
                  <div key={m.label} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "0.75rem" }}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.65rem" }}>{m.label}</p>
                    <div style={{ fontFamily: "Barlow Condensed", fontSize: "1.75rem", fontWeight: 900, color: m.color, lineHeight: 1.1 }}>{m.val}<span style={{ fontSize: "0.85rem", marginLeft: 2 }}>{m.unit}</span></div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="tag tag-1">{result.category}</span>
                <span className="tag tag-2">₹{result.cost}</span>
                <span className="tag tag-3">{result.meal_type}</span>
              </div>

              {result.smart_advice && (
                <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--base-secondary-dark)", fontStyle: "italic" }}>
                  ▶ {result.smart_advice}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
