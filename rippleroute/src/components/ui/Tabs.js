"use client";

import React, { useState } from "react";
import clsx from "clsx";

export default function Tabs({
  tabs = [], // [{ id: 'overview', label: 'Overview', icon: Icon, content: ReactNode }]
  activeId,
  onChange,
  className = "",
  tabListClassName = "",
  panelClassName = "",
}) {
  const [internalActiveId, setInternalActiveId] = useState(tabs[0]?.id || "");
  const currentId = activeId !== undefined ? activeId : internalActiveId;

  const handleTabClick = (id) => {
    if (activeId === undefined) {
      setInternalActiveId(id);
    }
    if (onChange) {
      onChange(id);
    }
  };

  const activeTab = tabs.find((t) => t.id === currentId) || tabs[0];

  return (
    <div className={clsx("w-full flex flex-col gap-4", className)}>
      {/* Tab Navigation Pill Bar */}
      <div
        role="tablist"
        className={clsx(
          "inline-flex p-1.5 rounded-2xl bg-glass border border-glass-border backdrop-blur-md overflow-x-auto no-scrollbar",
          tabListClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentId;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className={clsx(
                "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 select-none whitespace-nowrap",
                isActive
                  ? "bg-primary text-white shadow-glow font-semibold"
                  : "text-muted hover:text-text hover:bg-white/5"
              )}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    "ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-white/10 text-muted"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div
        role="tabpanel"
        className={clsx(
          "w-full transition-opacity duration-200",
          panelClassName
        )}
      >
        {activeTab?.content}
      </div>
    </div>
  );
}
