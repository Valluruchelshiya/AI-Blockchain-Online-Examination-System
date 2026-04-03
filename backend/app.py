import pymysql
pymysql.install_as_MySQLdb()
from gevent import monkey
monkey.patch_all()
from flask import Flask, jsonify, request
from dotenv import load_dotenv


import os

from backend.config import Config
from backend.extensions import db, jwt, cors, socketio, migrate
from backend.auth_routes import bp as auth_bp
from backend.exam_routes import bp as exams_bp
from backend.proctor_routes import bp as proctor_bp
from backend.certificate_routes import bp as cert_bp
from backend.admin_routes import bp as admin_bp
from backend.results_routes import bp as results_bp
from backend.admin_results_routes import bp as admin_results_bp
from backend.cheating_logs_routes import bp as cheating_logs_bp
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    socketio.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(exams_bp)
    app.register_blueprint(proctor_bp)
    app.register_blueprint(cert_bp)
    app.register_blueprint(results_bp)
    app.register_blueprint(admin_results_bp)
    app.register_blueprint(cheating_logs_bp)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            return "", 200

    return app

app = create_app()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
