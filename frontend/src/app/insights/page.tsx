"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import TimeRangeSelector from "@/components/TimeRangeSelector";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InsightsPage() {
  const [range, setRange] = useState("week");
  const [charts, setCharts] = useState<{ calorie_chart: string; macro_chart: string; spend_chart: string; category_chart?: string }>({ calorie_chart: "", macro_chart: "", spend_chart: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/analytics?range=${range}`);
        if (res.ok) setCharts(await res.json());
      } catch { /* no-op */ }
      setLoading(false);
    };
    fetch_();
  }, [range]);

  const CHART_DEFS = [
    { key: "calorie_chart", title: "Calorie Intake", desc: "Daily calorie consumption over time" },
    { key: "macro_chart", title: "Macro Breakdown", desc: "Protein / Carbs / Fat grouped bars" },
    { key: "spend_chart", title: "Spending vs Budget", desc: "Food spending with daily budget reference" },
    { key: "category_chart", title: "Category Breakdown", desc: "Spending by food category" },
  ];

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Visual Logs</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Insights</h2>
              </div>
              <TimeRangeSelector value={range} onChange={setRange} />
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0 6rem" }}>
          <div className="container">
            {loading ? (
              <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--base-300)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Generating charts...</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "1.5rem" }}>
                {CHART_DEFS.map(c => {
                  const b64 = charts[c.key as keyof typeof charts];
                  return (
                    <div key={c.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div>
                          <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>{c.title}</p>
                          <p style={{ fontSize: "0.82rem", color: "var(--base-secondary-dark)", marginTop: "0.15rem" }}>{c.desc}</p>
                        </div>
                      </div>
                      <div className="chart-container" style={{ minHeight: 200 }}>
                        {b64 ? (
                          <img src={`data:image/png;base64,${b64}`} alt={c.title} style={{ borderRadius: 12 }} />
                        ) : (
                          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No data for this range</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
