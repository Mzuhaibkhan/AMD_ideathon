"""
NutriTrack AI — Random Forest Model Training
Run this script once to generate model.pkl
"""
import numpy as np
import joblib
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# ── Synthetic dataset ──────────────────────────────────────────
np.random.seed(42)
N = 3000

CATEGORY_MAP = {
    0: "Fast Food", 1: "Snack", 2: "Other", 3: "Beverage",
    4: "Grain", 5: "Dairy", 6: "Fruit", 7: "Vegetable",
    8: "Protein", 9: "Healthy",
}
HEALTHY_CATS = {6, 7, 8, 9}

categories = np.random.randint(0, 10, N)
calories   = np.clip(np.random.normal(500, 200, N), 50, 1500)
cost       = np.clip(np.random.normal(10, 6, N), 0.5, 50)

# Score: higher for healthy cats, lower for high cal/cost
base_score = np.where(np.isin(categories, list(HEALTHY_CATS)), 75, 40).astype(float)
cal_penalty  = np.clip((calories - 600) / 20, 0, 30)
cost_penalty = np.clip((cost - 15) / 3, 0, 20)
noise = np.random.normal(0, 5, N)

scores = np.clip(base_score - cal_penalty - cost_penalty + noise, 0, 100)

X = np.column_stack([calories, cost, categories])
y = scores

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Train ──────────────────────────────────────────────────────
rf = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)

mae = mean_absolute_error(y_test, rf.predict(X_test))
print(f"Model trained | MAE: {mae:.2f} | Features: [calories, cost, category_code]")

# ── Export ─────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "model.pkl")
joblib.dump(rf, out_path)
print(f"Model saved to {out_path}")
