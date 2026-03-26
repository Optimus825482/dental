"use client";

import { useState, useEffect } from "react";
import { useWindowStore } from "@/stores/window-store";
import { useNotificationStore } from "@/stores/notification-store";
import { StartMenu } from "./start-menu";
import { NotificationCenter } from "./notification-center";
import { AppIcon } from "@/components/dashboard/app-icons";

const taskbarApps = [
  { id: "patients", label: "KABUL", gradient: "from-blue-400 to-blue-600" },
  { id: "calendar", label: "TAKVİM", gradient: "from-rose-400 to-red-500" },
  { id: "finance", label: "KASA", gradient: "from-amber-400 to-orange-500" },
  { id: "reports", label: "RAPOR", gradient: "from-violet-400 to-purple-600" },
  { id: "settings", label: "AYARLAR", gradient: "from-slate-500 to-slate-700" },
];

export function Taskbar() {
  const { windows, openWindow, focusWindow, minimizeWindow, activeWindowId } =
    useWindowStore();
  const { unreadCount, toggleOpen } = useNotificationStore();
  const [time, setTime] = useState(new Date());
  const [startOpen, setStartOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = time.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  function handleAppClick(app: (typeof taskbarApps)[0]) {
    const win = windows.find((w) => w.id === app.id);
    if (win) {
      if (win.isMinimized || activeWindowId !== win.id) focusWindow(win.id);
      else minimizeWindow(win.id);
    } else {
      openWindow(app.id, app.label, app.id);
    }
    setStartOpen(false);
  }

  return (
    <>
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} />
      <NotificationCenter />

      <div className="fixed bottom-0 left-0 right-0 z-[9990] hidden md:block">
        {/* Taskbar */}
        <div className="flex justify-center">
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl h-[72px] px-3 flex items-center gap-2 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/50">
            {/* Start Button */}
            <button
              onClick={() => setStartOpen(!startOpen)}
              className={`flex flex-col items-center justify-center rounded-2xl w-16 h-14 transition-all ${
                startOpen
                  ? "bg-primary-container/20 text-primary"
                  : "hover:bg-surface-container-low text-primary"
              }`}
            >
              <span className="text-2xl">
                <img
                  src="/dentalplogo.png"
                  alt="DENT-ALP"
                  className="w-10 h-10 object-contain"
                />
              </span>
              <span className="text-[8px] font-black font-headline tracking-widest mt-0.5">
                BAŞLAT
              </span>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-outline-variant/15 mx-1" />

            {/* App Icons */}
            {taskbarApps.map((app) => {
              const win = windows.find((w) => w.id === app.id);
              const isOpen = win?.isOpen && !win?.isMinimized;
              const isActive = activeWindowId === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className="flex flex-col items-center justify-center w-16 h-14 relative group transition-all"
                >
                  {/* Icon kart */}
                  <div
                    className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
                    bg-gradient-to-br ${app.gradient}
                    ${isActive ? "scale-110 shadow-lg shadow-black/20" : "scale-90 opacity-70"}
                    group-hover:scale-150 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-black/20
                    group-active:scale-95
                  `}
                  >
                    <AppIcon id={app.id} />
                  </div>
                  {/* Label */}
                  <span
                    className={`text-[7px] font-black tracking-widest mt-0.5 transition-colors ${isActive ? "text-primary" : "text-on-surface-variant/50 group-hover:text-on-surface"}`}
                  >
                    {app.label}
                  </span>
                  {/* Aktif göstergesi */}
                  {isOpen && (
                    <div
                      className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full transition-all ${isActive ? "w-4 h-[3px] bg-primary" : "w-1.5 h-[3px] bg-outline/40"}`}
                    />
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div className="h-8 w-px bg-outline-variant/15 mx-1" />

            {/* Tray */}
            <div className="flex items-center gap-2 px-2 text-on-surface-variant/40">
              <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-primary transition-colors">
                wifi
              </span>
              <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-primary transition-colors">
                volume_up
              </span>

              <button
                onClick={toggleOpen}
                className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-white" />
                )}
              </button>

              <div className="flex flex-col items-end leading-none ml-1">
                <span className="text-[10px] font-bold text-on-surface">
                  {timeStr}
                </span>
                <span className="text-[8px] font-medium text-outline">
                  {dateStr}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Version bar */}
        <div className="text-center mb-2">
          <span className="text-[10px] font-mono text-outline/95 uppercase tracking-widest">
            CODE BY ERKAN ERDEM © 2026 DENT-ALP SYSTEMS · V2.0.4-STABLE
          </span>
        </div>
      </div>
    </>
  );
}
