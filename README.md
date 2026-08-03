<div align="center">

# Signal Intelligence
### Enterprise 30-Day Trend Aggregator & Agentic Intelligence Engine

*Extracting high-density signals from multi-platform noise using cutting-edge Agent Skills.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.4+-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-last30days-FF6B6B?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#license)

</div>

---

## Executive Summary

**Signal Intelligence** is a production-grade web application and agentic middleware designed to solve the modern problem of **information overload in technology and AI ecosystems**. While traditional search engines return SEO-optimized articles and static pages, critical industry shifts occur across walled gardens—Reddit threads, video transcripts, GitHub commit logs, Hacker News debates, and social signals.

Built as a high-performance wrapper around the open-source **`last30days` Agent Skill**, Signal Intelligence orchestrates parallel multi-platform extractions, cleanses raw unstructured data, and synthesizes executive-level reports with zero hallucination and complete source attribution.

---

## The AI Agent Skill Paradigm

### What is an Agent Skill?
An **Agent Skill** is a modular, self-contained instruction and execution packet that endows autonomous AI agents with specialized capabilities they do not natively possess. Standard LLMs cannot bypass walled gardens, parse upvote/downvote ratios, stream YouTube transcript timestamps, or extract GitHub commit velocity in real time.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        TRADITIONAL LLM SEARCH                           │
│                                                                         │
│ User Query ──► Generic Web Search ──► SEO Articles & Marketing          │
└─────────────────────────────────────────────────────────────────────────┘

                                  VS

┌─────────────────────────────────────────────────────────────────────────┐
│                  SIGNAL INTELLIGENCE (SKILL ENGINE)                     │
│                                                                         │
│ User Query ──► last30days Skill CLI ──► Parallel Platform Scrapers      │
│                                         (Reddit, YT, HN, GH, TT)        │
│                                                   │                     │
│                                                   ▼                     │
│                                      Synthesis & Metric Extraction      │
│                                                   │                     │
│                                                   ▼                     │
│                                    Executive Markdown + Native Links    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Advantages of the `last30days` Engine
* **Bypassing Walled Gardens:** Simultaneously parses Reddit discussions with engagement metrics, YouTube video transcripts, Hacker News comments, GitHub trending repositories, and TikTok sentiment.
* **Temporal Precision:** Restricts scraping strictly to the last 7, 15, or 30 days to filter out stale data and focus on active momentum.
* **Zero-Reimplementation Pattern:** The backend calls the skill via sub-process CLI (`--emit json`), guaranteeing that upstream improvements to the skill engine instantly propagate to the application without breaking API contracts.

---

## Core Capabilities & Benefits

| Feature | Technical Description | User Benefit |
| :--- | :--- | :--- |
| **Multi-Platform Synthesis** | Unified data ingestion from Reddit, YouTube, Hacker News, GitHub, and TikTok. | Complete market awareness in seconds without opening dozens of browser tabs. |
| **Photorealistic WebGL Orb** | Custom `Three.js` GLSL vertex & fragment shaders with Simplex noise, Fresnel rim lighting, and spectral chromatic iridescence. | Visual feedback during processing and an executive-grade aesthetic interface. |
| **Executive Dark & Light UI** | Reactive theme engine supporting Slate Obsidian (`#0B0F17`) and Executive Light (`#F8FAFC`) palettes. | High contrast legibility under any ambient lighting condition. |
| **100% Reactive i18n** | Full internationalization layer supporting instantaneous English (EN) and Spanish (ES) switching. | Native UX for global engineering and research teams. |
| **Contextual Follow-up Chat** | SSE streaming conversational layer linked to specific research tasks. | Ask granular questions, summarize points, or extract action items without re-scraping. |
| **Mobile Off-Canvas Drawer** | Fully responsive layout utilizing Tailwind breakpoints with an integrated mobile sidebar drawer for iOS & Android. | Seamless experience on smartphones without horizontal scroll leakage. |
| **SQLite Session Storage** | Persistent record storing task parameters, feeds, key insights, and chat threads. | Instant recall of previous research sessions with full CRUD operations. |

---

## System Architecture

Signal Intelligence utilizes a decoupled architecture designed for low latency, maximum reliability, and process isolation.

```text
 +-----------------------------------+
 |         Vue 3 Frontend Client     |
 |  - Pinia Reactive State Store     |
 |  - Three.js / GLSL Shader Canvas  |
 |  - i18n & Theme Composables       |
 +-----------------+-----------------+
                   | HTTP REST / SSE Streaming
 +-----------------v-----------------+
 |         FastAPI Backend Engine    |
 |  - Asynchronous Router            |
 |  - SQLite / aiosqlite Layer       |
 |  - CORS & Error Handling          |
 +-----------------+-----------------+
                   | Async Subprocess Execution (PYTHONUTF8=1 Isolation)
 +-----------------v-----------------+
 |         last30days Skill Runner   |
 |  `python last30days.py`           |
 |  `--query <q> --emit json`        |
 +-----------------+-----------------+
                   |
 +-----------------v-----------------+
 |    External Platforms (API / Web) |
 |  [Reddit] [YouTube] [HN] [GitHub] |
 +-----------------------------------+
```

---

## Directory Structure

```text
signal-app/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers & SSE endpoints
│   │   ├── core/         # Subprocess CLI runner & JSON parser
│   │   ├── db/           # SQLite database models & session handlers
│   │   └── main.py       # Application setup, CORS & middleware
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Vue SFCs (HologramOrb, Metrics, ResearchForm, Chat)
│   │   ├── composables/  # Theme management & i18n reactive dictionaries
│   │   ├── services/     # Centralized HTTP API client with AbortController
│   │   ├── stores/       # Pinia history & session management
│   │   └── views/        # Main Dashboard layout
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js    # Vite build configuration
├── start.ps1             # Automated startup script (Windows PowerShell)
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **Python:** v3.11 or higher
* **Git**

### Installation

1. **Clone the Repository:**
```bash
git clone https://github.com/esmoliname/signal-app.git
cd signal-app
```

2. **Backend Setup:**
```bash
cd backend
python -m venv venv
# Activate Environment:
# Windows PowerShell: .\venv\Scripts\Activate
# macOS / Linux: source venv/bin/activate
pip install -r requirements.txt
```

3. **Frontend Setup:**
```bash
cd ../frontend
npm install
```

### Running Locally

**To launch both services automatically using the verified start script:**
```powershell
# In Windows PowerShell:
.\start.ps1
```

**Or start the servers manually in separate terminal windows:**
```bash
# Terminal 1: Backend API (FastAPI)
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend Client (Vue 3 / Vite)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Reference

### Research Endpoints

* **`POST /api/research`**
  Triggers an asynchronous research job using the `last30days` skill engine.
  * **Request Body:**
    ```json
    {
      "topic": "DeepSeek R1",
      "days": 30,
      "sources": ["reddit", "youtube", "hackernews", "github", "tiktok"],
      "bypass_cache": false
    }
    ```
  * **Response (HTTP 200):**
    ```json
    {
      "task_id": "req_98f12a8c",
      "status": "completed",
      "topic": "DeepSeek R1",
      "days": 30,
      "summary_md": "# Executive Summary...",
      "metrics": {
        "volume": 3467,
        "dominant_source": "Hacker News",
        "keywords": ["DeepSeek", "R1", "Optimization", "Scalability", "Production"]
      },
      "feeds": [...]
    }
    ```

* **`GET /api/history`**
  Fetches all stored research sessions from SQLite.

* **`DELETE /api/history/{task_id}`**
  Permanently deletes a research session from SQLite.

* **`POST /api/research/{task_id}/chat`**
  Sends a contextual follow-up query based on an existing research task.

## Production Build & Deployment

### Building the Frontend
To compile the Vue 3 application into optimized static assets:
```bash
cd frontend
npm run build
```
The output will be generated in `frontend/dist`.

### Deployment Architecture
* **Frontend:** Deploy `frontend/dist` to Vercel, Netlify, or Cloudflare Pages.
* **Backend:** Deploy `backend/` to Render, Railway, or an AWS EC2 instance ensuring Python 3.11+ and the `last30days` skill scripts are present in the environment.

## License
This project is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).
