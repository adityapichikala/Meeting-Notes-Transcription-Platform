"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { globalSearch, SearchResult } from "@/lib/api/client";
import { useDebounce } from "use-debounce";

interface TopNavBarProps {
  onNewMeetingClick?: () => void;
}

// Inner component that reads search params
function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedSearch.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      setIsSearching(true);
      try {
        const data = await globalSearch(debouncedSearch);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (res: SearchResult) => {
    setShowDropdown(false);
    setSearchTerm("");
    if (res.match_type === "transcript" && res.start_ms !== undefined) {
      router.push(`/meetings/${res.meeting_id}?t=${res.start_ms}`);
    } else {
      router.push(`/meetings/${res.meeting_id}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/?q=${encodeURIComponent(searchTerm)}`);
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-96 hidden md:block group">
      <form onSubmit={handleSearch}>
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-purple-500 transition-colors">
          search
        </span>
        <input
          className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg pl-10 pr-12 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-body shadow-inner"
          placeholder="Global search (meetings, transcripts)..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-96 overflow-y-auto z-50">
          {results.length === 0 && !isSearching ? (
            <div className="p-4 text-sm text-slate-400 text-center">No results found</div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {results.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleResultClick(res)}
                  className="w-full text-left p-3 hover:bg-slate-800/60 transition-colors flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{res.title}</span>
                    <span className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {res.match_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-400">
                      {new Date(res.meeting_date).toLocaleDateString()}
                    </span>
                    {res.start_ms !== undefined && (
                      <span className="text-xs font-mono text-slate-500">
                        {Math.floor(res.start_ms / 60000)}:{(Math.floor(res.start_ms / 1000) % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>
                  {res.snippet && (
                    <p
                      className="text-xs text-slate-300 italic mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: res.snippet }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onNewMeetingClick }) => {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-[#0F0F13]/80 backdrop-blur-md border-b border-slate-800/50 flex justify-between items-center px-8 z-40">
      <div className="flex-1 flex items-center">
        {/* Suspense required because SearchBar uses useSearchParams */}
        <Suspense fallback={
          <div className="relative w-96 hidden md:block">
            <div className="w-full bg-slate-800/40 border border-slate-700/50 rounded-lg h-8 animate-pulse" />
          </div>
        }>
          <SearchBar />
        </Suspense>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-purple-500 rounded-full"></span>
        </button>
        <button
          onClick={onNewMeetingClick}
          className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm py-1.5 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Meeting
        </button>
      </div>
    </header>
  );
};
