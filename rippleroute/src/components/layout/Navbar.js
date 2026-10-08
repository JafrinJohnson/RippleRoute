"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";
import {
  Sun,
  Moon,
  Menu,
  X,
  Languages,
  Radio,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function Navbar({ onOpenAuthModal, onQuickAction }) {
  const { theme, toggleTheme, accent, setAccent, isDark } = useTheme();
  const { language, setLanguage, t, isTamil } = useLanguage();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: t("nav_about") },
    { href: "#features", label: t("nav_features") },
    { href: "#how-it-works", label: t("nav_how_it_works") },
    { href: "#roles", label: t("nav_roles") },
    { href: "#contact", label: t("nav_contact") },
  ];

  const accentOptions = [
    { id: "violet", color: "#7C5CFF", label: "Violet" },
    { id: "cyan", color: "#00E5FF", label: "Cyan" },
    { id: "pink", color: "#FF3D8B", label: "Pink" },
  ];

  const handleLanguageSwitch = (newLang) => {
    setLanguage(newLang);
    toast({
      type: "info",
      title: newLang === "ta" ? "தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது" : "English Selected",
      description: newLang === "ta" ? "அனைத்து தகவல்களும் தமிழில் கிடைக்கும்" : "Interface switched to English",
      duration: 3000,
    });
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast({
      type: "info",
      title: t("toast_theme_changed"),
      description: theme === "dark" ? "Light Mode Active" : "Dark Mode Active",
      duration: 2500,
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-bg/80 border-b border-glass-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="RippleRoute Home"
          >
            {/* Custom SVG Ripple Wave Route Logo */}
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-glass border border-glass-border shadow-glow group-hover:border-primary/60 transition-all duration-300">
              <svg
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 transform group-hover:scale-105 transition-transform duration-300"
              >
                {/* Outermost Ripple Wave */}
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                  strokeOpacity="0.3"
                  strokeDasharray="4 3"
                />
                {/* Mid Ripple Wave */}
                <circle
                  cx="22"
                  cy="22"
                  r="13"
                  stroke="var(--cyan)"
                  strokeWidth="1.5"
                  strokeOpacity="0.55"
                />
                {/* Core Dynamic Logistics Path Swarm */}
                <path
                  d="M12 28C14.5 21 19 16 25 15C29 14.3 32 17 33 22C33.8 26 27 27 24 23C21.5 19.5 23 13 29 11"
                  stroke="var(--primary)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Vector Convergence Node */}
                <circle cx="29" cy="11" r="3" fill="var(--cyan)" />
                <circle cx="12" cy="28" r="2.2" fill="var(--pink)" />
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold font-heading tracking-tight text-text">
                  Ripple<span className="text-primary font-black">Route</span>
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                  QARS v2.4
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-muted tracking-wide -mt-0.5">
                {t("company_name")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-xl text-xs xl:text-sm font-medium text-muted hover:text-text hover:bg-glass transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Controls Group: Accent, Language, Theme, Auth */}
          <div className="hidden sm:flex items-center gap-2 md:gap-3">
            
            {/* Accent Color Switcher Dots */}
            <div
              className="flex items-center gap-1.5 p-1 rounded-full bg-glass border border-glass-border"
              title="Change Accent Color"
            >
              {accentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccent(opt.id)}
                  aria-label={`Select ${opt.label} accent`}
                  className="relative w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none"
                  style={{ backgroundColor: opt.color }}
                >
                  {accent === opt.id && (
                    <span className="absolute inset-0 rounded-full ring-2 ring-white/80 ring-offset-1 ring-offset-bg" />
                  )}
                </button>
              ))}
            </div>

            {/* Language Switcher Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-glass border border-glass-border text-xs">
              <button
                type="button"
                onClick={() => handleLanguageSwitch("en")}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  language === "en"
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch("ta")}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  language === "ta"
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Theme Toggle Button (Sun/Moon) */}
            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="p-2.5 rounded-xl bg-glass border border-glass-border text-muted hover:text-text hover:border-primary/40 transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-warn animate-in zoom-in" />
              ) : (
                <Moon className="w-4 h-4 text-primary animate-in zoom-in" />
              )}
            </button>

            {/* Auth Action Buttons */}
            {onOpenAuthModal ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAuthModal("login")}
                  className="hidden md:inline-flex"
                >
                  {t("nav_login")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={ArrowRight}
                  onClick={() => onOpenAuthModal("signup")}
                >
                  {t("nav_get_started")}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    {t("nav_login")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight={ArrowRight}
                  >
                    {t("nav_get_started")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 sm:hidden">
            {/* Quick Theme Toggle on Mobile */}
            <button
              type="button"
              onClick={handleThemeToggle}
              className="p-2 rounded-xl bg-glass border border-glass-border text-muted"
            >
              {isDark ? <Sun className="w-4 h-4 text-warn" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="p-2 rounded-xl bg-glass border border-glass-border text-text hover:border-primary/40 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Glass Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-glass-border bg-bg-2/95 backdrop-blur-2xl p-5 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3">
            <nav className="flex flex-col gap-1 pb-3 border-b border-glass-border">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-text hover:bg-glass"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Controls in Mobile Menu */}
            <div className="flex items-center justify-between py-2 border-b border-glass-border">
              <span className="text-xs text-muted">Theme & Accent:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-glass border border-glass-border">
                  {accentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAccent(opt.id)}
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-glass-border">
              <span className="text-xs text-muted">Language / மொழி:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch("en")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    language === "en" ? "bg-primary text-white" : "text-muted bg-glass"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSwitch("ta")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    language === "ta" ? "bg-primary text-white" : "text-muted bg-glass"
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {onOpenAuthModal ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal("login");
                    }}
                  >
                    {t("nav_login")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal("signup");
                    }}
                  >
                    {t("nav_get_started")}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">
                      {t("nav_login")}
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full">
                      {t("nav_get_started")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
