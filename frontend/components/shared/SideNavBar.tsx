"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const SideNavBar: React.FC = () => {
  const pathname = usePathname();

  const getActiveTab = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bg-[#0F0F13] w-[240px] h-screen fixed left-0 top-0 border-r border-slate-800/50 shadow-xl flex flex-col h-full py-6 z-50">
      {/* Brand Header */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-lg">psychiatry</span>
        </div>
        <div>
          <h1 className="font-headline text-xl font-bold text-white tracking-tight">MeetingMind</h1>
          <p className="font-label text-xs uppercase tracking-wider text-slate-500 mt-0.5">
            AI Intelligence
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 active:scale-95 transition-transform group ${
            getActiveTab("/")
              ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-r-2 border-[#8B5CF6] font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-body text-sm">Dashboard</span>
        </Link>
        <Link
          href="/meetings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 active:scale-95 transition-transform group ${
            getActiveTab("/meetings")
              ? "bg-[#8B5CF6]/10 text-[#8B5CF6] border-r-2 border-[#8B5CF6] font-semibold"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <span className="material-symbols-outlined">videocam</span>
          <span className="font-body text-sm">Meetings</span>
        </Link>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 active:scale-95 transition-transform group text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          <span className="material-symbols-outlined">search</span>
          <span className="font-body text-sm">Search</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 active:scale-95 transition-transform group text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          <span className="material-symbols-outlined">star</span>
          <span className="font-body text-sm">Favorites</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200 active:scale-95 transition-transform group text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        >
          <span className="material-symbols-outlined">delete</span>
          <span className="font-body text-sm">Trash</span>
        </a>
      </div>

      {/* Footer */}
      <div className="px-4 mt-auto">
        <button className="w-full mb-6 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-2 px-4 text-sm font-semibold transition-all duration-200 flex justify-center items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          Upgrade to Pro
        </button>
        <div className="space-y-1">
          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors duration-200"
            href="#"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span className="font-body text-sm">Settings</span>
          </a>
          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors duration-200"
            href="#"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span className="font-body text-sm">Support</span>
          </a>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-purple-900 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-white">
            AV
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Alex Vance</p>
            <p className="text-xs text-slate-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </nav>
  );
};
