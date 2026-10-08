"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Compass, Loader2 } from "lucide-react";

/**
 * Skeleton Loader matching RippleRoute glass aesthetic
 */
function MapSkeleton({ height = "600px" }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-glass-border bg-slate-950/80 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-6 select-none"
      style={{ height }}
    >
      {/* Background Animated Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Radar scanning pulse rings */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 rounded-full border border-cyan-500/20 animate-ping opacity-40 pointer-events-none" />
        <div className="absolute w-32 h-32 rounded-full border border-primary/30 pointer-events-none" />
        <div className="absolute w-20 h-20 rounded-full border border-primary/50 pointer-events-none" />
        
        {/* Core pulsing orb */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/30 to-cyan-500/30 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Compass className="w-7 h-7 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
        </div>
      </div>

      {/* Loading telemetry text */}
      <div className="relative mt-5 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-white tracking-wide">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>Synchronizing Geospatial Telemetry</span>
        </div>
        <p className="text-xs text-muted mt-1 font-mono">
          Coimbatore Urban Grid &bull; Peelamedu Fleet Operations
        </p>
      </div>

      {/* Top right skeleton chip */}
      <div className="absolute top-4 right-4 h-8 w-44 rounded-xl bg-white/5 border border-white/10 animate-pulse hidden sm:block" />
    </div>
  );
}

/**
 * Dynamically loaded FleetMap with SSR disabled and custom skeleton loader
 */
export const FleetMap = dynamic(() => import("./FleetMap"), {
  ssr: false,
  loading: (props) => <MapSkeleton height={props?.height || "600px"} />,
});

export default FleetMap;
