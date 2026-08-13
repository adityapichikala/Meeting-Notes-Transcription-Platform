/**
 * TypeScript type definitions derived from the backend SQLAlchemy models.
 *
 * These types mirror the Pydantic schemas that will be exposed by the API.
 * Keep in sync with backend/app/schemas/ as features are implemented.
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export type MeetingStatus = "processing" | "ready" | "failed";
export type MeetingSource = "upload" | "paste" | "seed";
export type MediaType = "audio" | "video";
export type ParticipantRole = "host" | "attendee";
export type SummaryStatus = "pending" | "ready" | "failed";
export type GeneratedBy = "mock" | "llm";
export type AnnotationType = "comment" | "highlight" | "soundbite";

// ── Entities ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string; // ISO 8601
}

export interface Meeting {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  meeting_date: string; // ISO 8601
  duration_seconds: number;
  media_url: string | null;
  media_type: MediaType;
  status: MeetingStatus;
  source: MeetingSource;
  participants: string[]; // participant IDs
  tags: string[]; // tag IDs
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string | null;
}

export interface MeetingParticipant {
  meeting_id: string;
  participant_id: string;
  role: ParticipantRole;
  participant: Participant;
}

export interface Speaker {
  id: string;
  meeting_id: string;
  label: string;
  color_hex: string;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  speaker_id: string | null;
  sequence_index: number;
  start_ms: number;
  end_ms: number;
  text: string;
  created_at: string;
  speaker?: Speaker;
}

export interface Summary {
  id: string;
  meeting_id: string;
  overview: string | null;
  generated_by: GeneratedBy;
  model_name: string | null;
  generated_at: string | null;
  status: SummaryStatus;
}

export interface Topic {
  id: string;
  meeting_id: string;
  title: string;
  start_ms: number | null;
  sequence_index: number;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  text: string;
  assignee_id: string | null;
  due_date: string | null; // ISO date
  is_completed: boolean;
  source_segment_id: string | null;
  version: number;
  created_at: string;
  assignee?: Participant;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Annotation {
  id: string;
  meeting_id: string;
  segment_id: string | null;
  author_id: string | null;
  type: AnnotationType;
  body: string | null;
  created_at: string;
}

// ── Composite view types (assembled by API) ───────────────────────────────────

/**
 * Full meeting detail — same as Meeting (GET /meetings/{id} returns MeetingResponse).
 * Additional nested data (transcript, summary, topics, action items) are fetched
 * from their own endpoints via TanStack Query.
 */
export type MeetingDetail = Meeting;

// ── API response wrappers ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}
