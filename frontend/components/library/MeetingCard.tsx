"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Meeting } from "@/types";
import { deleteMeeting } from "@/lib/api/client";
import { EditMeetingModal } from "./EditMeetingModal";

interface MeetingCardProps {
  meeting: Meeting;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  const queryClient = useQueryClient();
  const isReady = meeting.status === "ready";
  const isProcessing = meeting.status === "processing";

  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteMeeting(meeting.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
    },
    onError: (err: Error) =>
      toast.error("Delete failed", { description: err.message }),
  });

  return (
    <>
      <div
        className={`glass-card rounded-xl transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col h-full ${
          isProcessing ? "border-l-2 border-amber-500/50" : ""
        }`}
      >
        {/* Clickable header area */}
        <Link href={`/meetings/${meeting.id}`} className="flex flex-col flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              {isReady && (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-emerald-400 font-medium">
                    Ready
                  </span>
                </>
              )}
              {isProcessing && (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-amber-400 font-medium">
                    Processing
                  </span>
                </>
              )}
            </div>
            <span className="font-mono text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/30">
              {Math.round(meeting.duration_seconds / 60)}m
            </span>
          </div>

          <h3 className="font-headline text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors line-clamp-1">
            {meeting.title}
          </h3>

          <div className="flex items-center gap-3 text-sm text-slate-400 mb-6">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {new Date(meeting.meeting_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span className="flex items-center gap-1 text-slate-500 capitalize">
              <span className="material-symbols-outlined text-[16px]">
                {meeting.source === "upload" ? "cloud_upload" : "mic"}
              </span>
              {meeting.source}
            </span>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
            <div className="flex -space-x-2">
              {(meeting.participants?.slice(0, 3) || []).map((p_id, i) => {
                const colors = ["bg-indigo-500", "bg-rose-500", "bg-amber-500"];
                return (
                  <div
                    key={p_id}
                    className={`w-7 h-7 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0F0F13] relative`}
                    style={{ zIndex: 30 - i }}
                  >
                    {p_id.substring(0, 2).toUpperCase()}
                  </div>
                );
              })}
              {(meeting.participants?.length || 0) > 3 && (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0F0F13] relative z-0">
                  +{(meeting.participants?.length || 0) - 3}
                </div>
              )}
              {(!meeting.participants || meeting.participants.length === 0) && (
                <div className="text-xs text-slate-500 italic">No participants</div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 justify-end w-full">
              {meeting.tags?.map(tag => (
                <span key={tag} className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {(!meeting.tags || meeting.tags.length === 0) && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-[14px]">sell</span>
                  0
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* ⋮ Menu button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 opacity-0 group-hover:opacity-100 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>

          {showMenu && (
            <>
              {/* Click-away overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-36 glass-card rounded-lg border border-slate-700/60 shadow-xl overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Delete confirm overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-30 bg-[#0F0F13]/95 rounded-xl flex flex-col items-center justify-center gap-4 p-6">
            <span className="material-symbols-outlined text-4xl text-rose-400">warning</span>
            <p className="text-sm text-slate-200 text-center font-medium">
              Delete &ldquo;{meeting.title}&rdquo;?
            </p>
            <p className="text-xs text-slate-400 text-center">
              This will permanently remove the meeting and all its data.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete()}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditMeetingModal
          meeting={meeting}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};
