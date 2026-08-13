import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { toast } from "sonner";
import { getMeetingTranscript, getMeetingAnnotations, createAnnotation, deleteAnnotation, Annotation } from "@/lib/api/client";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";

interface TranscriptPanelProps {
  meetingId: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ meetingId }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const { currentTimeMs, seekTo, isPlaying, setIsPlaying } = usePlayerStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const [annotatingSegment, setAnnotatingSegment] = useState<string | null>(null);
  const [annotationType, setAnnotationType] = useState<"comment" | "highlight">("comment");
  const [annotationBody, setAnnotationBody] = useState("");

  const { data: tData, isLoading: tLoading } = useQuery({
    queryKey: ["transcript", meetingId, searchQuery],
    queryFn: () => getMeetingTranscript(meetingId, searchQuery),
  });
  
  const { data: aData = [] } = useQuery({
    queryKey: ["annotations", meetingId],
    queryFn: () => getMeetingAnnotations(meetingId),
  });

  const { mutate: doCreateAnnotation } = useMutation({
    mutationFn: () => createAnnotation(meetingId, { type: annotationType, segment_id: annotatingSegment || undefined, body: annotationBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", meetingId] });
      setAnnotatingSegment(null);
      setAnnotationBody("");
      toast.success("Annotation saved");
    },
    onError: (err: Error) => toast.error("Failed to save annotation", { description: err.message }),
  });

  const { mutate: doDeleteAnnotation } = useMutation({
    mutationFn: (id: string) => deleteAnnotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", meetingId] });
    },
  });

  const segments = tData?.segments || [];
  const annotationsBySegment = useMemo(() => {
    const map: Record<string, Annotation[]> = {};
    aData.forEach(a => {
      if (a.segment_id) {
        if (!map[a.segment_id]) map[a.segment_id] = [];
        map[a.segment_id].push(a);
      }
    });
    return map;
  }, [aData]);

  const activeIndex = useMemo(() => {
    if (!segments.length) return -1;
    for (let i = 0; i < segments.length; i++) {
      if (currentTimeMs >= segments[i].start_ms && currentTimeMs <= segments[i].end_ms) return i;
    }
    for (let i = segments.length - 1; i >= 0; i--) {
      if (currentTimeMs > segments[i].end_ms) return i;
    }
    return 0;
  }, [currentTimeMs, segments]);

  useEffect(() => {
    if (autoScroll && activeIndex !== -1 && virtuosoRef.current && isPlaying) {
      virtuosoRef.current.scrollToIndex({ index: activeIndex, align: "center", behavior: "smooth" });
    }
  }, [activeIndex, autoScroll, isPlaying]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSegmentClick = (startMs: number) => {
    seekTo(startMs);
    if (!isPlaying) setIsPlaying(true);
    setAutoScroll(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      <div className="absolute top-4 right-6 z-20">
        <form onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchTerm); }} className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            className="w-64 bg-slate-800/90 border border-slate-700/50 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-lg backdrop-blur-sm"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      <div className="flex-1 overflow-hidden relative min-h-0">
        {tLoading ? (
          <div className="p-6 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-8 h-4 bg-slate-800 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-slate-800 rounded"></div>
                  <div className="w-3/4 h-3 bg-slate-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : segments.length === 0 ? (
          <div className="p-6 text-slate-400 text-sm">No transcript available.</div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={segments}
            onScroll={() => {}}
            className="h-full w-full"
            style={{ position: "absolute", inset: 0 }}
            itemContent={(index, segment) => {
              const isActive = index === activeIndex;
              const hasHighlight = annotationsBySegment[segment.id]?.some(a => a.type === "highlight");
              const segmentAnnos = annotationsBySegment[segment.id] || [];
              
              return (
                <div className="px-6 py-2 pb-4">
                  <div
                    onClick={() => handleSegmentClick(segment.start_ms)}
                    className={`flex gap-4 p-3 rounded-lg transition-colors cursor-pointer group relative ${
                      isActive
                        ? "bg-purple-900/10 border-l-2 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]"
                        : hasHighlight
                        ? "bg-amber-500/5 border-l-2 border-amber-500/50"
                        : "hover:bg-slate-800/30 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAnnotatingSegment(segment.id); setAnnotationType("highlight"); setAnnotationBody(""); }}
                        className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-amber-400 hover:bg-slate-700"
                        title="Highlight"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAnnotatingSegment(segment.id); setAnnotationType("comment"); setAnnotationBody(""); }}
                        className="w-6 h-6 rounded flex items-center justify-center bg-slate-800 text-blue-400 hover:bg-slate-700"
                        title="Comment"
                      >
                        <span className="material-symbols-outlined text-[14px]">add_comment</span>
                      </button>
                    </div>

                    <span className={`font-mono text-[11px] pt-1 transition-colors ${isActive ? "text-purple-400 font-semibold" : "text-slate-500"}`}>
                      {formatTime(segment.start_ms)}
                    </span>
                    <div className="flex-1 pr-12">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.speaker?.color_hex || "#64748b" }}></span>
                        <span className={`text-xs font-medium transition-colors ${isActive ? "text-white" : "text-slate-400"}`}>
                          {segment.speaker?.label || "Unknown Speaker"}
                        </span>
                      </div>
                      <p className={`transition-colors ${isActive ? "text-white font-medium" : "text-slate-200"}`} dangerouslySetInnerHTML={{ __html: segment.text }} />
                      
                      {segmentAnnos.map(anno => (
                        anno.type === "comment" && (
                          <div key={anno.id} className="mt-2 text-xs bg-slate-800/80 border border-slate-700 rounded-md p-2 flex justify-between items-start group/anno">
                            <div className="flex items-start gap-1 text-slate-300">
                              <span className="material-symbols-outlined text-[14px] text-blue-400 mt-0.5">chat_bubble</span>
                              <span>{anno.body}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); doDeleteAnnotation(anno.id); }}
                              className="text-slate-500 hover:text-rose-400 opacity-0 group-hover/anno:opacity-100 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        )
                      ))}
                      
                      {annotatingSegment === segment.id && (
                        <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            type="text" 
                            value={annotationBody}
                            onChange={e => setAnnotationBody(e.target.value)}
                            placeholder={annotationType === "comment" ? "Add a comment..." : "Highlight description..."}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            onKeyDown={e => {
                                if (e.key === "Enter") doCreateAnnotation();
                                if (e.key === "Escape") setAnnotatingSegment(null);
                            }}
                          />
                          <button onClick={() => doCreateAnnotation()} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium">Save</button>
                          <button onClick={() => setAnnotatingSegment(null)} className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded text-xs">Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

