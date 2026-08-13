"use client";

import React, { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createMeeting } from "@/lib/api/client";

interface NewMeetingModalProps {
  onClose: () => void;
}

type Tab = "upload" | "paste" | "manual";

const ACCEPTED_TYPES = [".txt", ".vtt", ".json"];
const ACCEPTED_MIME = ["text/plain", "text/vtt", "application/json"];

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  // ── Upload tab state ──────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Paste tab state ───────────────────────────────────────────────────────
  const [pasteText, setPasteText] = useState("");

  // ── Common fields ─────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [duration, setDuration] = useState("");

  // ── Mutation ───────────────────────────────────────────────────────────────
  const { mutate: doCreate, isPending } = useMutation({
    mutationFn: (fd: FormData) => createMeeting(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting created", {
        description: "Your meeting is being processed.",
      });
      onClose();
    },
    onError: (err: Error) =>
      toast.error("Failed to create meeting", { description: err.message }),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const validateFile = (f: File): string | null => {
    if (f.size === 0) return "File is empty.";
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(f.type)) {
      return `Unsupported file type. Accepted: ${ACCEPTED_TYPES.join(", ")}`;
    }
    return null;
  };

  const handleFileChange = (f: File) => {
    const err = validateFile(f);
    setFileError(err);
    if (!err) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    } else {
      setFile(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileChange(dropped);
  }, [title]);

  const buildFormData = (): FormData | null => {
    if (!title.trim()) {
      toast.error("Title is required");
      return null;
    }
    if (!meetingDate) {
      toast.error("Meeting date is required");
      return null;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("meeting_date", new Date(meetingDate).toISOString());
    if (duration) fd.append("duration_seconds", String(Number(duration) * 60));

    if (activeTab === "upload") {
      if (!file) { toast.error("Please select a file to upload"); return null; }
      fd.append("file", file);
    } else if (activeTab === "paste") {
      if (!pasteText.trim()) { toast.error("Transcript text cannot be empty"); return null; }
      fd.append("raw_transcript", pasteText.trim());
    }
    return fd;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = buildFormData();
    if (fd) doCreate(fd);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "upload", label: "Upload File", icon: "upload_file" },
    { id: "paste", label: "Paste Text", icon: "content_paste" },
    { id: "manual", label: "Manual Entry", icon: "edit_note" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg glass-card rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <div>
            <h2 className="font-headline text-xl font-bold text-white">New Meeting</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload a transcript or enter details manually</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === t.id
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ── Upload tab ── */}
          {activeTab === "upload" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-purple-500 bg-purple-500/10"
                  : fileError
                  ? "border-rose-500/50 bg-rose-500/5"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-slate-700 hover:border-slate-600 bg-slate-800/20 hover:bg-slate-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.vtt,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
              />
              {file && !fileError ? (
                <>
                  <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2 block">check_circle</span>
                  <p className="text-sm font-medium text-emerald-300">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </>
              ) : fileError ? (
                <>
                  <span className="material-symbols-outlined text-4xl text-rose-400 mb-2 block">error</span>
                  <p className="text-sm font-medium text-rose-300">{fileError}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to choose another file</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-slate-500 mb-2 block">
                    {isDragging ? "file_download" : "cloud_upload"}
                  </span>
                  <p className="text-sm text-slate-300 font-medium">
                    {isDragging ? "Drop file here" : "Drag & drop or click to browse"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports .txt, .vtt, .json transcripts</p>
                </>
              )}
            </div>
          )}

          {/* ── Paste tab ── */}
          {activeTab === "paste" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Transcript Text
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={8}
                placeholder={"00:00 Speaker A: Hello everyone...\n00:15 Speaker B: Let's get started..."}
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Paste raw text, VTT, or simple timestamped format.
              </p>
            </div>
          )}

          {/* ── Manual tab ── */}
          {activeTab === "manual" && (
            <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-500 mb-2 block">edit_note</span>
              <p className="text-sm text-slate-300 font-medium">Manual entry</p>
              <p className="text-xs text-slate-500 mt-1">
                Fill in the title and date below — you can add a transcript later.
              </p>
            </div>
          )}

          {/* ── Common metadata fields ── */}
          <div className="space-y-3 pt-2 border-t border-slate-800/60">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Roadmap Sync"
                required
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date & Time <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  required
                  className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="0"
                  placeholder="45"
                  className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Create Meeting
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
