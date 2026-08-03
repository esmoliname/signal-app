# Signal - 30-Day Intelligence Hub

**Signal** es una plataforma web de inteligencia en tiempo real de nivel de producción construida como interfaz gráfica y motor de consulta sobre la skill `last30days`.

---

## 🌟 Características Principales

- **Dashboard Vercel/Linear Dark Mode**: Interfaz intuitiva y moderna optimizada para búsqueda rápida.
- **Transmisión en Tiempo Real (SSE)**: Indicadores de progreso por agente paso a paso (escaneo de Reddit, YouTube, Hacker News, GitHub, TikTok, síntesis con IA).
- **Caché Persistente TTL 12h**: Evita saturar APIs externas y limites de tasa HTTP 429 guardando los resultados en SQLite asíncrono.
- **Filtro Interactivo por Red Social**: Organiza los feeds relevantes por fuente con puntuaciones, autores y enlaces directos al origen.
- **Historial de Búsqueda Integrado**: Cajón lateral con búsqueda por palabra clave y carga instantánea.
- **Configuración mediante `pydantic-settings` y `.env`**: Gestión flexible de variables de entorno (claves API, puerto, CORS, ruta de la skill).

---

## 🛠 Stack Tecnológico

* **Backend**: Python 3.11, FastAPI, SQLAlchemy (Async), AIOSQLite, Pydantic-Settings, SSE-Starlette.
* **Frontend**: Vue 3 (Composition API `<script setup>`), Vite, Tailwind CSS, Lucide Icons (`lucide-vue-next`), Marked.js + Highlight.js.
* **Skill Target**: Execución asíncrona mediante subprocessos en `~/.agents/skills/last30days`.

---

## 🚀 Instrucciones de Inicio Rápido

### En Windows (PowerShell):
```powershell
.\start.ps1
```

### En Linux / macOS (Bash):
```bash
chmod +x start.sh
./start.sh
```

### Usando Docker Compose:
```bash
docker-compose up --build
```

---

## ⚙️ Variables de Entorno (.env)

Tanto el backend como el frontend cuentan con plantillas `.env.example`:

### Backend (`backend/.env`):
```env
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

LAST30DAYS_SKILL_PATH=~/.agents/skills/last30days
DATABASE_URL=sqlite+aiosqlite:///./signal_cache.db
CACHE_TTL_HOURS=12
TIMEOUT_SECONDS=120
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000
```
