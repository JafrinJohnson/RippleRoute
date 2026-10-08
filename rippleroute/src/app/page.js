"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  GlassCard,
  Button,
  Badge,
  Input,
  Select,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
  Zap,
  ShieldAlert,
  Truck,
  Clock,
  Compass,
  AlertTriangle,
  CheckCircle,
  Radio,
  Send,
  Layers,
  MapPin,
  Sparkles,
  HeartPulse,
  ArrowRight,
  MessageSquare,
  Globe,
  Sliders,
  Check,
  ChevronRight,
  Phone,
  Mail,
  Building,
  Activity,
  Flame,
} from "lucide-react";

// Dynamically load the 3D Delivery Truck Scene with SSR disabled per rules
const DeliveryTruckScene = dynamic(
  () => import("@/components/3d/DeliveryTruckScene"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] sm:h-[460px] lg:h-[520px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">
            Initializing 3D Simulation...
          </span>
        </div>
      </div>
    ),
  }
);

// Motion reveal animation helpers
const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function LandingPage() {
  const { t, isTamil } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { loginDemo } = useAuth();

  const handleDemoLogin = async (role, destination) => {
    await loginDemo(role);
    toast({
      type: "success",
      title: "Demo Cockpit Loaded",
      description: `Entered as ${role.toUpperCase()} (1-Click Demo Evaluation)`,
    });
    router.push(destination);
  };

  // Contact form client states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("admin");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactLoading(true);

    setTimeout(() => {
      setContactLoading(false);
      toast({
        type: "success",
        title: t("contact_toast_success_title"),
        description: t("contact_toast_success_desc"),
        duration: 5000,
      });
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden selection:bg-primary/30 selection:text-white">
      {/* Sticky Glass Navbar */}
      <Navbar />

      <main className="flex-1 w-full space-y-24 sm:space-y-32 pb-20">
        
        {/* ====================================================================
            1. HERO SECTION (Full Viewport)
            ==================================================================== */}
        <section
          id="hero"
          className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-4 sm:pt-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
            
            {/* Left Content (7 Cols) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6 xl:col-span-7 flex flex-col items-start gap-6 text-left"
            >
              {/* Region Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-glass border border-glass-border backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                <span className="text-xs font-semibold text-text tracking-wide">
                  {t("hero_pill")}
                </span>
                <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/25">
                  KovaiSwift
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-text leading-[1.12]">
                {t("hero_headline_1")}{" "}
                <span className="bg-gradient-to-r from-primary via-cyan to-pink bg-clip-text text-transparent">
                  {t("hero_headline_2")}
                </span>
              </h1>

              {/* Sub-Text */}
              <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed">
                {t("hero_subtext")}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
                <Link href="/signup">
                  <Button
                    variant="primary"
                    size="lg"
                    iconRight={ArrowRight}
                    className="w-full sm:w-auto shadow-glow"
                  >
                    {t("hero_btn_get_started")}
                  </Button>
                </Link>

                <Link href="/live-map">
                  <Button
                    variant="cyan"
                    size="lg"
                    icon={MapPin}
                    className="w-full sm:w-auto shadow-glow-cyan font-bold"
                  >
                    {isTamil ? "நேரடி வரைபடம்" : "View Live Map"}
                  </Button>
                </Link>

                <a href="#how-it-works">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={Compass}
                    className="w-full sm:w-auto"
                  >
                    {t("hero_btn_how_it_works")}
                  </Button>
                </a>
              </div>

              {/* Operational Proof Metric Strip */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-glass-border w-full max-w-lg">
                <div>
                  <span className="text-xl sm:text-2xl font-black font-heading text-text">
                    &lt; 2s
                  </span>
                  <p className="text-[11px] text-muted">{isTamil ? "அபாய ஒளிபரப்பு" : "Hazard Broadcast"}</p>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black font-heading text-cyan">
                    128
                  </span>
                  <p className="text-[11px] text-muted">{isTamil ? "QPSO திரள் வழிகள்" : "QPSO Swarm Vectors"}</p>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black font-heading text-safe">
                    100%
                  </span>
                  <p className="text-[11px] text-muted">{isTamil ? "நேரடி SMS விநியோகம்" : "Direct SMS Delivery"}</p>
                </div>
              </div>
            </motion.div>

            {/* Right 3D Scene with Floating Glass Chips (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 xl:col-span-5 relative w-full flex items-center justify-center"
            >
              {/* Outer decorative ambient glow aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-cyan/15 to-transparent rounded-full filter blur-3xl pointer-events-none -z-10" />

              {/* 3D Canvas Container */}
              <div className="w-full relative rounded-3xl bg-glass/40 border border-glass-border shadow-2xl backdrop-blur-sm overflow-hidden">
                <DeliveryTruckScene />

                {/* Floating Glass Chip 1 (Top Left) */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="absolute top-4 left-4 z-20 pointer-events-auto"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-2/85 backdrop-blur-xl border border-glass-border shadow-lg">
                    <Zap className="w-3.5 h-3.5 text-warn shrink-0" />
                    <span className="text-xs font-semibold text-text whitespace-nowrap">
                      {t("hero_chip_hazards")}
                    </span>
                  </div>
                </motion.div>

                {/* Floating Glass Chip 2 (Bottom Right) */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                  className="absolute bottom-5 right-4 z-20 pointer-events-auto"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-2/85 backdrop-blur-xl border border-glass-border shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-cyan shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold text-text whitespace-nowrap">
                      {t("hero_chip_qpso")}
                    </span>
                  </div>
                </motion.div>

                {/* Floating Glass Chip 3 (Bottom Left) */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                  className="absolute bottom-5 left-4 z-20 pointer-events-auto hidden sm:block"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-2/85 backdrop-blur-xl border border-glass-border shadow-lg">
                    <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-text whitespace-nowrap">
                      {t("hero_chip_sms")}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ====================================================================
            2. ABOUT SECTION (Crisp 3 lines)
            ==================================================================== */}
        <section id="about" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          <motion.div {...fadeInUp}>
            <GlassCard
              padding="p-8 sm:p-10"
              className="relative overflow-hidden border-primary/30 shadow-glow"
            >
              {/* Decorative background watermark */}
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-8 translate-y-8">
                <Truck className="w-72 h-72 text-primary" />
              </div>

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {t("about_badge")}
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {t("company_name")}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-text">
                  {t("about_title")}
                </h2>

                <div className="space-y-3.5 text-sm sm:text-base text-muted leading-relaxed">
                  <p className="text-text font-medium border-l-2 border-primary pl-4">
                    {t("about_line_1")}
                  </p>
                  <p className="border-l-2 border-cyan pl-4">
                    {t("about_line_2")}
                  </p>
                  <p className="border-l-2 border-pink pl-4">
                    {t("about_line_3")}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* ====================================================================
            3. THE 3 QUESTIONS SECTION
            ==================================================================== */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge variant="safe" size="sm">
              {t("questions_badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-text">
              {t("questions_title")}
            </h2>
            <p className="text-sm sm:text-base text-muted">
              {t("questions_subtitle")}
            </p>
          </motion.div>

          {/* Cards with Connecting Flowing Line */}
          <div className="relative">
            {/* Animated flowing gradient line behind cards (desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 z-0">
              <div className="w-full h-full bg-gradient-to-r from-primary via-cyan to-pink opacity-30 rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-shimmer" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
              {/* Question 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <GlassCard hover className="h-full border-warn/30 shadow-glow-warn flex flex-col justify-between">
                  <div>
                    <div className="p-3.5 rounded-2xl bg-warn/15 text-warn border border-warn/30 w-fit mb-5 shadow-sm">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-warn tracking-widest uppercase">
                      Telemetry Ingestion
                    </span>
                    <h3 className="text-xl font-bold font-heading text-text mt-1 mb-3">
                      {t("q1_title")}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {t("q1_desc")}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-glass-border flex items-center text-xs font-semibold text-warn">
                    <span>Incident Sensing</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </GlassCard>
              </motion.div>

              {/* Question 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <GlassCard hover className="h-full border-cyan/30 shadow-glow-cyan flex flex-col justify-between">
                  <div>
                    <div className="p-3.5 rounded-2xl bg-cyan/15 text-cyan border border-cyan/30 w-fit mb-5 shadow-sm">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-cyan tracking-widest uppercase">
                      Ripple Topology
                    </span>
                    <h3 className="text-xl font-bold font-heading text-text mt-1 mb-3">
                      {t("q2_title")}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {t("q2_desc")}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-glass-border flex items-center text-xs font-semibold text-cyan">
                    <span>Downstream Propagation</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </GlassCard>
              </motion.div>

              {/* Question 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <GlassCard hover className="h-full border-primary/30 shadow-glow flex flex-col justify-between">
                  <div>
                    <div className="p-3.5 rounded-2xl bg-primary/15 text-primary border border-primary/30 w-fit mb-5 shadow-sm">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-primary tracking-widest uppercase">
                      Quantum Action
                    </span>
                    <h3 className="text-xl font-bold font-heading text-text mt-1 mb-3">
                      {t("q3_title")}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {t("q3_desc")}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-glass-border flex items-center text-xs font-semibold text-primary">
                    <span>Adaptive Swarm Convergence</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            4. SPECIALITIES: Bento Grid (6 Tiles with Animated CSS/SVG Visuals)
            ==================================================================== */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge variant="info" size="sm">
              {t("bento_badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-text">
              {t("bento_title")}
            </h2>
            <p className="text-sm sm:text-base text-muted">
              {t("bento_subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Tile 1 (LARGEST: Spans 2 Columns): QARS Engine with Animated Swarm Visual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2"
            >
              <GlassCard hover className="h-full border-primary/40 shadow-glow p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-3">
                    <Badge variant="info" size="sm">
                      {t("bento_1_tag")}
                    </Badge>
                    <h3 className="text-2xl font-bold font-heading text-text">
                      {t("bento_1_title")}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {t("bento_1_desc")}
                    </p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-safe" />
                        <span>QPSO Energy Modeling</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-safe" />
                        <span>Dynamic Grade Resistance</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated CSS Particle Swarm Visual */}
                  <div className="lg:col-span-5 h-48 sm:h-56 relative flex items-center justify-center rounded-2xl bg-bg/80 border border-glass-border overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 300 200" fill="none">
                      {/* Flowing background routes */}
                      <path
                        d="M 30,100 Q 150,20 270,100"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <path
                        d="M 30,100 Q 150,180 270,100"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      {/* QARS Collapsed Optimal Route (Neon Glow) */}
                      <path
                        d="M 30,100 C 110,60 190,70 270,100"
                        stroke="var(--cyan)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Swarm particles converging */}
                      <circle cx="85" cy="80" r="3" fill="var(--primary)" className="animate-ping opacity-75" />
                      <circle cx="150" cy="73" r="4.5" fill="var(--cyan)" className="animate-pulse" />
                      <circle cx="210" cy="86" r="3" fill="var(--pink)" className="animate-ping opacity-75" />

                      {/* Start and End Hubs */}
                      <circle cx="30" cy="100" r="6" fill="var(--primary)" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="270" cy="100" r="6" fill="var(--safe)" stroke="#fff" strokeWidth="1.5" />

                      <text x="30" y="125" fill="var(--muted)" fontSize="9" textAnchor="middle">Peelamedu</text>
                      <text x="270" y="125" fill="var(--muted)" fontSize="9" textAnchor="middle">Destination</text>
                    </svg>
                    <span className="absolute bottom-2 text-[10px] text-cyan font-mono bg-bg-2/80 px-2 py-0.5 rounded border border-glass-border">
                      128 Particles Converging (0.014s)
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Tile 2: Live Fleet on Satellite & Terrain Maps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard hover className="h-full p-6 flex flex-col justify-between">
                <div>
                  <div className="h-36 rounded-2xl bg-bg/70 border border-glass-border mb-5 relative overflow-hidden flex items-center justify-center">
                    {/* Topographic elevation contours simulation */}
                    <svg className="w-full h-full opacity-60" viewBox="0 0 200 120">
                      <path d="M 0,30 Q 50,70 100,40 T 200,60" stroke="var(--cyan)" strokeWidth="1.2" fill="none" opacity="0.4" />
                      <path d="M 0,60 Q 60,100 120,70 T 200,90" stroke="var(--primary)" strokeWidth="1.2" fill="none" opacity="0.6" />
                      <path d="M 0,90 Q 70,120 140,95 T 200,110" stroke="var(--pink)" strokeWidth="1.2" fill="none" opacity="0.3" />
                      {/* Live driver marker pin */}
                      <circle cx="110" cy="65" r="4.5" fill="var(--safe)" className="animate-ping" />
                      <circle cx="110" cy="65" r="3" fill="#fff" />
                    </svg>
                    <span className="absolute top-2 right-2 text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold">
                      CARTO + Esri
                    </span>
                  </div>

                  <Badge variant="safe" size="sm">
                    {t("bento_2_tag")}
                  </Badge>
                  <h3 className="text-lg font-bold font-heading text-text mt-2 mb-2">
                    {t("bento_2_title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("bento_2_desc")}
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* Tile 3: Hazard Intelligence (Rain, Landslide, Accidents) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard hover className="h-full p-6 flex flex-col justify-between border-warn/30">
                <div>
                  <div className="h-36 rounded-2xl bg-bg/70 border border-glass-border mb-5 relative p-4 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-warn">
                        <AlertTriangle className="w-4 h-4 animate-bounce" />
                        Ghat Section Alert
                      </span>
                      <span className="text-[10px] text-muted">&lt; 2s</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-glass border border-glass-border text-[11px] text-text font-mono">
                      Mettupalayam KM 14: Landslide detected
                    </div>
                    <div className="w-full bg-warn/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-warn h-full w-4/5 animate-pulse" />
                    </div>
                  </div>

                  <Badge variant="warn" size="sm">
                    {t("bento_3_tag")}
                  </Badge>
                  <h3 className="text-lg font-bold font-heading text-text mt-2 mb-2">
                    {t("bento_3_title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("bento_3_desc")}
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* Tile 4: Emergency Priority for Medical & Food Cargo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard hover className="h-full p-6 flex flex-col justify-between border-pink/30 shadow-glow-pink">
                <div>
                  <div className="h-36 rounded-2xl bg-bg/70 border border-glass-border mb-5 relative flex items-center justify-center p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-pink/20 text-pink border border-pink/40 animate-pulse">
                        <HeartPulse className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-pink">Medical Oxygen</span>
                        <span className="text-[11px] text-muted">Lifespan reserve: 3h 30m</span>
                        <span className="text-[10px] text-safe font-semibold">Priority: Priority-Alpha</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="emergency" size="sm" pulse>
                    {t("bento_4_tag")}
                  </Badge>
                  <h3 className="text-lg font-bold font-heading text-text mt-2 mb-2">
                    {t("bento_4_title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("bento_4_desc")}
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* Tile 5: Real SMS with Assured ETA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard hover className="h-full p-6 flex flex-col justify-between">
                <div>
                  <div className="h-36 rounded-2xl bg-bg/70 border border-glass-border mb-5 p-3 flex flex-col justify-center gap-2">
                    <div className="p-2.5 rounded-xl bg-glass border border-glass-border text-[11px] text-text shadow-sm">
                      <p className="font-semibold text-primary text-[10px]">SMS from KovaiSwift</p>
                      <p className="text-[10px] text-muted line-clamp-2">
                        Rerouted via Annur due to roadblock. Assured ETA: 18 mins.
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted px-1">
                      <span>Delivered via GSM Gateway</span>
                      <span className="text-safe flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Sent
                      </span>
                    </div>
                  </div>

                  <Badge variant="info" size="sm">
                    {t("bento_5_tag")}
                  </Badge>
                  <h3 className="text-lg font-bold font-heading text-text mt-2 mb-2">
                    {t("bento_5_title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("bento_5_desc")}
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            {/* Tile 6: English & Tamil Bilingual Intelligence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard hover className="h-full p-6 flex flex-col justify-between">
                <div>
                  <div className="h-36 rounded-2xl bg-bg/70 border border-glass-border mb-5 flex flex-col items-center justify-center gap-2 p-3">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-xl bg-glass border border-glass-border text-xs font-bold text-text">
                        English
                      </div>
                      <Globe className="w-4 h-4 text-primary animate-spin" />
                      <div className="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-xs font-bold text-cyan">
                        தமிழ்
                      </div>
                    </div>
                    <span className="text-[11px] text-muted">
                      இயல்பான தமிழ் மற்றும் ஆங்கில வழிகாட்டல்
                    </span>
                  </div>

                  <Badge variant="neutral" size="sm">
                    {t("bento_6_tag")}
                  </Badge>
                  <h3 className="text-lg font-bold font-heading text-text mt-2 mb-2">
                    {t("bento_6_title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("bento_6_desc")}
                  </p>
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </section>

        {/* ====================================================================
            5. HOW IT WORKS (5-Step Timeline)
            ==================================================================== */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <Badge variant="primary" size="sm">
              {t("how_badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-text">
              {t("how_title")}
            </h2>
            <p className="text-sm sm:text-base text-muted">
              {t("how_subtitle")}
            </p>
          </motion.div>

          {/* 5-Step Timeline: Horizontal on Desktop, Vertical on Mobile */}
          <div className="relative">
            {/* Desktop continuous track bar */}
            <div className="hidden lg:block absolute top-7 left-12 right-12 h-0.5 bg-gradient-to-r from-warn via-primary to-safe opacity-30 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-warn/15 border border-warn/30 text-warn flex items-center justify-center font-bold font-heading text-lg mb-4 shadow-glow-warn">
                  01
                </div>
                <h4 className="text-base font-bold font-heading text-text mb-1">
                  {t("how_step_1_title")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {t("how_step_1_desc")}
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan/15 border border-cyan/30 text-cyan flex items-center justify-center font-bold font-heading text-lg mb-4 shadow-glow-cyan">
                  02
                </div>
                <h4 className="text-base font-bold font-heading text-text mb-1">
                  {t("how_step_2_title")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {t("how_step_2_desc")}
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center font-bold font-heading text-lg mb-4 shadow-glow">
                  03
                </div>
                <h4 className="text-base font-bold font-heading text-text mb-1">
                  {t("how_step_3_title")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {t("how_step_3_desc")}
                </p>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-pink/15 border border-pink/30 text-pink flex items-center justify-center font-bold font-heading text-lg mb-4 shadow-glow-pink">
                  04
                </div>
                <h4 className="text-base font-bold font-heading text-text mb-1">
                  {t("how_step_4_title")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {t("how_step_4_desc")}
                </p>
              </motion.div>

              {/* Step 5 */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-safe/15 border border-safe/30 text-safe flex items-center justify-center font-bold font-heading text-lg mb-4 shadow-glow-safe">
                  05
                </div>
                <h4 className="text-base font-bold font-heading text-text mb-1">
                  {t("how_step_5_title")}
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  {t("how_step_5_desc")}
                </p>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ====================================================================
            6. ROLES SECTION (Admin, Driver, Emergency)
            ==================================================================== */}
        <section id="roles" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge variant="info" size="sm">
              {t("roles_badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-text">
              {t("roles_title")}
            </h2>
            <p className="text-sm sm:text-base text-muted">
              {t("roles_subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Role 1: Admin */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard hover className="h-full p-7 flex flex-col justify-between border-primary/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-primary/15 text-primary border border-primary/30">
                      <Sliders className="w-6 h-6" />
                    </span>
                    <Badge variant="info" size="sm">
                      CENTRAL
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading text-text">
                      {t("role_admin_title")}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {t("role_admin_sub")}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-muted">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{t("role_admin_b1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{t("role_admin_b2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{t("role_admin_b3")}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-glass-border">
                  <Link href="/signup?role=admin" className="w-full block">
                    <Button variant="primary" size="md" className="w-full">
                      {t("role_admin_btn")}
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>

            {/* Role 2: Driver */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard hover className="h-full p-7 flex flex-col justify-between border-cyan/30 shadow-glow-cyan">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-cyan/15 text-cyan border border-cyan/30">
                      <Truck className="w-6 h-6" />
                    </span>
                    <Badge variant="safe" size="sm">
                      FIELD HUD
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading text-text">
                      {t("role_driver_title")}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {t("role_driver_sub")}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-muted">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                      <span>{t("role_driver_b1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                      <span>{t("role_driver_b2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                      <span>{t("role_driver_b3")}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-glass-border">
                  <Link href="/signup?role=driver" className="w-full block">
                    <Button variant="cyan" size="md" className="w-full">
                      {t("role_driver_btn")}
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>

            {/* Role 3: Emergency */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard hover className="h-full p-7 flex flex-col justify-between border-pink/40 shadow-glow-pink">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-pink/20 text-pink border border-pink/40">
                      <HeartPulse className="w-6 h-6" />
                    </span>
                    <Badge variant="emergency" size="sm" pulse>
                      PRIORITY 1
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading text-text">
                      {t("role_emergency_title")}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {t("role_emergency_sub")}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-muted">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-pink shrink-0 mt-0.5" />
                      <span>{t("role_emergency_b1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-pink shrink-0 mt-0.5" />
                      <span>{t("role_emergency_b2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-pink shrink-0 mt-0.5" />
                      <span>{t("role_emergency_b3")}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-glass-border">
                  <Link href="/signup?role=emergency" className="w-full block">
                    <Button variant="danger" size="md" className="w-full">
                      {t("role_emergency_btn")}
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>

          </div>

          {/* Try the Demo 1-Click Access Panel for Reviewers */}
          <motion.div {...fadeInUp} className="mt-8">
            <GlassCard padding="p-6 sm:p-8" className="border-cyan/30 shadow-glow-cyan bg-bg-2/80">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="safe" size="sm" pulse>
                      {isTamil ? "1-கிளிக் சோதனை" : "1-CLICK EVALUATION"}
                    </Badge>
                    <span className="text-xs text-muted font-mono">
                      {isTamil ? "சான்றுகள் தேவையில்லை" : "No Credentials Required"}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-heading text-text">
                    {isTamil ? "டெமோ கட்டுப்பாட்டு அறைகள்" : "Try the Demo Cockpits"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl leading-relaxed">
                    {isTamil
                      ? "முன் கட்டமைக்கப்பட்ட KovaiSwift சுயவிவரங்களுடன் நேரடி மிஷன் கட்டுப்பாட்டுக்குள் நுழையுங்கள்: செயல்பாட்டு நிர்வாகி, வாகன ஓட்டுநர், அல்லது அவசரப் போக்குவரத்து."
                      : "Instantly enter live mission control with pre-seeded KovaiSwift profiles: Operations Admin, Fleet Driver, or Priority Emergency Transit."}
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    icon={ShieldAlert}
                    onClick={() => handleDemoLogin("admin", "/admin")}
                    className="flex-1 sm:flex-none shadow-glow font-bold"
                  >
                    {isTamil ? "நிர்வாகியாக நுழைக" : "Enter as Admin"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={Truck}
                    onClick={() => handleDemoLogin("driver", "/driver")}
                    className="flex-1 sm:flex-none hover:border-cyan/50 text-cyan-400 font-bold"
                  >
                    {isTamil ? "ஓட்டுநராக நுழைக" : "Enter as Driver"}
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    icon={HeartPulse}
                    onClick={() => handleDemoLogin("emergency", "/emergency")}
                    className="flex-1 sm:flex-none shadow-glow-danger font-bold"
                  >
                    {isTamil ? "அவசரப்பிரிவாக நுழைக" : "Enter as Emergency"}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* ====================================================================
            7. CONTACT SECTION (Information + Front-end only form)
            ==================================================================== */}
        <section id="contact" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
          <motion.div {...fadeInUp}>
            <GlassCard padding="p-8 sm:p-12" className="border-glass-border shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left Information */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <Badge variant="info" size="sm">
                      {t("contact_badge")}
                    </Badge>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-text">
                      {t("contact_title")}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {t("contact_subtitle")}
                    </p>
                  </div>

                  {/* Institutional & Team details */}
                  <div className="space-y-4 pt-4 border-t border-glass-border text-xs sm:text-sm">
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-text">{t("contact_org")}</span>
                        <p className="text-xs text-muted">Saravanampatti, Coimbatore, Tamil Nadu</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-cyan shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-text">{t("contact_team")}</span>
                        <p className="text-xs text-muted">KovaiSwift Regional Logistics Unit</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-pink shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-text">{t("contact_email")}</span>
                        <p className="text-xs text-muted">Dispatch & Developer Feed</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-safe shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-text">{t("contact_phone")}</span>
                        <p className="text-xs text-muted">Direct Operational Inquiries</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Form */}
                <div className="lg:col-span-7">
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t("contact_form_name")}
                        placeholder={t("contact_form_name_placeholder")}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                      />

                      <Input
                        label={t("contact_form_email")}
                        type="email"
                        placeholder={t("contact_form_email_placeholder")}
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Select
                      label={t("contact_form_role")}
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      options={[
                        { value: "admin", label: "Operations Manager / Dispatcher" },
                        { value: "driver", label: "Fleet Logistics Driver" },
                        { value: "emergency", label: "Hospital / Healthcare Cargo Dispatcher" },
                      ]}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted tracking-wide">
                        {t("contact_form_message")}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder={t("contact_form_message_placeholder")}
                        className="w-full bg-glass text-text placeholder-muted/60 text-sm rounded-xl px-4 py-2.5 border border-glass-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full mt-2"
                      loading={contactLoading}
                      icon={Send}
                    >
                      {t("contact_btn_send")}
                    </Button>
                  </form>
                </div>

              </div>
            </GlassCard>
          </motion.div>
        </section>

      </main>

      {/* ====================================================================
          8. FOOTER
          ==================================================================== */}
      <footer className="border-t border-glass-border bg-bg-2/80 backdrop-blur-xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-glass border border-glass-border flex items-center justify-center shadow-glow">
              <svg viewBox="0 0 44 44" fill="none" className="w-5 h-5">
                <circle cx="22" cy="22" r="13" stroke="var(--cyan)" strokeWidth="1.8" />
                <path d="M14 26C16 20 20 16 25 15C29 14.3 32 17 33 22" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="29" cy="11" r="3" fill="var(--cyan)" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-extrabold font-heading text-text">
                Ripple<span className="text-primary font-black">Route</span>
              </span>
              <span className="text-[10px] text-muted -mt-0.5">
                {t("footer_desc")}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-muted flex-wrap justify-center">
            <a href="#about" className="hover:text-text transition-colors">
              {t("nav_about")}
            </a>
            <a href="#features" className="hover:text-text transition-colors">
              {t("nav_features")}
            </a>
            <a href="#how-it-works" className="hover:text-text transition-colors">
              {t("nav_how_it_works")}
            </a>
            <a href="#roles" className="hover:text-text transition-colors">
              {t("nav_roles")}
            </a>
            <a href="#contact" className="hover:text-text transition-colors">
              {t("nav_contact")}
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted text-center md:text-right">
            <p>{t("footer_copy")}</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
