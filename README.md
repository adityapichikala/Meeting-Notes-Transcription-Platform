# MeetingMind

MeetingMind is a web application that stores, transcribes, and analyzes meeting recordings. It uses Next.js on the frontend and FastAPI on the backend.

## Tech Stack

### Frontend
- **Framework:** Next.js 16.3 (App Router)
- **Styling:** Tailwind CSS v4
- **State Management:** TanStack Query (React Query) for server state, Zustand for client state (MediaPlayer)
- **Components:** React Virtuoso (virtualized transcript lists)
- **Language:** TypeScript

### Backend
- **Framework:** FastAPI
- **Database:** SQLite (WAL mode enabled)
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Language:** Python 3.12+

## Architecture Overview

MeetingMind uses a standard decoupled architecture:
1. **Frontend:** A React/Next.js SPA. It communicates with the backend via REST APIs.
2. **Backend:** A FastAPI server. It handles CRUD operations, kicks off background tasks for AI summary generation, and manages the SQLite database.
3. **Database:** SQLite database `meetingmind.db` with an embedded Full-Text Search (FTS5) virtual table for rapid transcript searching.

## Setup Instructions

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Create a virtual environment & install dependencies:**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows
   pip install -r requirements.txt
   ```
3. **Environment Variables:**
   Copy `.env.example` to `.env` (if exists) or create `.env`:
   ```env
   DATABASE_URL="sqlite:///./meetingmind.db"
   OPENAI_API_KEY="your-key-here"  # Optional, for LLM summary generation
   ```
4. **Database Migrations:**
   ```bash
   python -m alembic upgrade head
   ```
5. **Seed Database (Optional):**
   ```bash
   python -m app.seed.seed_data
   ```
6. **Run the Server:**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

## Full API List

### Meetings
- `GET /api/v1/meetings`: List all meetings (supports search, filters, pagination).
- `POST /api/v1/meetings`: Create a meeting (supports JSON, FormData with file, or raw text).
- `GET /api/v1/meetings/{id}`: Get meeting details.
- `PATCH /api/v1/meetings/{id}`: Update meeting metadata.
- `DELETE /api/v1/meetings/{id}`: Delete a meeting.
- `GET /api/v1/meetings/{id}/export`: Export meeting transcript and summary to TXT or Markdown.

### Transcript
- `GET /api/v1/meetings/{id}/transcript`: Get transcript segments. Supports `?q=` for FTS5 search.
- `POST /api/v1/meetings/{id}/transcript`: Append/replace transcript.

### Summary & AI
- `GET /api/v1/meetings/{id}/summary`: Get the meeting summary.
- `POST /api/v1/meetings/{id}/summary/regenerate`: Trigger async summary generation.
- `GET /api/v1/meetings/{id}/topics`: Get the extracted meeting topics.

### Action Items
- `GET /api/v1/meetings/{id}/action-items`: Get action items.
- `POST /api/v1/meetings/{id}/action-items`: Create an action item.
- `PATCH /api/v1/action-items/{id}`: Update an action item (supports optimistic concurrency with `version`).
- `DELETE /api/v1/action-items/{id}`: Delete an action item.

### Search, Tags & Annotations
- `GET /api/v1/search`: Global search across meetings and transcripts.
- `GET /api/v1/tags`: List all tags.
- `POST /api/v1/meetings/{id}/tags`: Add a tag to a meeting.
- `DELETE /api/v1/meetings/{id}/tags/{tag_id}`: Remove a tag.
- `GET /api/v1/meetings/{id}/annotations`: Get annotations for a transcript.
- `POST /api/v1/meetings/{id}/annotations`: Create an annotation (comment/highlight).
- `DELETE /api/v1/annotations/{id}`: Delete an annotation.

## Database Schema

- **Users:** System users (currently a single hardcoded default user).
- **Meetings:** Core entity. Stores title, duration, source, status.
- **Participants:** Meeting attendees.
- **Speakers:** Transcript speakers.
- **TranscriptSegments:** Individual timestamped lines of dialogue.
- **Summaries:** Overall meeting summary.
- **Topics:** Chapterized breakdown of the meeting.
- **ActionItems:** Tasks derived from the meeting.
- **Tags & MeetingTags:** Folksonomy categorization.
- **Annotations:** User comments and highlights on specific transcript segments.
- **transcript_segments_fts (Virtual):** SQLite FTS5 index kept in sync via database triggers.

## Assumptions

- **Single Default User:** Authentication is not implemented. A hardcoded `DEFAULT_USER_ID` is used across the backend.
- **Mocked/LLM Transcription:** We simulate transcription parsing. File uploads accept `.txt`, `.vtt`, or `.json` containing raw transcript text, which is parsed synchronously. Real audio-to-text processing is bypassed.
- **LLM Assisted:** The summary generation uses a background task. If an API key is provided, it can hit a real LLM; otherwise, it falls back to a mock generator.
