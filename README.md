# MeetingMind

**MeetingMind** is a full-stack meeting intelligence platform inspired by [Fireflies.ai](https://fireflies.ai). It stores, transcribes, and analyzes meeting recordings — providing AI-generated summaries, timestamped transcripts with speaker diarization, searchable notes, action item tracking, tags, and inline annotations.

> 🚀 **Live Demo:**
> - **Frontend:** [https://meeting-notes-transcription-platfor-gold.vercel.app](https://meeting-notes-transcription-platfor-gold.vercel.app)
> - **Backend API:** [https://meeting-notes-transcription-platform-6paw.onrender.com/api/v1](https://meeting-notes-transcription-platform-6paw.onrender.com/api/v1)
> - **API Docs (Swagger):** [https://meeting-notes-transcription-platform-6paw.onrender.com/docs](https://meeting-notes-transcription-platform-6paw.onrender.com/docs)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Setup Instructions](#setup-instructions)
4. [Database Schema](#database-schema)
5. [API Overview](#api-overview)
6. [Assumptions](#assumptions)
7. [Mocked / Seeded Data](#mocked--seeded-data)
8. [Notes](#notes)

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | **FastAPI** (Python 3.12+) |
| ORM | **SQLAlchemy 2.0** (async-ready, declarative models) |
| Database | **SQLite** with WAL mode + FTS5 full-text search (Postgres-ready via Alembic migrations) |
| Migrations | **Alembic** |
| AI / LLM | Pluggable provider interface — `mock` (default, offline), `grok` (xAI), `openai`, or `anthropic` via `LLM_PROVIDER` env var |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router, TypeScript) |
| Styling | **Tailwind CSS v4** |
| Server State | **TanStack Query (React Query v5)** |
| Client State | **Zustand** (media player sync) |
| UI Components | **React Virtuoso** (virtualized transcript list) |

### Tooling & Design
- UI designed with **Google Stitch** to closely match Fireflies' visual language
- Scaffolded into production code via **Antigravity** (Google DeepMind AI coding assistant)
- Data wiring, hooks, and backend integration via **Claude Code**

---

## Architecture Overview

### Backend — Layered Architecture

```
routers/          ← FastAPI route handlers (HTTP interface)
    ↓
services/         ← Business logic (summary generation, transcript parsing)
    ↓
repositories/     ← Database query layer (SQLAlchemy sessions)
    ↓
models/           ← SQLAlchemy ORM models (table definitions)
core/
  config.py       ← Pydantic Settings (env var loading)
  db.py           ← Engine + session factory
seed/
  seed_data.py    ← Dev/demo seeder script
```

**Key design decisions:**
- All background work (summary regeneration) runs in a FastAPI `BackgroundTask` — no Celery or Redis required.
- SQLite FTS5 virtual table (`transcript_segments_fts`) is kept in sync with `transcript_segments` via database triggers, enabling full-text search with sub-millisecond latency.
- The LLM integration is fully behind an abstract `SummaryGenerator` interface — swapping providers requires only changing `LLM_PROVIDER`.

### Frontend — Directory Structure

```
app/                    ← Next.js App Router pages
  page.tsx              ← Meeting Library (home)
  meetings/[id]/        ← Meeting Detail page
components/
  library/              ← MeetingCard, filters, skeleton loaders
  detail/               ← MediaPlayer, TranscriptView, InsightsPanel
  shared/               ← TopNavBar, SideNavBar, Toast system
lib/
  api/client.ts         ← Typed API client (fetch wrapper)
  hooks/                ← TanStack Query hooks (useMeetings, useSummary, etc.)
  stores/               ← Zustand stores (usePlayerStore)
types/index.ts          ← Shared TypeScript interfaces
```

**Media Player ↔ Transcript Sync:**
The `usePlayerStore` (Zustand) holds the current playback position in milliseconds. The `TranscriptView` component subscribes to this store and uses `react-virtuoso`'s `scrollToIndex` to auto-scroll and highlight the active segment as playback progresses. Clicking a transcript line fires `seek(segment.start_ms)` back into the player — creating a two-way sync loop without prop-drilling.

---

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git

### Running Both Together Locally

Open **two terminals** — one for the backend, one for the frontend.

---

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/Scripts/activate   # Windows (PowerShell: .\venv\Scripts\Activate.ps1)
# source venv/bin/activate     # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create environment file
cp .env.example .env
# Then edit .env — minimum required:
```

```env
# backend/.env
DATABASE_URL=sqlite:///./meetingmind.db
CORS_ORIGINS=["http://localhost:3000"]
LLM_PROVIDER=mock          # or: grok | openai | anthropic
LLM_API_KEY=               # Required only if LLM_PROVIDER != mock
SEED_ON_BOOT=false         # Set to true to auto-seed on first start
```

```bash
# 5. Run Alembic migrations (creates all tables)
python -m alembic upgrade head

# 6. Seed the database with sample data (recommended for first run)
python -m app.seed.seed_data

# 7. Start the backend server
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# 1. Navigate to frontend (in a new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Or create .env.local manually:
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

```bash
# 4. Start the development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## Database Schema

### Entity Relationship Overview

```
users ──< meetings >──< meeting_participants >── participants
              │
              ├──< speakers
              │
              ├──< transcript_segments >──< annotations
              │         │
              │         └── (FTS5 index: transcript_segments_fts)
              │
              ├──< summaries
              │
              ├──< topics
              │
              ├──< action_items
              │
              └──< meeting_tags >── tags
```

### Table Definitions

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | `id`, `email`, `name` | Single default user; no auth |
| `meetings` | `id`, `title`, `duration_ms`, `recorded_at`, `source`, `status`, `owner_id` | Status: `pending` → `processing` → `ready` |
| `participants` | `id`, `name`, `email` | Attendees distinct from transcript speakers |
| `meeting_participants` | `meeting_id`, `participant_id` | Many-to-many join |
| `speakers` | `id`, `meeting_id`, `label`, `color` | Diarization output labels (e.g., "Speaker 1") |
| `transcript_segments` | `id`, `meeting_id`, `speaker_id`, `text`, `start_ms`, `end_ms`, `sequence_index` | One row per spoken segment |
| `summaries` | `id`, `meeting_id`, `overview`, `model_name`, `generated_by`, `status` | One summary per meeting |
| `topics` | `id`, `meeting_id`, `title`, `start_ms`, `sequence_index` | Chapter markers within a meeting |
| `action_items` | `id`, `meeting_id`, `text`, `is_completed`, `source_segment_id`, `version` | `version` supports optimistic concurrency |
| `tags` | `id`, `name`, `color` | Global tag pool |
| `meeting_tags` | `meeting_id`, `tag_id` | Many-to-many join |
| `annotations` | `id`, `meeting_id`, `segment_id`, `user_id`, `body`, `type` | `type`: `comment` or `highlight` |
| `transcript_segments_fts` | *(virtual)* | SQLite FTS5 index, synced via DB triggers |

---

## API Overview

Base URL: `/api/v1`

### Meetings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meetings` | List all meetings (filter by tag, status, search query; pagination) |
| `POST` | `/meetings` | Create a meeting (JSON body, FormData with file upload, or raw text) |
| `GET` | `/meetings/{id}` | Get full meeting detail |
| `PATCH` | `/meetings/{id}` | Update meeting metadata (title, date, etc.) |
| `DELETE` | `/meetings/{id}` | Delete meeting and all related data |
| `GET` | `/meetings/{id}/export` | Export transcript + summary as `txt` or `md` |

### Transcript

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meetings/{id}/transcript` | Get all transcript segments; supports `?q=` for FTS5 full-text search |
| `POST` | `/meetings/{id}/transcript` | Upload or replace transcript (`.txt`, `.vtt`, `.json`, or raw text) |

### Summary & Topics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meetings/{id}/summary` | Get the AI-generated meeting summary |
| `POST` | `/meetings/{id}/summary/regenerate` | Trigger async summary regeneration |
| `GET` | `/meetings/{id}/topics` | Get topic chapter markers |

### Action Items

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meetings/{id}/action-items` | List all action items for a meeting |
| `POST` | `/meetings/{id}/action-items` | Create a new action item |
| `PATCH` | `/action-items/{id}` | Update text or completion status (optimistic concurrency via `version`) |
| `DELETE` | `/action-items/{id}` | Delete an action item |

### Tags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tags` | List all available tags |
| `POST` | `/meetings/{id}/tags` | Apply a tag to a meeting (creates tag if new) |
| `DELETE` | `/meetings/{id}/tags/{tag_id}` | Remove a tag from a meeting |

### Annotations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/meetings/{id}/annotations` | List all annotations on a meeting's transcript |
| `POST` | `/meetings/{id}/annotations` | Create a comment or highlight on a transcript segment |
| `DELETE` | `/annotations/{id}` | Delete an annotation |

### Search & Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/search` | Global search — returns matching meetings and transcript snippet results |
| `GET` | `/health` | Health check endpoint (used by Render for uptime monitoring) |

---

## Assumptions

- **Single default logged-in user; no real authentication implemented** (per assignment scope). A hardcoded `DEFAULT_USER_ID` is used across all backend routes. Adding OAuth or JWT would require minimal changes to the existing structure.

- **Real-time bot/live call joining, third-party integrations (Zoom, Google Meet, calendar, CRM), and team sharing/collaboration** are shown as "Coming Soon" placeholders in the UI and are not implemented.

- **Speaker labels** (Speaker 1, Speaker 2, etc.) are kept separate from meeting participants, matching how real diarization output works — rather than auto-resolved to a named participant. This mirrors Fireflies' own model.

---

## Mocked / Seeded Data

- **Database is seeded with 6 sample meetings**, each with a full transcript, speakers, summary, topic outline, and action items, so the app is usable immediately after running the seed command (`python -m app.seed.seed_data`) or with `SEED_ON_BOOT=true`.

- **AI summaries, topics, and action items are generated by a deterministic mock generator by default** — no external API calls, works fully offline. An optional LLM-based generator is available behind the same `SummaryGenerator` interface, toggled via the `LLM_PROVIDER` environment variable, if an API key is configured. Currently supported providers: `grok` (xAI), `openai`, `anthropic`.

- **Transcripts can be created via `.txt` / `.vtt` / `.json` upload or pasted text.** For plain text without timestamps, timing is evenly distributed across the stated meeting duration as an approximation.

- **Audio/video playback uses placeholder media files**, since real speech-to-text transcription (Whisper, AssemblyAI, etc.) was out of scope per the assignment. The media player UI and transcript sync are fully functional.

---

## Notes

- **Tech stack:** FastAPI + SQLAlchemy + SQLite (Postgres-ready schema/migrations) for backend; Next.js (App Router, TypeScript) + Tailwind + TanStack Query for frontend.

- **UI was designed with Google Stitch** to closely match Fireflies' visual language, scaffolded into production code via **Antigravity** (Google DeepMind), and integrated with real data/logic using **Claude Code**.

- **AI tools were used throughout development** as permitted by the assignment; all code was reviewed and is understood for the evaluation discussion.
