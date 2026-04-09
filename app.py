from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, flash, g, redirect, render_template, request, session, url_for

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "app" / "data" / "site.db"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "cambia-esta-clave-secreta")
app.config["DATABASE"] = str(DATABASE)

BOOK_CATEGORIES = [
    "Interpretación de Elena White",
    "Biográficos de Elena White",
    "Defensa del Espíritu de Profecía",
    "Otros recursos",
]


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exception: Exception | None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT,
            category TEXT NOT NULL,
            file_url TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS info_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            event_date TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS questionnaires (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            form_url TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    db.commit()

    admin = db.execute("SELECT id FROM admins WHERE username = ?", ("admin",)).fetchone()
    if admin is None:
        db.execute("INSERT INTO admins (username, password) VALUES (?, ?)", ("admin", "admin123"))

    defaults = {
        "site_title": "Departamento de Educación Espíritu de Profecía",
        "site_subtitle": "Misión Villaperla",
        "about_text": (
            "Somos el departamento de educación Espíritu de Profecía de la Misión Villaperla, "
            "comprometidos en promover el estudio bíblico y el legado espiritual de Elena G. de White."
        ),
        "book_of_year_title": "El libro del año",
        "book_of_year_description": "Aquí publicaremos el libro del año y recursos de estudio.",
        "book_of_year_url": "",
    }
    for key, value in defaults.items():
        existing = db.execute("SELECT key FROM settings WHERE key = ?", (key,)).fetchone()
        if existing is None:
            db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (key, value))

    db.commit()


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if "admin_id" not in session:
            flash("Debes iniciar sesión como administrador.", "warning")
            return redirect(url_for("admin_login"))
        return view(*args, **kwargs)

    return wrapped_view


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


def get_settings() -> dict[str, str]:
    db = get_db()
    rows = db.execute("SELECT key, value FROM settings").fetchall()
    return {row["key"]: row["value"] for row in rows}


@app.route("/")
def home():
    db = get_db()
    settings = get_settings()
    videos = db.execute("SELECT * FROM videos ORDER BY id DESC LIMIT 6").fetchall()
    info_posts = db.execute("SELECT * FROM info_posts ORDER BY event_date DESC, id DESC LIMIT 5").fetchall()
    books_by_category = {}
    for category in BOOK_CATEGORIES:
        books_by_category[category] = db.execute(
            "SELECT * FROM books WHERE category = ? ORDER BY id DESC", (category,)
        ).fetchall()
    questionnaires = db.execute("SELECT * FROM questionnaires ORDER BY id DESC").fetchall()

    return render_template(
        "home.html",
        settings=settings,
        videos=videos,
        info_posts=info_posts,
        books_by_category=books_by_category,
        questionnaires=questionnaires,
        book_categories=BOOK_CATEGORIES,
    )


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        db = get_db()
        admin = db.execute(
            "SELECT id FROM admins WHERE username = ? AND password = ?", (username, password)
        ).fetchone()
        if admin:
            session.clear()
            session["admin_id"] = admin["id"]
            session["admin_name"] = username
            flash("Bienvenido al panel administrativo.", "success")
            return redirect(url_for("admin_dashboard"))
        flash("Credenciales inválidas.", "danger")

    return render_template("admin_login.html")


@app.route("/admin/logout")
@login_required
def admin_logout():
    session.clear()
    flash("Sesión cerrada.", "success")
    return redirect(url_for("home"))


@app.route("/admin")
@login_required
def admin_dashboard():
    db = get_db()
    stats = {
        "videos": db.execute("SELECT COUNT(*) as total FROM videos").fetchone()["total"],
        "books": db.execute("SELECT COUNT(*) as total FROM books").fetchone()["total"],
        "info_posts": db.execute("SELECT COUNT(*) as total FROM info_posts").fetchone()["total"],
        "questionnaires": db.execute("SELECT COUNT(*) as total FROM questionnaires").fetchone()["total"],
    }
    return render_template("admin_dashboard.html", stats=stats, settings=get_settings(), categories=BOOK_CATEGORIES)


@app.route("/admin/settings", methods=["POST"])
@login_required
def admin_settings():
    db = get_db()
    fields = [
        "site_title",
        "site_subtitle",
        "about_text",
        "book_of_year_title",
        "book_of_year_description",
        "book_of_year_url",
    ]
    for field in fields:
        value = request.form.get(field, "").strip()
        db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (field, value))
    db.commit()
    flash("Configuración general actualizada.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/videos", methods=["POST"])
@login_required
def admin_videos_create():
    title = request.form.get("title", "").strip()
    url = request.form.get("url", "").strip()
    description = request.form.get("description", "").strip()
    if not title or not url:
        flash("Video: título y URL son obligatorios.", "danger")
        return redirect(url_for("admin_dashboard"))

    db = get_db()
    db.execute(
        "INSERT INTO videos (title, url, description, created_at) VALUES (?, ?, ?, ?)",
        (title, url, description, now_iso()),
    )
    db.commit()
    flash("Video agregado correctamente.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/videos/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_videos_delete(item_id: int):
    db = get_db()
    db.execute("DELETE FROM videos WHERE id = ?", (item_id,))
    db.commit()
    flash("Video eliminado.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/books", methods=["POST"])
@login_required
def admin_books_create():
    title = request.form.get("title", "").strip()
    author = request.form.get("author", "").strip()
    category = request.form.get("category", "").strip()
    file_url = request.form.get("file_url", "").strip()
    description = request.form.get("description", "").strip()
    if not title or not file_url or category not in BOOK_CATEGORIES:
        flash("Libro: revisa los campos obligatorios.", "danger")
        return redirect(url_for("admin_dashboard"))

    db = get_db()
    db.execute(
        "INSERT INTO books (title, author, category, file_url, description, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (title, author, category, file_url, description, now_iso()),
    )
    db.commit()
    flash("Libro agregado correctamente.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/books/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_books_delete(item_id: int):
    db = get_db()
    db.execute("DELETE FROM books WHERE id = ?", (item_id,))
    db.commit()
    flash("Libro eliminado.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/info", methods=["POST"])
@login_required
def admin_info_create():
    title = request.form.get("title", "").strip()
    body = request.form.get("body", "").strip()
    event_date = request.form.get("event_date", "").strip()
    if not title or not body:
        flash("Información: título y contenido son obligatorios.", "danger")
        return redirect(url_for("admin_dashboard"))

    db = get_db()
    db.execute(
        "INSERT INTO info_posts (title, body, event_date, created_at) VALUES (?, ?, ?, ?)",
        (title, body, event_date, now_iso()),
    )
    db.commit()
    flash("Información publicada.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/info/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_info_delete(item_id: int):
    db = get_db()
    db.execute("DELETE FROM info_posts WHERE id = ?", (item_id,))
    db.commit()
    flash("Publicación eliminada.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/questionnaires", methods=["POST"])
@login_required
def admin_questionnaire_create():
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    form_url = request.form.get("form_url", "").strip()
    if not title or not form_url:
        flash("Cuestionario: título y enlace son obligatorios.", "danger")
        return redirect(url_for("admin_dashboard"))

    db = get_db()
    db.execute(
        "INSERT INTO questionnaires (title, description, form_url, created_at) VALUES (?, ?, ?, ?)",
        (title, description, form_url, now_iso()),
    )
    db.commit()
    flash("Cuestionario agregado.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/questionnaires/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_questionnaire_delete(item_id: int):
    db = get_db()
    db.execute("DELETE FROM questionnaires WHERE id = ?", (item_id,))
    db.commit()
    flash("Cuestionario eliminado.", "success")
    return redirect(url_for("admin_dashboard"))


with app.app_context():
    init_db()


if __name__ == "__main__":
    app.run(debug=True)
