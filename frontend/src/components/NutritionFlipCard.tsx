"use client";

interface FlipCardProps {
  frontBg: string;
  label: string;
  num: string;
  backTitle: string;
  backItems: string[];
  icon?: string;
}

export default function NutritionFlipCard({ frontBg, label, num, backTitle, backItems, icon }: FlipCardProps) {
  return (
    <div className="flip-card" style={{ flex: 1, aspectRatio: "5/7", minHeight: 280 }}>
      <div className="flip-card-inner">
        {/* Front */}
        <div className="flip-card-front" style={{ backgroundColor: frontBg }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p className="mono" style={{ fontSize: "0.72rem" }}>{label}</p>
            <p className="mono" style={{ fontSize: "0.72rem" }}>{num}</p>
          </div>
          {icon && (
            <div style={{ textAlign: "center", fontSize: "2.5rem", opacity: 0.6 }}>{icon}</div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p className="mono" style={{ fontSize: "0.72rem" }}>{num}</p>
            <p className="mono" style={{ fontSize: "0.72rem" }}>{label}</p>
          </div>
        </div>
        {/* Back */}
        <div className="flip-card-back">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--base-secondary-dark)" }}>{label}</p>
            <p className="mono" style={{ fontSize: "0.72rem", color: "var(--base-secondary-dark)" }}>{num}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1, marginTop: "1rem" }}>
            {backItems.map((item, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(249,244,235,0.06)", borderRadius: 6, fontSize: "0.95rem", color: "var(--base-100)" }}>
                {item}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--base-secondary-dark)", marginTop: "0.5rem" }}>{backTitle}</p>
        </div>
      </div>
    </div>
  );
}
