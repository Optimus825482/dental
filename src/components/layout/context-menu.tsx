"use client";

import { useState, useCallback } from "react";
import { useWindowStore } from "@/stores/window-store";
import { useDesktopStore, wallpapers } from "@/stores/desktop-store";

interface Position {
  x: number;
  y: number;
}

type MenuMode = "desktop" | "window";

interface ContextState {
  pos: Position | null;
  mode: MenuMode;
  windowId: string | null;
  windowTitle: string | null;
}

export function useContextMenu() {
  const [state, setState] = useState<ContextState>({
    pos: null,
    mode: "desktop",
    windowId: null,
    windowTitle: null,
  });
  const [showWallpapers, setShowWallpapers] = useState(false);

  // Desktop sağ tık — pencere dışı
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowWallpapers(false);
    setState({
      pos: { x: e.clientX, y: e.clientY },
      mode: "desktop",
      windowId: null,
      windowTitle: null,
    });
  }, []);

  // Pencere içi sağ tık
  const handleWindowContextMenu = useCallback(
    (e: React.MouseEvent, windowId: string, windowTitle: string) => {
      e.preventDefault();
      e.stopPropagation(); // desktop menu'yü engelle
      setShowWallpapers(false);
      setState({
        pos: { x: e.clientX, y: e.clientY },
        mode: "window",
        windowId,
        windowTitle,
      });
    },
    [],
  );

  const close = useCallback(() => {
    setState({ pos: null, mode: "desktop", windowId: null, windowTitle: null });
    setShowWallpapers(false);
  }, []);

  return {
    pos: state.pos,
    mode: state.mode,
    windowId: state.windowId,
    windowTitle: state.windowTitle,
    showWallpapers,
    setShowWallpapers,
    handleContextMenu,
    handleWindowContextMenu,
    close,
  };
}

export function DesktopContextMenu({
  pos,
  mode,
  windowId,
  windowTitle,
  showWallpapers,
  setShowWallpapers,
  close,
}: {
  pos: Position | null;
  mode: MenuMode;
  windowId: string | null;
  windowTitle: string | null;
  showWallpapers: boolean;
  setShowWallpapers: (v: boolean) => void;
  close: () => void;
}) {
  const { openWindow, closeWindow, minimizeWindow, toggleMaximize, windows } =
    useWindowStore();
  const { wallpaperId, setWallpaper, widgetsLocked, toggleLock } =
    useDesktopStore();

  if (!pos) return null;

  function action(fn: () => void) {
    fn();
    close();
  }

  const win = windowId ? windows.find((w) => w.id === windowId) : null;

  // ── PENCERE CONTEXT MENU ──────────────────────────────────
  if (mode === "window" && win) {
    return (
      <>
        <div
          className="fixed inset-0 z-[19990]"
          onClick={close}
          onContextMenu={(e) => {
            e.preventDefault();
            close();
          }}
        />
        <div
          className="fixed z-[19991] w-56 bg-white/96 backdrop-blur-xl rounded-2xl border border-black/10 overflow-visible py-1.5"
          style={{
            left: pos.x,
            top: pos.y,
            boxShadow:
              "0 4px 8px rgba(0,0,0,0.3), 0 16px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {/* Pencere başlığı */}
          <div className="px-4 py-2 border-b border-outline-variant/10 mb-1">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest truncate">
              {windowTitle}
            </p>
          </div>

          <MenuItem
            icon="open_in_full"
            label={win.isMaximized ? "Küçült" : "Tam Ekran"}
            onClick={() => action(() => toggleMaximize(win.id))}
          />
          <MenuItem
            icon="minimize"
            label="Simge Durumuna Küçült"
            onClick={() => action(() => minimizeWindow(win.id))}
          />

          <div className="h-px bg-outline-variant/15 mx-3 my-1" />

          <MenuItem
            icon="content_copy"
            label="Pencereyi Çoğalt"
            onClick={() =>
              action(() => openWindow(win.id + "-copy", win.title, win.icon))
            }
          />

          <div className="h-px bg-outline-variant/15 mx-3 my-1" />

          <MenuItem
            icon="close"
            label="Kapat"
            danger
            onClick={() => action(() => closeWindow(win.id))}
          />
        </div>
      </>
    );
  }

  // ── DESKTOP CONTEXT MENU ──────────────────────────────────
  return (
    <>
      <div
        className="fixed inset-0 z-[19990]"
        onClick={close}
        onContextMenu={(e) => {
          e.preventDefault();
          close();
        }}
      />
      <div
        className="fixed z-[19991] w-56 bg-white/96 backdrop-blur-xl rounded-2xl border border-black/10 overflow-visible py-1.5"
        style={{
          left: pos.x,
          top: pos.y,
          boxShadow:
            "0 4px 8px rgba(0,0,0,0.3), 0 16px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <MenuItem
          icon="person_add"
          label="Hasta Kabul"
          shortcut="Ctrl+H"
          onClick={() =>
            action(() => openWindow("patients", "Hasta Kabul", "person_add"))
          }
        />
        <MenuItem
          icon="medical_services"
          label="İşlemler"
          shortcut="Ctrl+I"
          onClick={() =>
            action(() =>
              openWindow("treatments", "İşlemler", "medical_services"),
            )
          }
        />
        <MenuItem
          icon="calendar_month"
          label="Randevu Takvimi"
          shortcut="Ctrl+R"
          onClick={() =>
            action(() =>
              openWindow("calendar", "Randevu Takvimi", "calendar_month"),
            )
          }
        />
        <MenuItem
          icon="account_balance_wallet"
          label="Cari Hesaplar"
          onClick={() =>
            action(() => openWindow("finance", "Cari Hesaplar", "payments"))
          }
        />

        <div className="h-px bg-outline-variant/15 mx-3 my-1" />

        <MenuItem
          icon={widgetsLocked ? "lock" : "lock_open"}
          label={widgetsLocked ? "Widget'ları Aç" : "Widget'ları Kilitle"}
          onClick={() => action(toggleLock)}
        />

        <div className="h-px bg-outline-variant/15 mx-3 my-1" />

        <div className="relative">
          <button
            onClick={() => setShowWallpapers(!showWallpapers)}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low transition-colors text-left"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-lg">
              wallpaper
            </span>
            <span className="text-sm font-semibold text-on-surface flex-1">
              Arka Plan Rengi
            </span>
            <span className="material-symbols-outlined text-outline text-sm">
              chevron_right
            </span>
          </button>
          {showWallpapers && (
            <div
              className="absolute left-full top-0 ml-1 w-48 bg-white/95 backdrop-blur-xl rounded-2xl border border-outline-variant/20 py-1.5 z-[19992]"
              style={{ boxShadow: "0 16px_48px rgba(0,0,0,0.15)" }}
            >
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => action(() => setWallpaper(wp.id))}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low transition-colors text-left"
                >
                  <div
                    className="w-5 h-5 rounded-lg border border-outline-variant/20 shrink-0"
                    style={{ background: wp.bg }}
                  />
                  <span className="text-sm font-medium text-on-surface">
                    {wp.label}
                  </span>
                  {wallpaperId === wp.id && (
                    <span className="material-symbols-outlined text-primary text-sm ml-auto">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-outline-variant/15 mx-3 my-1" />
        <MenuItem
          icon="refresh"
          label="Yenile"
          onClick={() => action(() => window.location.reload())}
        />
      </div>
    </>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low transition-colors text-left ${danger ? "hover:bg-error/5" : ""}`}
    >
      <span
        className={`material-symbols-outlined text-lg ${danger ? "text-error" : "text-on-surface-variant"}`}
      >
        {icon}
      </span>
      <span
        className={`text-sm font-semibold flex-1 ${danger ? "text-error" : "text-on-surface"}`}
      >
        {label}
      </span>
      {shortcut && (
        <span className="text-[10px] text-outline font-mono">{shortcut}</span>
      )}
    </button>
  );
}
