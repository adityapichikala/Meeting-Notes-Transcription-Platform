"use client";

import React, { useRef, useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/stores/usePlayerStore";

interface MediaPlayerProps {
  mediaUrl: string | null;
  fallbackDuration?: number;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ mediaUrl, fallbackDuration = 3600 }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    currentTimeMs,
    isPlaying,
    seekRequestMs,
    setCurrentTimeMs,
    setIsPlaying,
    setDurationMs,
    clearSeekRequest
  } = usePlayerStore();
  
  // Local state for duration if media doesn't have one
  const [duration, setDuration] = useState(fallbackDuration);

  // The actual URL to play
  const src = mediaUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn("Autoplay prevented or error playing:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    if (seekRequestMs !== null && audioRef.current) {
      audioRef.current.currentTime = seekRequestMs / 1000;
      clearSeekRequest();
    }
  }, [seekRequestMs, clearSeekRequest]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTimeMs(audioRef.current.currentTime * 1000);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      setDurationMs(dur * 1000);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = pos * duration;
    }
  };

  const currentSec = currentTimeMs / 1000;
  const progressPercent = duration > 0 ? (currentSec / duration) * 100 : 0;

  return (
    <div className="glass-card border-t border-slate-800/80 p-4 flex items-center gap-4">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/20 flex-shrink-0"
      >
        <span className="material-symbols-outlined text-[24px]">
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-1">
          <span className="text-purple-400">{formatTime(currentSec)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div 
          className="h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
          onClick={handleSeekClick}
        >
          <div 
            className="h-full bg-purple-500 absolute top-0 left-0 bottom-0 pointer-events-none transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
