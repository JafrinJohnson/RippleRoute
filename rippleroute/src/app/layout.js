import { Space_Grotesk, Inter, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-tamil",
  display: "swap",
});

export const metadata = {
  title: "RippleRoute — Disruption-aware logistics",
  description:
    "Disruption-aware quantum-inspired logistics control web application for KovaiSwift Logistics, Coimbatore.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-accent="violet"
      className={`${spaceGrotesk.variable} ${inter.variable} ${notoSansTamil.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen relative text-text bg-bg selection:bg-primary/30 selection:text-white">
        {/* Animated Aurora Gradient & Subtle Coordinate Grid */}
        <div className="ambient-background" aria-hidden="true">
          <div className="ambient-grid" />
          <div className="aurora-container">
            <div className="aurora-blob aurora-blob-1" />
            <div className="aurora-blob aurora-blob-2" />
            <div className="aurora-blob aurora-blob-3" />
          </div>
        </div>

        {/* Subtle Noise Grain Overlay */}
        <div className="ambient-noise" aria-hidden="true" />

        {/* Core Providers Cascade */}
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
