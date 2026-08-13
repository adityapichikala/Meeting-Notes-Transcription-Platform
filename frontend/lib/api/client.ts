/**
 * API client — thin wrapper around fetch for the MeetingMind backend.
 */

import type {
  HealthResponse,
  Meeting,
  MeetingDetail,
  PaginatedResponse,
  TranscriptSegment,
  Summary,
  Topic,
  ActionItem,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: isFormData
      ? { ...(init?.headers ?? {}) }
      : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  meeting_id: string;
  title: string;
  meeting_date: string;
  match_type: string;
  snippet?: string;
  start_ms?: number;
}

export async function globalSearch(q: string): Promise<SearchResult[]> {
  return apiFetch<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`);
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
}

export async function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>("/tags");
}

export async function addMeetingTag(meetingId: string, name: string): Promise<Tag> {
  return apiFetch<Tag>(`/meetings/${meetingId}/tags`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function removeMeetingTag(meetingId: string, tagId: string): Promise<void> {
  return apiFetch<void>(`/meetings/${meetingId}/tags/${tagId}`, {
    method: "DELETE",
  });
}

// ── Annotations ───────────────────────────────────────────────────────────────

export interface Annotation {
  id: string;
  meeting_id: string;
  segment_id?: string;
  author_id?: string;
  type: string;
  body?: string;
  created_at: string;
}

export async function getMeetingAnnotations(meetingId: string): Promise<Annotation[]> {
  return apiFetch<Annotation[]>(`/meetings/${meetingId}/annotations`);
}

export async function createAnnotation(
  meetingId: string,
  data: { type: string; segment_id?: string; body?: string }
): Promise<Annotation> {
  return apiFetch<Annotation>(`/meetings/${meetingId}/annotations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteAnnotation(annotationId: string): Promise<void> {
  return apiFetch<void>(`/annotations/${annotationId}`, {
    method: "DELETE",
  });
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function getMeetings(params?: {
  q?: string;
  participant_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Meeting>> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }
  return apiFetch<PaginatedResponse<Meeting>>(
    `/meetings?${queryParams.toString()}`
  );
}

export async function getMeeting(id: string): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>(`/meetings/${id}`);
}

export async function createMeeting(formData: FormData): Promise<Meeting> {
  return apiFetch<Meeting>("/meetings", { method: "POST", body: formData });
}

export async function updateMeeting(
  id: string,
  data: { title?: string; description?: string; participants?: string[]; tags?: string[] }
): Promise<Meeting> {
  return apiFetch<Meeting>(`/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/meetings/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }
}

// ── Transcript ────────────────────────────────────────────────────────────────

export async function getMeetingTranscript(
  id: string,
  q?: string
): Promise<{ segments: TranscriptSegment[] }> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<{ segments: TranscriptSegment[] }>(
    `/meetings/${id}/transcript${query}`
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

export async function getMeetingSummary(id: string): Promise<Summary> {
  return apiFetch<Summary>(`/meetings/${id}/summary`);
}

export async function regenerateSummary(id: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/meetings/${id}/summary/regenerate`, {
    method: "POST",
  });
}

// ── Topics ────────────────────────────────────────────────────────────────────

export async function getMeetingTopics(id: string): Promise<Topic[]> {
  return apiFetch<Topic[]>(`/meetings/${id}/topics`);
}

// ── Action Items ──────────────────────────────────────────────────────────────

export async function getMeetingActionItems(id: string): Promise<ActionItem[]> {
  return apiFetch<ActionItem[]>(`/meetings/${id}/action-items`);
}

export async function createActionItem(
  meetingId: string,
  data: { text: string; due_date?: string | null; is_completed?: boolean }
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/meetings/${meetingId}/action-items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateActionItem(
  id: string,
  data: { text?: string; is_completed?: boolean; due_date?: string | null; version: number }
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/action-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteActionItem(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/action-items/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }
}
