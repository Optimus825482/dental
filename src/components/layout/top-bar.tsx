"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useDesktopStore } from "@/stores/desktop-store";
import { useWindowStore } from "@/stores/window-store";

export function TopBar() {
  const { data: session } = useSession();
  const {
    widgetsLocked,
    toggleLock,
    zoomLevel,
    setZoom,
    toggleWidgetVisibility,
    hiddenWidgets,
  } = useDesktopStore();
  const { openWindow } = useWindowStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "DA";

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 h-12 bg-white/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30 z-[200]">
      <div className="flex items-center gap-6">
        <span className="text-lg font-black text-primary tracking-tight font-headline flex items-center gap-2">
          <img
            src="/dentalplogo.png"
            alt="DENT-ALP"
            className="w-7 h-7 object-contain"
          />
          DENT-ALP
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-surface-container rounded-lg transition-all">
          <span className="material-symbols-outlined text-outline">
            notifications
          </span>
        </button>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`p-2 rounded-lg transition-all ${settingsOpen ? "bg-primary-container/20 text-primary" : "hover:bg-surface-container text-outline"}`}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>

          {settingsOpen && (
            <>
              <div
                className="fixed inset-0 z-[19998]"
                onClick={() => setSettingsOpen(false)}
              />
              <div className="absolute right-0 top-12 z-[19999] w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-outline-variant/20 overflow-hidden">
                <div className="p-3 border-b border-outline-variant/10">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest px-2">
                    Masaüstü Ayarları
                  </p>
                </div>

                {/* Widget Kilidi */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      toggleLock();
                      setSettingsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant">
                        {widgetsLocked ? "lock" : "lock_open"}
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        Masaüstü Öğeleri
                      </span>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${widgetsLocked ? "bg-primary" : "bg-outline-variant/40"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${widgetsLocked ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </div>
                  </button>
                </div>

                <div className="h-px bg-outline-variant/10" />

                {/* Widget Görünürlük */}
                <div className="p-2">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest px-2 mb-1">
                    Widget Ayarları
                  </p>
                  {[
                    { id: "widget-clock", label: "Saat & Tarih" },
                    { id: "widget-appt-total", label: "Toplam Randevu" },
                    { id: "widget-appt-done", label: "Tamamlanan" },
                    { id: "widget-appt-remain", label: "Kalan Randevu" },
                    { id: "widget-appointments", label: "Sıradaki Randevular" },
                  ].map((w) => {
                    const hidden = hiddenWidgets?.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWidgetVisibility(w.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors"
                      >
                        <span className="text-sm font-semibold text-on-surface">
                          {w.label}
                        </span>
                        <div
                          className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${!hidden ? "bg-primary" : "bg-outline-variant/40"}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${!hidden ? "translate-x-4" : "translate-x-0"}`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-outline-variant/10" />
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant">
                        zoom_in
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        Ekran Yakınlaştırma
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
                      %{zoomLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setZoom(Math.max(50, zoomLevel - 5))}
                      className="p-1 hover:bg-surface-container rounded-full transition-colors text-outline flex items-center justify-center shrink-0"
                      title="Uzaklaştır"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        remove
                      </span>
                    </button>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      step={1}
                      value={zoomLevel}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-outline-variant/20 rounded-full appearance-none cursor-pointer accent-primary shrink-0 transition-all"
                    />
                    <button
                      onClick={() => setZoom(Math.min(150, zoomLevel + 5))}
                      className="p-1 hover:bg-surface-container rounded-full transition-colors text-outline flex items-center justify-center shrink-0"
                      title="Yakınlaştır"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-outline">%50</span>
                    <button
                      onClick={() => setZoom(100)}
                      className="text-[9px] text-primary font-bold hover:underline"
                    >
                      Sıfırla
                    </button>
                    <span className="text-[9px] text-outline">%150</span>
                  </div>
                </div>

                <div className="h-px bg-outline-variant/10" />

                {/* Sistem Ayarları */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      openWindow(
                        "system-settings",
                        "Sistem Ayarları",
                        "settings",
                      );
                      setSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">
                      settings
                    </span>
                    <span className="text-sm font-semibold text-on-surface">
                      Sistem Ayarları
                    </span>
                    <span className="material-symbols-outlined text-sm text-outline ml-auto">
                      chevron_right
                    </span>
                  </button>
                </div>

                <div className="h-px bg-outline-variant/10" />

                {/* Çıkış */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/login" });
                      setSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error/5 text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      logout
                    </span>
                    <span className="text-sm font-semibold">Çıkış Yap</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-fixed font-bold text-xs"
          title="Çıkış Yap"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
