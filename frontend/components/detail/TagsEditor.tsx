"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTags, addMeetingTag, removeMeetingTag } from "@/lib/api/client";

interface TagsEditorProps {
  meetingId: string;
  appliedTagNames: string[];
}

export const TagsEditor: React.FC<TagsEditorProps> = ({ meetingId, appliedTagNames }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: allTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { mutate: addTag } = useMutation({
    mutationFn: (name: string) => addMeetingTag(meetingId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (err: Error) => toast.error("Failed to add tag", { description: err.message }),
  });

  const { mutate: removeTag } = useMutation({
    mutationFn: (tagId: string) => removeMeetingTag(meetingId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
    onError: (err: Error) => toast.error("Failed to remove tag", { description: err.message }),
  });

  const handleAdd = (name: string) => {
    if (!name.trim() || appliedTagNames.includes(name.trim())) return;
    addTag(name.trim());
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemove = (name: string) => {
    const tag = allTags.find(t => t.name === name);
    if (tag) removeTag(tag.id);
  };

  const suggestions = allTags
    .filter(t => !appliedTagNames.includes(t.name) && t.name.toLowerCase().includes(inputValue.toLowerCase()))
    .slice(0, 5);

  return (
    <div className="flex items-center gap-2 flex-wrap relative" ref={wrapperRef}>
      {appliedTagNames.map(tagName => (
        <span key={tagName} className="group px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[11px] flex items-center gap-1">
          {tagName}
          <button
            onClick={() => handleRemove(tagName)}
            className="w-3 h-3 rounded-full flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-[10px]">close</span>
          </button>
        </span>
      ))}
      
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-2 py-0.5 rounded-md border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 text-[11px] flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[12px]">add</span>
          Add Tag
        </button>
      ) : (
        <div className="relative">
          <input
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd(inputValue);
              if (e.key === "Escape") setIsOpen(false);
            }}
            placeholder="Tag name..."
            className="w-24 bg-slate-800/80 border border-purple-500/50 rounded text-[11px] px-1.5 py-0.5 text-white focus:outline-none focus:w-32 transition-all font-mono"
          />
          {(inputValue || suggestions.length > 0) && (
            <div className="absolute top-full left-0 mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-xl overflow-hidden z-20 min-w-full">
              {suggestions.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleAdd(t.name)}
                  className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  {t.name}
                </button>
              ))}
              {inputValue && !allTags.find(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                <button
                  onClick={() => handleAdd(inputValue)}
                  className="w-full text-left px-2 py-1 text-xs text-purple-400 hover:bg-slate-800 transition-colors border-t border-slate-800/50"
                >
                  Create &quot;{inputValue}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
