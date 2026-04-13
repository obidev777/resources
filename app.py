from __future__ import annotations

import json
import os
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, flash, redirect, render_template, request, session, url_for

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "app" / "data" / "site_data.json"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "cambia-esta-clave-secreta")

BOOK_CATEGORIES = [
    "Interpretación de Elena White",
    "Biográficos de Elena White",
    "Defensa del Espíritu de Profecía",
    "Otros recursos",
]


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


def default_data() -> dict:
    return {
        "admins": [
            {"id": 1, "username": "admin", "password": "admin123"},
        ],
        "videos": [],
        "books": [],
        "info_posts": [],
        "questionnaires": [],
        "settings": {
            "site_title": "Departamento de Educación Espíritu de Profecía",
            "site_subtitle": "Misión Villaperla",
            "about_text": (
                "Somos el departamento de educación Espíritu de Profecía de la Misión Villaperla, "
                "comprometidos en promover el estudio bíblico y el legado espiritual de Elena G. de White."
            ),
            "book_of_year_title": "El libro del año",
            "book_of_year_description": "Aquí publicaremos el libro del año y recursos de estudio.",
            "book_of_year_url": "",
        },
        "counters": {
            "admins": 1,
            "videos": 0,
            "books": 0,
            "info_posts": 0,
            "questionnaires": 0,
        },
    }


def ensure_data_file() -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(default_data(), ensure_ascii=False, indent=2), encoding="utf-8")


def load_data() -> dict:
    ensure_data_file()
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def save_data(data: dict) -> None:
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def next_id(data: dict, entity: str) -> int:
    data["counters"][entity] = data["counters"].get(entity, 0) + 1
    return data["counters"][entity]


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if "admin_id" not in session:
            flash("Debes iniciar sesión como administrador.", "warning")
            return redirect(url_for("admin_login"))
        return view(*args, **kwargs)

    return wrapped_view


def stats_from_data(data: dict) -> dict[str, int]:
    return {
        "videos": len(data["videos"]),
        "books": len(data["books"]),
        "info_posts": len(data["info_posts"]),
        "questionnaires": len(data["questionnaires"]),
    }


@app.route("/")
def home():
    data = load_data()
    videos = sorted(data["videos"], key=lambda x: x["id"], reverse=True)[:6]
    info_posts = sorted(
        data["info_posts"],
        key=lambda x: (x.get("event_date") or "", x["id"]),
        reverse=True,
    )[:5]
    books_by_category = {}
    for category in BOOK_CATEGORIES:
        books_by_category[category] = [
            b for b in sorted(data["books"], key=lambda x: x["id"], reverse=True) if b["category"] == category
        ]
    questionnaires = sorted(data["questionnaires"], key=lambda x: x["id"], reverse=True)

    return render_template(
        "home.html",
        settings=data["settings"],
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
        data = load_data()
        admin = next((a for a in data["admins"] if a["username"] == username and a["password"] == password), None)
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
    data = load_data()
    return render_template(
        "admin_dashboard.html",
        stats=stats_from_data(data),
        settings=data["settings"],
        categories=BOOK_CATEGORIES,
        videos=sorted(data["videos"], key=lambda x: x["id"], reverse=True),
        books=sorted(data["books"], key=lambda x: x["id"], reverse=True),
        info_posts=sorted(data["info_posts"], key=lambda x: x["id"], reverse=True),
        questionnaires=sorted(data["questionnaires"], key=lambda x: x["id"], reverse=True),
    )


@app.route("/admin/settings", methods=["POST"])
@login_required
def admin_settings():
    data = load_data()
    fields = [
        "site_title",
        "site_subtitle",
        "about_text",
        "book_of_year_title",
        "book_of_year_description",
        "book_of_year_url",
    ]
    for field in fields:
        data["settings"][field] = request.form.get(field, "").strip()
    save_data(data)
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

    data = load_data()
    data["videos"].append(
        {
            "id": next_id(data, "videos"),
            "title": title,
            "url": url,
            "description": description,
            "created_at": now_iso(),
        }
    )
    save_data(data)
    flash("Video agregado correctamente.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/videos/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_videos_delete(item_id: int):
    data = load_data()
    data["videos"] = [item for item in data["videos"] if item["id"] != item_id]
    save_data(data)
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

    data = load_data()
    data["books"].append(
        {
            "id": next_id(data, "books"),
            "title": title,
            "author": author,
            "category": category,
            "file_url": file_url,
            "description": description,
            "created_at": now_iso(),
        }
    )
    save_data(data)
    flash("Libro agregado correctamente.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/books/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_books_delete(item_id: int):
    data = load_data()
    data["books"] = [item for item in data["books"] if item["id"] != item_id]
    save_data(data)
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

    data = load_data()
    data["info_posts"].append(
        {
            "id": next_id(data, "info_posts"),
            "title": title,
            "body": body,
            "event_date": event_date,
            "created_at": now_iso(),
        }
    )
    save_data(data)
    flash("Información publicada.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/info/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_info_delete(item_id: int):
    data = load_data()
    data["info_posts"] = [item for item in data["info_posts"] if item["id"] != item_id]
    save_data(data)
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

    data = load_data()
    data["questionnaires"].append(
        {
            "id": next_id(data, "questionnaires"),
            "title": title,
            "description": description,
            "form_url": form_url,
            "created_at": now_iso(),
        }
    )
    save_data(data)
    flash("Cuestionario agregado.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/questionnaires/<int:item_id>/delete", methods=["POST"])
@login_required
def admin_questionnaire_delete(item_id: int):
    data = load_data()
    data["questionnaires"] = [item for item in data["questionnaires"] if item["id"] != item_id]
    save_data(data)
    flash("Cuestionario eliminado.", "success")
    return redirect(url_for("admin_dashboard"))


ensure_data_file()

if __name__ == "__main__":
    app.run(debug=True)
