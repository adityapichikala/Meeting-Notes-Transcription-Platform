import React from "react";

export const MeetingCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col h-full animate-pulse border border-slate-800/50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          <div className="w-16 h-3 bg-slate-700 rounded"></div>
        </div>
        <div className="w-10 h-5 bg-slate-800/80 rounded border border-slate-700/30"></div>
      </div>
      
      {/* Title */}
      <div className="w-3/4 h-6 bg-slate-700 rounded mb-1"></div>
      
      {/* Meta info */}
      <div className="flex items-center gap-3 text-sm text-slate-400 mb-6 mt-3">
        <div className="w-20 h-4 bg-slate-800 rounded"></div>
        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
        <div className="w-16 h-4 bg-slate-800 rounded"></div>
      </div>
      
      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-[#0F0F13] z-30"></div>
          <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-[#0F0F13] z-20"></div>
          <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-[#0F0F13] z-10"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-4 bg-slate-800 rounded"></div>
          <div className="w-8 h-4 bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>
  );
};
