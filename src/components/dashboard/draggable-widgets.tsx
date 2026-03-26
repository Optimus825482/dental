"use client";

import { useState, useRef, useEffect } from "react";
import { useDesktopStore, type WidgetPos } from "@/stores/desktop-store";

interface Widget {
  id: string;
  component: React.ReactNode;
  defaultX: number;
  defaultY: number;
}

interface Position {
  x: number;
  y: number;
}
type ResizeDir = "e" | "w" | "s" | "n" | "se" | "sw" | "ne" | "nw";

export function DraggableWidgets({ widgets }: { widgets: Widget[] }) {
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [initialized, setInitialized] = useState(false);
  const locked = useDesktopStore((s) => s.widgetsLocked);
  const savedPositions = useDesktopStore((s) => s.widgetPositions);
  const savePositions = useDesktopStore((s) => s.savePositions);
  const [zIndices, setZIndices] = useState<Record<string, number>>(() => {
    const r: Record<string, number> = {};
    widgets.forEach((w, i) => {
      r[w.id] = i + 1;
    });
    return r;
  });
  const nextZ = useRef(widgets.length + 1);

  useEffect(() => {
    if (initialized) return;
    const init: Record<string, Position> = {};
    if (savedPositions?.length) {
      savedPositions.forEach((sp: WidgetPos) => {
        init[sp.id] = { x: sp.x, y: sp.y };
      });
      widgets.forEach((w) => {
        if (!init[w.id]) init[w.id] = { x: w.defaultX, y: w.defaultY };
      });
    } else {
      widgets.forEach((w) => {
        init[w.id] = { x: w.defaultX, y: w.defaultY };
      });
    }
    setPositions(init);
    setInitialized(true);
  }, [widgets, savedPositions, initialized]);

  function bringToFront(id: string) {
    setZIndices((prev) => ({ ...prev, [id]: nextZ.current++ }));
  }

  function handleDragEnd(id: string, pos: Position) {
    const next = { ...positions, [id]: pos };
    setPositions(next);
    savePositions(
      Object.entries(next).map(([wid, p]) => ({ id: wid, x: p.x, y: p.y })),
    );
  }

  if (!initialized) return <div className="absolute inset-0" />;

  return (
    <div className="absolute inset-0">
      {widgets.map((w) => (
        <DraggableWidget
          key={w.id}
          position={positions[w.id] || { x: 0, y: 0 }}
          zIndex={zIndices[w.id] || 1}
          locked={locked}
          onDragEnd={(pos) => handleDragEnd(w.id, pos)}
          onFocus={() => bringToFront(w.id)}
        >
          {w.component}
        </DraggableWidget>
      ))}
    </div>
  );
}

function DraggableWidget({
  position,
  zIndex,
  locked,
  onDragEnd,
  onFocus,
  children,
}: {
  position: Position;
  zIndex: number;
  locked: boolean;
  onDragEnd: (pos: Position) => void;
  onFocus: () => void;
  children: React.ReactNode;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const naturalSize = useRef<{ w: number; h: number } | null>(null);

  // Natural boyutu bir kez ölç
  useEffect(() => {
    if (naturalSize.current || !innerRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = innerRef.current;
    if (w > 0 && h > 0) naturalSize.current = { w, h };
  });

  const dragRef = useRef({ sx: 0, sy: 0, px: 0, py: 0 });
  const resizeRef = useRef({
    sx: 0,
    sy: 0,
    sw: 0,
    sh: 0,
    px: 0,
    py: 0,
    dir: "" as ResizeDir,
  });

  // ── DRAG ──────────────────────────────────────────────
  function onDragDown(e: React.PointerEvent) {
    if (locked) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setDragging(true);
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: position.x,
      py: position.y,
    };

    const move = (ev: PointerEvent) => {
      const nx = dragRef.current.px + (ev.clientX - dragRef.current.sx);
      const ny = Math.max(
        48,
        dragRef.current.py + (ev.clientY - dragRef.current.sy),
      );
      if (elRef.current) {
        elRef.current.style.left = `${nx}px`;
        elRef.current.style.top = `${ny}px`;
      }
    };
    const up = (ev: PointerEvent) => {
      setDragging(false);
      onDragEnd({
        x: dragRef.current.px + (ev.clientX - dragRef.current.sx),
        y: Math.max(48, dragRef.current.py + (ev.clientY - dragRef.current.sy)),
      });
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  // ── RESIZE ────────────────────────────────────────────
  function onResizeDown(e: React.PointerEvent, dir: ResizeDir) {
    if (locked || !naturalSize.current) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    const nat = naturalSize.current;
    resizeRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      sw: nat.w * scaleX,
      sh: nat.h * scaleY,
      px: position.x,
      py: position.y,
      dir,
    };

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - resizeRef.current.sx;
      const dy = ev.clientY - resizeRef.current.sy;
      const { sw, sh, px, py, dir } = resizeRef.current;
      const nat = naturalSize.current!;

      let newW = sw,
        newH = sh,
        newX = px,
        newY = py;

      if (dir.includes("e")) newW = Math.max(60, sw + dx);
      if (dir.includes("w")) {
        newW = Math.max(60, sw - dx);
        newX = px + (sw - newW);
      }
      if (dir.includes("s")) newH = Math.max(40, sh + dy);
      if (dir.includes("n")) {
        newH = Math.max(40, sh - dy);
        newY = py + (sh - newH);
      }

      const newSX = Math.max(0.2, Math.min(4, newW / nat.w));
      const newSY = Math.max(0.2, Math.min(4, newH / nat.h));

      if (elRef.current) {
        elRef.current.style.left = `${newX}px`;
        elRef.current.style.top = `${newY}px`;
      }
      setScaleX(newSX);
      setScaleY(newSY);
    };

    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  const nat = naturalSize.current;
  const H =
    "absolute z-20 opacity-0 group-hover:opacity-100 transition-opacity";
  const DOT =
    "w-3 h-3 rounded-full bg-white border-2 border-primary shadow-md block";

  return (
    <div
      ref={elRef}
      className="absolute"
      style={{ left: position.x, top: position.y, zIndex }}
      onPointerDown={() => onFocus()}
    >
      <div
        className={`relative group ${dragging ? "shadow-2xl scale-[1.02]" : ""} transition-transform`}
      >
        {/* Drag handle */}
        {!locked && (
          <div
            onPointerDown={onDragDown}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing px-4 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 shadow-sm flex items-center"
          >
            <span className="material-symbols-outlined text-outline text-xs">
              drag_indicator
            </span>
          </div>
        )}

        {/* Resize handles */}
        {!locked && nat && (
          <>
            <div
              onPointerDown={(e) => onResizeDown(e, "e")}
              className={`${H} top-1/2 -right-2 -translate-y-1/2 cursor-ew-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "w")}
              className={`${H} top-1/2 -left-2 -translate-y-1/2 cursor-ew-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "s")}
              className={`${H} -bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "n")}
              className={`${H} -top-2 left-1/2 -translate-x-1/2 cursor-ns-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "se")}
              className={`${H} -bottom-2 -right-2 cursor-nwse-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "sw")}
              className={`${H} -bottom-2 -left-2 cursor-nesw-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "ne")}
              className={`${H} -top-2 -right-2 cursor-nesw-resize`}
            >
              <span className={DOT} />
            </div>
            <div
              onPointerDown={(e) => onResizeDown(e, "nw")}
              className={`${H} -top-2 -left-2 cursor-nwse-resize`}
            >
              <span className={DOT} />
            </div>
          </>
        )}

        {/* İçerik — bağımsız X/Y scale */}
        <div
          style={{
            width: nat ? nat.w * scaleX : undefined,
            height: nat ? nat.h * scaleY : undefined,
            overflow: "hidden",
          }}
        >
          <div
            ref={innerRef}
            style={{
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: "top left",
              width: nat ? nat.w : undefined,
              height: nat ? nat.h : undefined,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
