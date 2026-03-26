"use client";

import { useEffect, useState } from "react";
import { TopBar } from "./top-bar";
import { Taskbar } from "./taskbar";
import { MobileNav } from "./mobile-nav";
import { DesktopContextMenu, useContextMenu } from "./context-menu";
import { WindowContextMenuContext } from "./context-menu-context";
import { useDesktopStore, wallpapers } from "@/stores/desktop-store";
import { SplashScreen } from "./splash-screen";

export function OSShell({ children }: { children: React.ReactNode }) {
  const { wallpaperId, zoomLevel, loaded, loadFromServer } = useDesktopStore();
  const wp = wallpapers.find((w) => w.id === wallpaperId) || wallpapers[0];
  const ctx = useContextMenu();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Sadece ilk oturum açılışında göster
    const seen = sessionStorage.getItem("splash-seen");
    if (!seen) setShowSplash(true);
  }, []);

  function handleSplashDone() {
    sessionStorage.setItem("splash-seen", "1");
    setShowSplash(false);
  }

  useEffect(() => {
    if (!loaded) loadFromServer();
  }, [loaded, loadFromServer]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoomLevel}%`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [zoomLevel]);

  return (
    <WindowContextMenuContext.Provider
      value={{ handleWindowContextMenu: ctx.handleWindowContextMenu }}
    >
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <div
        className="h-screen w-screen overflow-hidden relative"
        style={{ background: wp.bg }}
      >
        <TopBar />
        <main
          className="h-full w-full pt-12 pb-24 md:pb-24 overflow-auto relative"
          onContextMenu={ctx.handleContextMenu}
        >
          <div className="h-full flex items-start justify-center relative">
            {children}
          </div>
        </main>
        <Taskbar />
        <MobileNav />

        <DesktopContextMenu
          pos={ctx.pos}
          mode={ctx.mode}
          windowId={ctx.windowId}
          windowTitle={ctx.windowTitle}
          showWallpapers={ctx.showWallpapers}
          setShowWallpapers={ctx.setShowWallpapers}
          close={ctx.close}
        />
      </div>
    </WindowContextMenuContext.Provider>
  );
}
