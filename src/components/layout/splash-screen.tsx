"use client";

import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    // in: 600ms fade+scale → hold: 1800ms → out: 600ms fade
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0d2444 40%, #0a3d62 100%)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 600ms ease" : "none",
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Arka plan dekoratif daireler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/5" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-400/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/3" />
      </div>

      {/* Logo + İsim */}
      <div
        className="flex flex-col items-center gap-6 relative"
        style={{
          transform:
            phase === "in"
              ? "scale(0.8) translateY(20px)"
              : "scale(1) translateY(0)",
          opacity: phase === "in" ? 0 : 1,
          transition:
            "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease",
        }}
      >
        {/* Logo */}
        <div
          className="w-28 h-28 rounded-[32px] flex items-center justify-center relative"
          style={{
            background: "linear-gradient(145deg, #1a6b8a 0%, #0d4f6e 100%)",
            boxShadow:
              "6px 10px 24px rgba(0,0,0,0.5), 0 2px 0 rgba(255,255,255,0.1) inset",
          }}
        >
          <img
            src="/dentalplogo.png"
            alt="DENT-ALP"
            className="w-16 h-16 object-contain drop-shadow-lg"
            onError={(e) => {
              // Logo yoksa fallback SVG
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Fallback dişçi ikonu */}
          <span
            className="material-symbols-outlined text-white text-5xl absolute"
            style={{ fontVariationSettings: "'FILL' 1", display: "none" }}
          >
            dentistry
          </span>
        </div>

        {/* Başlık */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-black text-white tracking-tight font-headline">
            DENT-ALP
          </h1>
          <p className="text-sm font-semibold text-white/50 uppercase tracking-[0.3em]">
            Digital Systems
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
            style={{
              width: phase === "in" ? "0%" : phase === "hold" ? "80%" : "100%",
              transition:
                phase === "hold"
                  ? "width 1600ms cubic-bezier(0.4, 0, 0.2, 1)"
                  : phase === "out"
                    ? "width 400ms ease"
                    : "none",
            }}
          />
        </div>
      </div>

      {/* Alt yazı */}
      <div
        className="absolute bottom-8 flex flex-col items-center gap-1"
        style={{
          opacity: phase === "in" ? 0 : phase === "out" ? 0 : 0.4,
          transition: "opacity 500ms ease",
        }}
      >
        <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">
          Klinik Yönetim Sistemi
        </p>
        <p className="text-[10px] text-white/25 tracking-wider">
          v2.0 · DENT-ALP Digital Systems
        </p>
      </div>
    </div>
  );
}
