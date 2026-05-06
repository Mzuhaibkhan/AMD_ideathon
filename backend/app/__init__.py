from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:3001"])

    from .routes.food import food_bp
    from .routes.llm import llm_bp
    from .routes.analytics import analytics_bp
    from .routes.compare import compare_bp
    from .routes.goals import goals_bp
    from .routes.ml import ml_bp

    app.register_blueprint(food_bp,      url_prefix="/api")
    app.register_blueprint(llm_bp,       url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(compare_bp,   url_prefix="/api")
    app.register_blueprint(goals_bp,     url_prefix="/api")
    app.register_blueprint(ml_bp,        url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "NutriTrack AI Backend"}

    return app
