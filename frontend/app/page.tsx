"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MeetingCard } from "@/components/library/MeetingCard";
import { MeetingCardSkeleton } from "@/components/library/MeetingCardSkeleton";
import { NewMeetingModal } from "@/components/library/NewMeetingModal";
import { getMeetings, getTags } from "@/lib/api/client";

// Inner component that reads search params (must be inside Suspense)
function DashboardContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [filter, setFilter] = useState<string>("All");
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["meetings", { q }],
    queryFn: () => getMeetings({ q, limit: 100 }),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
  });

  const filteredMeetings =
    data?.items.filter((m) => {
      if (filter === "All") return true;
      if (filter === "Uploaded") return m.source === "upload";
      if (filter === "Pasted") return m.source === "paste";
      if (filter === "Seeded") return m.source === "seed";
      if (filter.startsWith("Tag:")) {
        const tagName = filter.replace("Tag:", "").trim();
        return m.tags?.includes(tagName);
      }
      return true;
    }) || [];

  return (
    <div className="h-full overflow-y-auto">
      {/* Background accent */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 p-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline text-[28px] font-bold text-white tracking-tight">
              My Meetings
            </h2>
            <p className="font-label text-xs uppercase tracking-wider text-slate-400 mt-2">
              Manage and analyze your conversations
            </p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-500/30 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Meeting
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
              <span className="material-symbols-outlined text-purple-400 text-2xl">folder_open</span>
            </div>
            <div>
              <p className="font-label text-xs text-slate-400 uppercase tracking-wider">Total Meetings</p>
              <p className="font-headline text-2xl font-semibold text-white mt-0.5">
                {isLoading ? "-" : data?.total || 0}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
              <span className="material-symbols-outlined text-blue-400 text-2xl">schedule</span>
            </div>
            <div>
              <p className="font-label text-xs text-slate-400 uppercase tracking-wider">Hours Recorded</p>
              <p className="font-headline text-2xl font-semibold text-white mt-0.5">
                {isLoading
                  ? "-"
                  : Math.round(
                      (data?.items.reduce((acc, m) => acc + m.duration_seconds, 0) || 0) / 3600
                    )}
                <span className="text-lg text-slate-500 font-medium">h</span>
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
              <span className="material-symbols-outlined text-emerald-400 text-2xl">task_alt</span>
            </div>
            <div>
              <p className="font-label text-xs text-slate-400 uppercase tracking-wider">Meetings Ready</p>
              <p className="font-headline text-2xl font-semibold text-white mt-0.5">
                {isLoading ? "-" : data?.items.filter((m) => m.status === "ready").length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-slate-800/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full sm:w-auto">
            {["All", "Uploaded", "Pasted", "Seeded"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === item
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                {item}
              </button>
            ))}
            {tags.length > 0 && <div className="w-px h-5 bg-slate-800 mx-1"></div>}
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setFilter(`Tag: ${tag.name}`)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono transition-colors whitespace-nowrap ${
                  filter === `Tag: ${tag.name}`
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-800/50"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">sell</span>
                {tag.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            Add meeting
          </button>
        </div>

        {/* Meeting Grid */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-rose-400 font-medium">Failed to load meetings.</p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <MeetingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && filteredMeetings.length === 0 && (
          <div className="text-center py-20 glass-card rounded-xl border border-slate-800/50 flex flex-col items-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">
              search_off
            </span>
            <h3 className="text-xl font-semibold text-white mb-2">No meetings found</h3>
            <p className="text-slate-400 mb-6">
              Try adjusting your search filters or start a new meeting.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Meeting
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredMeetings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      {/* New Meeting Modal */}
      {showNewModal && <NewMeetingModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}

// Outer page with Suspense boundary (required for useSearchParams in static builds)
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {[...Array(4)].map((_, i) => (
                <MeetingCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
