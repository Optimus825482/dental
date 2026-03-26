"use client";

import { useRef, useState, useEffect } from "react";
import { useWindowStore } from "@/stores/window-store";
import { useWindowContextMenu } from "./context-menu-context";

interface Props {
  id: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
}

export function OSWindow({
  id,
  children,
  defaultWidth = 1000,
  defaultHeight = 650,
}: Props) {
  const { windows, closeWindow, focusWindow, minimizeWindow, toggleMaximize } =
    useWindowStore();
  const win = windows.find((w) => w.id === id);
  const { handleWindowContextMenu } = useWindowContextMenu();

  const elRef = useRef<HTMLDivElement>(null);

  const [initialized, setInitialized] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });

  const [dragging, setDragging] = useState(false);
  const dragData = useRef({ sx: 0, sy: 0, px: 0, py: 0 });
  const resizeData = useRef({
    sx: 0,
    sy: 0,
    pw: 0,
    ph: 0,
    px: 0,
    py: 0,
    dir: "",
  });

  useEffect(() => {
    const availWidth = window.innerWidth;
    const availHeight = window.innerHeight;

    // Usable vertical area: top-bar ~48px, taskbar ~88px, bottom footer ~28px
    const TOP_RESERVED = 28;
    const BOTTOM_RESERVED = 120; // taskbar + footer
    const usableH = availHeight - TOP_RESERVED - BOTTOM_RESERVED;

    const initW = Math.min(defaultWidth, availWidth - 40);
    const initH = Math.min(defaultHeight, usableH);

    // Center horizontally, center vertically within usable area
    const maxX = Math.max(0, availWidth - initW - 10);
    const maxY = Math.max(0, usableH - initH);

    const x = Math.max(
      10,
      Math.min(maxX / 2 + (Math.random() * 60 - 30), maxX),
    );
    // y is relative to the desktop container which starts after top-bar
    const y = Math.max(
      TOP_RESERVED,
      Math.min(
        TOP_RESERVED + maxY / 2 + (Math.random() * 40 - 20),
        TOP_RESERVED + maxY,
      ),
    );

    setSize({ w: initW, h: initH });
    setPos({ x, y });
    setInitialized(true);
    // double rAF → DOM'a yerleştikten sonra visible=true, scale-in tetiklenir
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, [defaultWidth, defaultHeight]);

  if (!win || !win.isOpen || win.isMinimized || !initialized) return null;

  // Dragging logic
  function handlePointerDown(e: React.PointerEvent) {
    if (win?.isMaximized) return;
    e.preventDefault();
    focusWindow(id);
    setDragging(true);
    dragData.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };

    const onMove = (ev: PointerEvent) => {
      const nx = dragData.current.px + (ev.clientX - dragData.current.sx);
      const ny = Math.max(
        4,
        Math.min(
          dragData.current.py + (ev.clientY - dragData.current.sy),
          window.innerHeight - size.h - 120,
        ),
      );
      if (elRef.current) {
        elRef.current.style.left = `${nx}px`;
        elRef.current.style.top = `${ny}px`;
      }
    };
    const onUp = (ev: PointerEvent) => {
      setDragging(false);
      setPos({
        x: dragData.current.px + (ev.clientX - dragData.current.sx),
        y: Math.max(
          4,
          Math.min(
            dragData.current.py + (ev.clientY - dragData.current.sy),
            window.innerHeight - size.h - 120,
          ),
        ),
      });
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  // Resizing logic
  function handleResizeDown(e: React.PointerEvent, dir: string) {
    if (win?.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(id);
    setDragging(true);

    resizeData.current = {
      sx: e.clientX,
      sy: e.clientY,
      pw: size.w,
      ph: size.h,
      px: pos.x,
      py: pos.y,
      dir,
    };

    const onMove = (ev: PointerEvent) => {
      const { sx, sy, pw, ph, px, py, dir } = resizeData.current;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;

      let newW = pw;
      let newH = ph;
      let newX = px;
      let newY = py;

      const minW = 320;
      const minH = 240;

      if (dir.includes("e")) newW = Math.max(minW, pw + dx);
      if (dir.includes("s")) newH = Math.max(minH, ph + dy);
      if (dir.includes("w")) {
        newW = Math.max(minW, pw - dx);
        newX = px + (pw - newW);
      }
      if (dir.includes("n")) {
        newH = Math.max(minH, ph - dy);
        newY = py + (ph - newH);
      }

      if (elRef.current) {
        elRef.current.style.width = `${newW}px`;
        elRef.current.style.height = `${newH}px`;
        elRef.current.style.left = `${newX}px`;
        elRef.current.style.top = `${newY}px`;
      }
    };

    const onUp = (ev: PointerEvent) => {
      setDragging(false);
      const { sx, sy, pw, ph, px, py, dir } = resizeData.current;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;

      let newW = pw;
      let newH = ph;
      let newX = px;
      let newY = py;

      const minW = 320;
      const minH = 240;

      if (dir.includes("e")) newW = Math.max(minW, pw + dx);
      if (dir.includes("s")) newH = Math.max(minH, ph + dy);
      if (dir.includes("w")) {
        newW = Math.max(minW, pw - dx);
        newX = px + (pw - newW);
      }
      if (dir.includes("n")) {
        newH = Math.max(minH, ph - dy);
        newY = py + (ph - newH);
      }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });

      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  const isMax = win.isMaximized;

  const renderResizeHandles = () => {
    if (isMax) return null;
    const handleClass = "absolute z-50";
    return (
      <>
        {/* Edges */}
        <div
          className={`${handleClass} top-0 left-0 right-0 h-2 cursor-ns-resize -mt-[4px]`}
          onPointerDown={(e) => handleResizeDown(e, "n")}
        />
        <div
          className={`${handleClass} bottom-0 left-0 right-0 h-2 cursor-ns-resize -mb-[4px]`}
          onPointerDown={(e) => handleResizeDown(e, "s")}
        />
        <div
          className={`${handleClass} left-0 top-0 bottom-0 w-2 cursor-ew-resize -ml-[4px]`}
          onPointerDown={(e) => handleResizeDown(e, "w")}
        />
        <div
          className={`${handleClass} right-0 top-0 bottom-0 w-2 cursor-ew-resize -mr-[4px]`}
          onPointerDown={(e) => handleResizeDown(e, "e")}
        />
        {/* Corners */}
        <div
          className={`${handleClass} top-0 left-0 w-4 h-4 cursor-nwse-resize -mt-[6px] -ml-[6px]`}
          onPointerDown={(e) => handleResizeDown(e, "nw")}
        />
        <div
          className={`${handleClass} top-0 right-0 w-4 h-4 cursor-nesw-resize -mt-[6px] -mr-[6px]`}
          onPointerDown={(e) => handleResizeDown(e, "ne")}
        />
        <div
          className={`${handleClass} bottom-0 left-0 w-4 h-4 cursor-nesw-resize -mb-[6px] -ml-[6px]`}
          onPointerDown={(e) => handleResizeDown(e, "sw")}
        />
        <div
          className={`${handleClass} bottom-0 right-0 w-4 h-4 cursor-nwse-resize -mb-[6px] -mr-[6px]`}
          onPointerDown={(e) => handleResizeDown(e, "se")}
        />
      </>
    );
  };

  return (
    <div
      ref={elRef}
      onPointerDown={() => focusWindow(id)}
      className={`${isMax ? "fixed inset-0 top-12 bottom-[88px]" : "absolute"} flex flex-col pointer-events-auto`}
      style={
        isMax
          ? { zIndex: win.zIndex }
          : {
              left: pos.x,
              top: pos.y,
              width: size.w,
              height: size.h,
              zIndex: win.zIndex,
              transform: visible
                ? "scale(1) translateY(0)"
                : "scale(0.88) translateY(12px)",
              opacity: visible ? 1 : 0,
              transition:
                "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 180ms ease",
              transformOrigin: "center top",
            }
      }
    >
      {renderResizeHandles()}
      <div
        className={`bg-white flex flex-col overflow-hidden w-full h-full ${
          isMax ? "" : "rounded-2xl border border-black/75"
        } ${dragging ? "select-none" : ""}`}
        style={
          isMax
            ? {}
            : {
                boxShadow:
                  "4px 6px 8px rgba(0,0,0,0.28), 8px 16px 32px -4px rgba(0,0,0,0.22), 12px 28px 56px -8px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.15)",
              }
        }
      >
        {/* Title Bar */}
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={() => toggleMaximize(id)}
          className="h-11 bg-gradient-to-r from-surface-container-high to-surface-container flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing select-none border-b border-outline-variant/25"
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-[6px]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="ml-2 flex items-center gap-2">
              <WindowIcon id={win.icon} />
              <span className="font-headline font-bold text-sm tracking-tight text-on-surface">
                {win.title}
              </span>
            </div>
          </div>
          {/* Window Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                minimizeWindow(id);
              }}
              className="w-8 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Simge Durumuna Küçült"
            >
              <span className="material-symbols-outlined text-[18px]">
                minimize
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMaximize(id);
              }}
              className="w-8 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              title={isMax ? "Geri Yükle" : "Ekranı Kapla"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isMax ? "filter_none" : "crop_square"}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeWindow(id);
              }}
              className="w-8 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error hover:text-white transition-colors"
              title="Kapat"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-auto bg-surface-bright relative z-0"
          onContextMenu={(e) => handleWindowContextMenu(e, id, win.title)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function WindowIcon({ id }: { id: string }) {
  const icons: Record<string, string> = {
    // App windows
    patients: "🏥",
    person_add: "🏥",
    treatments: "🦷",
    medical_services: "🦷",
    finance: "💳",
    payments: "💳",
    account_balance_wallet: "💳",
    reports: "📊",
    bar_chart: "📊",
    calendar: "📅",
    calendar_month: "📅",
    settings: "⚙️",
    tune: "⚙️",
    "system-settings": "⚙️",
    radiology: "🩻",
    view_timeline: "🩻",
    "diagnosis-codes": "📋",
    clinical_notes: "📋",
    // Patient windows
    clinical_notes2: "👤",
    assignment: "📝",
    // Other
    timeline: "⏱️",
    apps: "🔲",
  };
  const emoji = icons[id] || "🪟";
  return <span className="text-base leading-none">{emoji}</span>;
}
