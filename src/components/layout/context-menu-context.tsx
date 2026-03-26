"use client";

import { createContext, useContext } from "react";

interface WindowContextMenuFn {
  handleWindowContextMenu: (
    e: React.MouseEvent,
    windowId: string,
    windowTitle: string,
  ) => void;
}

export const WindowContextMenuContext = createContext<WindowContextMenuFn>({
  handleWindowContextMenu: () => {},
});

export function useWindowContextMenu() {
  return useContext(WindowContextMenuContext);
}
