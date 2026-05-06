"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CompareData {
  this_period: { calories: number; protein: number; carbs: number; fats: number; spend: number };
  last_period: { calories: number; protein: number; carbs: number; fats: number; spend: number };
  chart: string;
}

const METRICS = [
  { key: "calories", label: "Calories", unit: "kcal", lowerIsBetter: true, color: "var(--accent-3)" },
  { key: "protein", label: "Protein", unit: "g", lowerIsBetter: false, color: "var(--accent-1)" },
  { key: "carbs", label: "Carbs", unit: "g", lowerIsBetter: true, color: "var(--accent-4)" },
  { key: "fats", label: "Fat", unit: "g", lowerIsBetter: true, color: "var(--accent-2)" },
  { key: "spend", label: "Spending", unit: "$", lowerIsBetter: true, color: "var(--base-100)" },
];

export default function ComparePage() {
  const [mode, setMode] = useState<"week" | "month">("week");
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/compare?mode=${mode}`);
        if (res.ok) setData(await res.json());
      } catch { /* no-op */ }
      setLoading(false);
    };
    fetch_();
  }, [mode]);

  const pct = (a: number, b: number) => a > 0 ? ((b - a) / a) * 100 : 0;

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Period Analysis</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Compare</h2>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["week", "month"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className="btn-primary"
                    style={{ backgroundColor: mode === m ? "var(--accent-3)" : "transparent", color: mode === m ? "var(--base-300)" : "var(--base-100)", border: "1px solid rgba(249,244,235,0.2)" }}>
                    This {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container">
            {loading ? (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--base-300)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Comparing periods...</p>
              </div>
            ) : data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Chart */}
                {data.chart && (
                  <div>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.75rem" }}>Comparison Chart</p>
                    <div className="chart-container">
                      <img src={`data:image/png;base64,${data.chart}`} alt="Comparison chart" style={{ borderRadius: 12 }} />
                    </div>
                  </div>
                )}

                {/* Table */}
                <div style={{ backgroundColor: "var(--base-300)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Metric", `This ${mode}`, `Last ${mode}`, "Change"].map(h => (
                      <p key={h} className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.72rem" }}>{h}</p>
                    ))}
                  </div>
                  {METRICS.map(m => {
                    const curr = data.this_period[m.key as keyof typeof data.this_period];
                    const prev = data.last_period[m.key as keyof typeof data.last_period];
                    const change = pct(prev, curr);
                    const isGood = m.lowerIsBetter ? change <= 0 : change >= 0;
                    return (
                      <div key={m.key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.2fr", padding: "1.1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: m.color }} />
                          <p className="mono" style={{ color: "var(--base-100)", fontSize: "0.78rem" }}>{m.label}</p>
                        </div>
                        <p style={{ color: "var(--base-100)", fontFamily: "Barlow Condensed", fontSize: "1.5rem", fontWeight: 900 }}>
                          {m.unit === "$" ? "$" : ""}{Math.round(curr)}{m.unit !== "$" ? m.unit : ""}
                        </p>
                        <p style={{ color: "var(--base-secondary-dark)", fontFamily: "Barlow Condensed", fontSize: "1.5rem", fontWeight: 900 }}>
                          {m.unit === "$" ? "$" : ""}{Math.round(prev)}{m.unit !== "$" ? m.unit : ""}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontFamily: "Barlow Condensed", fontSize: "1.4rem", fontWeight: 900, color: isGood ? "var(--accent-4)" : "var(--accent-2)" }}>
                            {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                          </span>
                          <span>{isGood ? "✅" : "⚠️"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p style={{ color: "var(--base-secondary-dark)", fontSize: "0.82rem" }}>
                  ✅ = moving toward goal &nbsp;|&nbsp; ⚠️ = needs attention
                </p>
              </div>
            ) : (
              <div style={{ padding: "4rem", textAlign: "center", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No data to compare yet. Log meals for at least 2 weeks.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
