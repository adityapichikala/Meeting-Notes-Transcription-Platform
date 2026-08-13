"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateMeeting } from "@/lib/api/client";
import { Meeting } from "@/types";

interface EditMeetingModalProps {
  meeting: Meeting;
  onClose: () => void;
}

export const EditMeetingModal: React.FC<EditMeetingModalProps> = ({
  meeting,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description ?? "");

  const { mutate: doUpdate, isPending } = useMutation({
    mutationFn: () =>
      updateMeeting(meeting.id, {
        title: title.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.setQueryData(["meeting", meeting.id], updated);
      toast.success("Meeting updated");
      onClose();
    },
    onError: (err: Error) =>
      toast.error("Update failed", { description: err.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    doUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <h2 className="font-headline text-xl font-bold text-white">Edit Meeting</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the meeting…"
              className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
