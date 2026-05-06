"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LenisProvider from "@/components/LenisProvider";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface DaySummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_spend: number;
  meal_count: number;
}

interface RecentLog {
  id: string;
  food_item: string;
  calories: number;
  protein_g: number;
  cost: number;
  category: string;
  meal_type: string;
  logged_at: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [calChart, setCalChart] = useState<string>("");
  const [macroChart, setMacroChart] = useState<string>("");
  const [spendChart, setSpendChart] = useState<string>("");
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [logsRes, analyticsRes] = await Promise.all([
          fetch(`${API}/api/logs?date=${today}`),
          fetch(`${API}/api/analytics?range=${range}`),
        ]);
        if (logsRes.ok) { const d = await logsRes.json(); setLogs(d); }
        if (analyticsRes.ok) {
          const d = await analyticsRes.json();
          setCalChart(d.calorie_chart || "");
          setMacroChart(d.macro_chart || "");
          setSpendChart(d.spend_chart || "");
          const rows: { total_calories: number; total_protein: number; total_carbs: number; total_fats: number; total_spend: number }[] = d.rows || [];
          if (rows.length) {
            const latest = rows[rows.length - 1];
            setSummary({ total_calories: latest.total_calories, total_protein: latest.total_protein, total_carbs: latest.total_carbs, total_fats: latest.total_fats, total_spend: latest.total_spend, meal_count: logs.length });
          }
        }
      } catch { /* no-op */ }
      setLoading(false);
    };
    fetchDashboard();
  }, [range]);

  const MACRO_STATS = [
    { label: "Calories", val: Math.round(summary?.total_calories || 0), unit: "kcal", goal: 2000, color: "var(--accent-3)", tag: "tag-3" },
    { label: "Protein", val: Math.round(summary?.total_protein || 0), unit: "g", goal: 150, color: "var(--accent-1)", tag: "tag-1" },
    { label: "Carbs", val: Math.round(summary?.total_carbs || 0), unit: "g", goal: 250, color: "var(--accent-4)", tag: "tag-4" },
    { label: "Fat", val: Math.round(summary?.total_fats || 0), unit: "g", goal: 65, color: "var(--accent-2)", tag: "tag-2" },
  ];

  return (
    <LenisProvider>
      <Nav />
      <main style={{ paddingTop: "7rem", minHeight: "100vh", backgroundColor: "var(--base-100)" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--base-300)", padding: "4rem 0 3rem" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>▶ Control Center</p>
                <h2 style={{ color: "var(--base-100)", fontSize: "clamp(3rem,8vw,8rem)" }}>Dashboard</h2>
                <p style={{ color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/log" className="btn-primary btn-accent">▶ Log Meal</Link>
                <Link href="/insights" className="btn-primary" style={{ border: "1px solid rgba(249,244,235,0.2)" }}>Insights</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Today's macros ────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0", borderBottom: "1px solid var(--base-200)" }}>
          <div className="container">
            <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "1.25rem" }}>▶ Today&apos;s Intake</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {MACRO_STATS.map(s => {
                const pct = Math.min(100, (s.val / s.goal) * 100);
                return (
                  <div key={s.label} className="dashed-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>{s.label}</p>
                      <span className={`tag ${s.tag}`}>{s.unit}</span>
                    </div>
                    <div className="stat-number" style={{ color: s.color, fontSize: "3.5rem", marginBottom: "0.5rem" }}>{s.val}</div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                    </div>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", marginTop: "0.35rem", fontSize: "0.68rem" }}>Goal: {s.goal}{s.unit}</p>
                  </div>
                );
              })}
              {/* Spend */}
              <div className="dashed-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Spent</p>
                  <span className="tag tag-2">$</span>
                </div>
                <div className="stat-number" style={{ color: "var(--accent-2)", fontSize: "3.5rem", marginBottom: "0.5rem" }}>${(summary?.total_spend || 0).toFixed(0)}</div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, ((summary?.total_spend || 0) / 30) * 100)}%`, backgroundColor: "var(--accent-2)" }} />
                </div>
                <p className="mono" style={{ color: "var(--base-secondary-dark)", marginTop: "0.35rem", fontSize: "0.68rem" }}>Budget: $30</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Charts ───────────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ Analytics</p>
              <TimeRangeSelector value={range} onChange={setRange} />
            </div>
            {loading ? (
              <div style={{ height: 300, backgroundColor: "var(--base-300)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>Loading charts...</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
                {[
                  { title: "Calories", chart: calChart },
                  { title: "Macros", chart: macroChart },
                  { title: "Spending", chart: spendChart },
                ].map(c => (
                  <div key={c.title}>
                    <p className="mono" style={{ color: "var(--base-secondary-dark)", marginBottom: "0.5rem" }}>{c.title}</p>
                    <div className="chart-container">
                      {c.chart ? <img src={`data:image/png;base64,${c.chart}`} alt={`${c.title} chart`} /> : (
                        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No data yet — start logging!</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Recent logs ──────────────────────────────────── */}
        <section style={{ padding: "2.5rem 0 5rem", backgroundColor: "var(--base-200)" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>▶ Today&apos;s Logs</p>
              <Link href="/history" className="btn-primary" style={{ fontSize: "0.72rem" }}>View All History</Link>
            </div>
            {logs.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", border: "1.5px dashed var(--base-secondary-dark)", borderRadius: 16 }}>
                <p className="mono" style={{ color: "var(--base-secondary-dark)" }}>No meals logged today.</p>
                <Link href="/log" className="btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>▶ Log Your First Meal</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {logs.map(log => (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--base-100)", borderRadius: 10, padding: "1rem 1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem", textTransform: "capitalize" }}>{log.food_item}</p>
                      <p className="mono" style={{ color: "var(--base-secondary-dark)", fontSize: "0.7rem", marginTop: "0.15rem" }}>
                        {new Date(log.logged_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="tag tag-3">{log.calories} kcal</span>
                      <span className="tag tag-1">{log.protein_g}g P</span>
                      <span className="tag tag-2">${log.cost}</span>
                      <span className="tag tag-4">{log.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </LenisProvider>
  );
}
