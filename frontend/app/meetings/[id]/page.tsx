"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMeeting, deleteMeeting } from "@/lib/api/client";
import { TranscriptPanel } from "@/components/detail/TranscriptPanel";
import { InsightsPanel } from "@/components/detail/InsightsPanel";
import { MediaPlayer } from "@/components/detail/MediaPlayer";
import { EditMeetingModal } from "@/components/library/EditMeetingModal";
import { TagsEditor } from "@/components/detail/TagsEditor";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: meeting, isLoading, isError } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => getMeeting(id),
  });

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
      router.push("/");
    },
    onError: (err: Error) => toast.error("Delete failed", { description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 font-mono text-xs">Loading meeting…</p>
        </div>
      </div>
    );
  }

  if (isError || !meeting) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Meeting Not Found</h2>
          <p className="text-slate-400 mb-6">The requested meeting could not be loaded.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isReady = meeting.status === "ready";

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* ── Left Panel: Transcript (55%) ── */}
        <section className="w-[55%] h-full flex flex-col border-r border-slate-800/80 relative z-10">
          <header className="p-5 border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md flex-shrink-0">
            <div className="flex items-start justify-between">
              {/* Left: back + title + status */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => router.push("/")}
                  className="mt-0.5 w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-headline text-xl font-bold text-white truncate">
                      {meeting.title}
                    </h2>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 ${
                        isReady
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                        }`}
                      />
                      {meeting.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(meeting.meeting_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {Math.floor(meeting.duration_seconds / 60)}m
                    </span>
                  </div>

                  <div className="mt-2">
                    <TagsEditor meetingId={meeting.id} appliedTagNames={meeting.tags || []} />
                  </div>
                </div>
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-3 relative">
                <button
                  onClick={() => {
                    const format = window.prompt("Enter export format (txt or md):", "md");
                    if (format === "txt" || format === "md") {
                       window.open(`http://localhost:8000/api/v1/meetings/${meeting.id}/export?format=${format}`);
                    }
                  }}
                  title="Export"
                  className="w-8 h-8 rounded-md border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                </button>
                <div className="w-px h-5 bg-slate-800 mx-1"></div>
                <button
                  onClick={() => setShowEditModal(true)}
                  title="Edit meeting"
                  className="w-8 h-8 rounded-md border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete meeting"
                  className="w-8 h-8 rounded-md border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                </button>
              </div>
            </div>
          </header>

          <TranscriptPanel meetingId={meeting.id} />
          <MediaPlayer mediaUrl={meeting.media_url} fallbackDuration={meeting.duration_seconds} />
        </section>

        {/* ── Right Panel: Insights (45%) ── */}
        <InsightsPanel meeting={meeting} />
      </div>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <EditMeetingModal meeting={meeting} onClose={() => setShowEditModal(false)} />
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm glass-card rounded-2xl border border-rose-500/30 p-6 text-center shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-rose-400 mb-3 block">
              warning
            </span>
            <h3 className="font-headline text-lg font-bold text-white mb-1">Delete Meeting?</h3>
            <p className="text-sm text-slate-400 mb-6">
              &ldquo;{meeting.title}&rdquo; and all its transcript, summary, and action items will be
              permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete()}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
