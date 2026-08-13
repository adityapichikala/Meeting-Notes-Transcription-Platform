"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMeetingSummary, regenerateSummary } from "@/lib/api/client";

interface SummaryTabProps {
  meetingId: string;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ meetingId }) => {
  const queryClient = useQueryClient();

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["summary", meetingId],
    queryFn: () => getMeetingSummary(meetingId),
    retry: false,
  });

  const { mutate: doRegenerate, isPending: isRegenerating } = useMutation({
    mutationFn: () => regenerateSummary(meetingId),
    onSuccess: () => {
      toast.success("Summary regeneration queued", {
        description: "This may take a few seconds. The panel will update when ready.",
      });
      // Poll for updated summary after 3s
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["summary", meetingId] });
      }, 3000);
    },
    onError: (err: Error) => {
      toast.error("Regeneration failed", { description: err.message });
    },
  });

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-5 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-semibold text-white">AI Summary</h3>
          <div className="flex items-center gap-2">
            {summary?.model_name && (
              <span className="text-[10px] font-mono bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                {summary.model_name}
              </span>
            )}
            <button
              onClick={() => doRegenerate()}
              disabled={isRegenerating}
              title="Regenerate AI summary"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isRegenerating
                  ? "bg-purple-900/20 text-purple-400 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-purple-500/50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[14px] ${isRegenerating ? "animate-spin" : ""}`}
              >
                {isRegenerating ? "refresh" : "auto_awesome"}
              </span>
              {isRegenerating ? "Generating…" : "Regenerate"}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-800 rounded w-5/6"></div>
            <div className="h-3 bg-slate-800 rounded w-4/6"></div>
          </div>
        )}

        {isError && (
          <p className="text-sm text-slate-500 italic">
            No summary available yet. Click Regenerate to generate one.
          </p>
        )}

        {!isLoading && !isError && summary && (
          <>
            <p className="text-sm text-slate-300 leading-relaxed">
              {summary.overview}
            </p>
            {summary.generated_at && (
              <p className="text-[10px] text-slate-600 font-mono mt-3">
                Generated {new Date(summary.generated_at).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
