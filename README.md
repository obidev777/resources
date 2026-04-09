# Departamento de Educación Espíritu de Profecía - Misión Villaperla

Sitio web moderno y responsivo hecho con **Python + Flask** (sin librerías frontend externas), con panel de administración completo y base de datos **SQLite**.

## Funcionalidades

- Página pública con secciones:
  - Recursos (Videos y Libros)
  - Información / Calendario
  - Nosotros
  - Libro del Año + Cuestionarios
- Panel administrador para:
  - Configurar textos generales del sitio
  - Crear/eliminar videos
  - Crear/eliminar libros por categorías:
    - Interpretación de Elena White
    - Biográficos de Elena White
    - Defensa del Espíritu de Profecía
    - Otros recursos
  - Crear/eliminar publicaciones informativas
  - Crear/eliminar cuestionarios
- Diseño responsivo con CSS puro.

## Acceso administrador

- URL: `/admin/login`
- Usuario inicial: `admin`
- Contraseña inicial: `admin123`

> Recomendado: cambiar credenciales directamente en la tabla `admins` de SQLite para producción.

## Ejecución local

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Abrir: `http://127.0.0.1:5000`

## Estructura

- `app.py`: lógica principal, rutas y SQLite.
- `app/templates/`: vistas Jinja2.
- `app/static/css/styles.css`: estilos.
- `app/static/js/app.js`: script del menú móvil.
- `app/data/site.db`: base de datos (se crea automáticamente).

## ZIP del proyecto

Puedes generar el ZIP así:

```bash
mkdir -p dist
zip -r dist/departamento-espiritu-profecia.zip app app.py README.md requirements.txt .gitignore
```

