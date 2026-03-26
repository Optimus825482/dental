import { create } from "zustand";

export interface AppWindow {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface WindowStore {
  windows: AppWindow[];
  activeWindowId: string | null;
  nextZ: number;
  openWindow: (id: string, title: string, icon: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restoreWindow: (id: string) => void;
}

export const useWindowStore = create<WindowStore>((set) => ({
  windows: [],
  activeWindowId: null,
  nextZ: 9100,

  openWindow: (id, title, icon) =>
    set((state) => {
      const existing = state.windows.find((w) => w.id === id);
      if (existing) {
        // Already exists — restore & focus
        return {
          windows: state.windows.map((w) =>
            w.id === id
              ? { ...w, isOpen: true, isMinimized: false, zIndex: state.nextZ }
              : w,
          ),
          activeWindowId: id,
          nextZ: state.nextZ + 1,
        };
      }
      return {
        windows: [
          ...state.windows,
          {
            id,
            title,
            icon,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: state.nextZ,
          },
        ],
        activeWindowId: id,
        nextZ: state.nextZ + 1,
      };
    }),

  closeWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),

  focusWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: state.nextZ, isMinimized: false } : w,
      ),
      activeWindowId: id,
      nextZ: state.nextZ + 1,
    })),

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w,
      ),
      activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
    })),

  toggleMaximize: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w,
      ),
    })),

  restoreWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: state.nextZ } : w,
      ),
      activeWindowId: id,
      nextZ: state.nextZ + 1,
    })),
}));
