"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Zap, ShieldCheck, MessageSquare, Compass, Radio } from "lucide-react";

export default function AuthLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-stretch relative">
      {/* ====================================================================
          LEFT SIDE: Animated Route & Ripple Illustration (Hidden on Mobile)
          ==================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-glass-border bg-gradient-to-br from-bg-2/80 via-bg/95 to-bg">
        
        {/* Ambient atmospheric glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan/15 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-glass border border-glass-border flex items-center justify-center shadow-glow group-hover:border-primary/60 transition-all">
              <svg viewBox="0 0 44 44" fill="none" className="w-6 h-6">
                <circle cx="22" cy="22" r="16" stroke="var(--cyan)" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="22" cy="22" r="11" stroke="var(--primary)" strokeWidth="1.8" />
                <path d="M14 26C16 20 20 16 25 15C29 14.3 32 17 33 22" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="29" cy="11" r="3" fill="var(--cyan)" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black font-heading text-text">
                Ripple<span className="text-primary font-black">Route</span>
              </span>
              <p className="text-[10px] text-muted -mt-0.5">
                KovaiSwift Logistics Coimbatore
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Dynamic Animated Route/Ripple Vector Artwork */}
        <div className="relative z-10 my-auto py-8">
          <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center">
            {/* Concentric pulsating ripple circles */}
            <div className="absolute inset-0 rounded-full border border-cyan/20 animate-ping opacity-20" />
            <div className="absolute inset-8 rounded-full border border-primary/25 animate-pulse opacity-40" />
            <div className="absolute inset-16 rounded-full border border-pink/20 animate-pulse opacity-30" />

            {/* Glowing route nodes */}
            <svg className="w-full h-full relative z-10" viewBox="0 0 400 400" fill="none">
              {/* Route lines */}
              <path
                d="M 80,320 C 120,240 180,260 220,180 C 250,120 310,130 340,70"
                stroke="var(--primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="8 6"
              />
              <path
                d="M 80,320 C 140,320 200,280 260,280 C 310,280 320,180 340,70"
                stroke="var(--cyan)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Waypoints */}
              <circle cx="80" cy="320" r="8" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
              <circle cx="220" cy="180" r="7" fill="var(--cyan)" stroke="#fff" strokeWidth="2" />
              <circle cx="340" cy="70" r="9" fill="var(--safe)" stroke="#fff" strokeWidth="2" />

              {/* Pulsing hazard alert pin */}
              <g transform="translate(160, 240)">
                <circle cx="0" cy="0" r="14" fill="rgba(255, 77, 79, 0.2)" className="animate-ping" />
                <circle cx="0" cy="0" r="7" fill="var(--danger)" />
              </g>

              {/* Waypoint labels */}
              <text x="80" y="348" fill="var(--text)" fontSize="11" fontWeight="bold" textAnchor="middle">
                Peelamedu Central
              </text>
              <text x="220" y="160" fill="var(--cyan)" fontSize="11" fontWeight="bold" textAnchor="middle">
                Avinashi Corridor
              </text>
              <text x="340" y="50" fill="var(--safe)" fontSize="11" fontWeight="bold" textAnchor="middle">
                Ghat Pass Terminal
              </text>
            </svg>
          </div>

          {/* Tagline */}
          <div className="text-center space-y-2 mt-4 max-w-md mx-auto">
            <h2 className="text-2xl font-black font-heading text-text">
              {t("hero_headline_1")}{" "}
              <span className="text-primary">{t("hero_headline_2")}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              {t("hero_subtext")}
            </p>
          </div>
        </div>

        {/* Bottom Feature Points */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-6 border-t border-glass-border">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-warn/15 text-warn border border-warn/30 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-text">&lt; 2s Hazards</p>
              <p className="text-[10px] text-muted">Real-time alerts</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-text">QPSO Swarm</p>
              <p className="text-[10px] text-muted">1-Click optimal route</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-cyan/15 text-cyan border border-cyan/30 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-text">Assured SMS</p>
              <p className="text-[10px] text-muted">Customer updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          RIGHT SIDE: The Glass Form (Full Width on Mobile)
          ==================================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
