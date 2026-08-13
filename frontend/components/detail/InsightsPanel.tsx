"use client";

import React, { useState } from "react";
import { Meeting } from "@/types";
import { SummaryTab } from "./SummaryTab";
import { TopicsTab } from "./TopicsTab";
import { ActionItemsTab } from "./ActionItemsTab";

interface InsightsPanelProps {
  meeting: Meeting;
}

type Tab = "summary" | "topics" | "action_items";

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ meeting }) => {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "summary", label: "Summary", icon: "auto_awesome" },
    { id: "topics", label: "Topics", icon: "tag" },
    { id: "action_items", label: "Actions", icon: "check_box" },
  ];

  return (
    <section className="w-[45%] h-full flex flex-col bg-slate-900/10">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-3 border-b border-slate-800/50 bg-[#0B0B0F]/50 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md font-label text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === tab.id
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[15px] ${
                tab.id === "summary" ? "text-purple-400" : ""
              }`}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "summary" && <SummaryTab meetingId={meeting.id} />}
        {activeTab === "topics" && <TopicsTab meetingId={meeting.id} />}
        {activeTab === "action_items" && <ActionItemsTab meetingId={meeting.id} />}
      </div>
    </section>
  );
};
