"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMeetingTopics } from "@/lib/api/client";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";

interface TopicsTabProps {
  meetingId: string;
}

const formatTime = (ms: number | null) => {
  if (ms === null || ms === undefined) return "";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const TopicsTab: React.FC<TopicsTabProps> = ({ meetingId }) => {
  const { seekTo, setIsPlaying, currentTimeMs } = usePlayerStore();

  const { data: topics, isLoading, isError } = useQuery({
    queryKey: ["topics", meetingId],
    queryFn: () => getMeetingTopics(meetingId),
    retry: false,
  });

  const handleTopicClick = (startMs: number | null) => {
    if (startMs !== null) {
      seekTo(startMs);
      setIsPlaying(true);
    }
  };

  // Determine the "active" topic (the one currently playing)
  const activeTopicIndex = React.useMemo(() => {
    if (!topics?.length) return -1;
    let active = 0;
    for (let i = 0; i < topics.length; i++) {
      if (topics[i].start_ms !== null && currentTimeMs >= (topics[i].start_ms ?? 0)) {
        active = i;
      }
    }
    return active;
  }, [topics, currentTimeMs]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 p-3 glass-card rounded-lg">
            <div className="w-6 h-6 bg-slate-800 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
              <div className="h-2 bg-slate-800/60 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !topics?.length) {
    return (
      <p className="text-sm text-slate-500 italic">
        No topics generated for this meeting yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-label uppercase tracking-wider text-slate-500 mb-3">
        {topics.length} chapter{topics.length !== 1 ? "s" : ""} — click to jump
      </p>
      {topics.map((topic, index) => {
        const isActive = index === activeTopicIndex;
        return (
          <button
            key={topic.id}
            onClick={() => handleTopicClick(topic.start_ms)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all group ${
              isActive
                ? "bg-purple-900/15 border border-purple-500/30"
                : "glass-card border border-slate-800/60 hover:border-slate-700"
            }`}
          >
            {/* Chapter number bubble */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                isActive
                  ? "bg-purple-500 text-white"
                  : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
              }`}
            >
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium leading-snug transition-colors ${
                  isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                }`}
              >
                {topic.title}
              </p>
              {topic.start_ms !== null && (
                <p
                  className={`text-[11px] font-mono mt-0.5 transition-colors ${
                    isActive ? "text-purple-400" : "text-slate-500"
                  }`}
                >
                  {formatTime(topic.start_ms)}
                </p>
              )}
            </div>

            <span
              className={`material-symbols-outlined text-[16px] flex-shrink-0 transition-colors ${
                isActive ? "text-purple-400" : "text-slate-600 group-hover:text-slate-400"
              }`}
            >
              play_circle
            </span>
          </button>
        );
      })}
    </div>
  );
};
