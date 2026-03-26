import { create } from "zustand";

export const wallpapers = [
  {
    id: "default",
    label: "Varsayılan",
    bg: "linear-gradient(135deg, #f0f4f8 0%, #dbeafe 100%)",
  },
  {
    id: "ocean",
    label: "Okyanus",
    bg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)",
  },
  {
    id: "sunset",
    label: "Gün Batımı",
    bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)",
  },
  {
    id: "forest",
    label: "Orman",
    bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)",
  },
  {
    id: "lavender",
    label: "Lavanta",
    bg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)",
  },
  {
    id: "midnight",
    label: "Gece",
    bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
  },
  {
    id: "rose",
    label: "Gül",
    bg: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 50%, #fda4af 100%)",
  },
  {
    id: "slate",
    label: "Gri",
    bg: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)",
  },
];

export interface WidgetPos {
  id: string;
  x: number;
  y: number;
}

interface DesktopStore {
  widgetsLocked: boolean;
  wallpaperId: string;
  zoomLevel: number;
  widgetPositions: WidgetPos[] | null;
  hiddenWidgets: string[];
  loaded: boolean;
  toggleLock: () => void;
  setWallpaper: (id: string) => void;
  setZoom: (level: number) => void;
  savePositions: (positions: WidgetPos[]) => void;
  toggleWidgetVisibility: (id: string) => void;
  loadFromServer: () => Promise<void>;
}

async function saveToServer(data: Record<string, unknown>) {
  await fetch("/api/settings/desktop", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  widgetsLocked: false,
  wallpaperId: "default",
  zoomLevel: 100,
  widgetPositions: null,
  hiddenWidgets: [],
  loaded: false,

  toggleLock: () => {
    const newLocked = !get().widgetsLocked;
    const positions = get().widgetPositions;
    set({ widgetsLocked: newLocked });
    saveToServer({ widgetsLocked: newLocked, widgetPositions: positions });
  },

  setWallpaper: (id) => {
    set({ wallpaperId: id });
    saveToServer({ wallpaperId: id });
  },

  setZoom: (level) => {
    set({ zoomLevel: level });
    saveToServer({ zoomLevel: level });
  },

  savePositions: (positions) => {
    set({ widgetPositions: positions });
    saveToServer({ widgetPositions: positions });
  },

  toggleWidgetVisibility: (id) => {
    const current = get().hiddenWidgets;
    const next = current.includes(id)
      ? current.filter((w) => w !== id)
      : [...current, id];
    set({ hiddenWidgets: next });
    saveToServer({ hiddenWidgets: next });
  },

  loadFromServer: async () => {
    try {
      const res = await fetch("/api/settings/desktop");
      if (res.ok) {
        const data = await res.json();
        set({
          widgetsLocked: data.widgetsLocked ?? false,
          wallpaperId: data.wallpaperId ?? "default",
          zoomLevel: data.zoomLevel ?? 100,
          widgetPositions: data.widgetPositions ?? null,
          hiddenWidgets: data.hiddenWidgets ?? [],
          loaded: true,
        });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
