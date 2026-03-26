"use client";

import { useWindowStore } from "@/stores/window-store";
import { signOut } from "next-auth/react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { AppIcon } from "@/components/dashboard/app-icons";

const apps = [
  {
    id: "patients",
    label: "Hasta Kabul",
    gradient: "from-blue-400 to-blue-600",
  },
  {
    id: "treatments",
    label: "İşlemler",
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    id: "finance",
    label: "Cari Hesaplar",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "reports",
    label: "Raporlar",
    gradient: "from-violet-400 to-purple-600",
  },
  {
    id: "calendar",
    label: "Randevu Takvimi",
    gradient: "from-rose-400 to-red-500",
  },
  {
    id: "settings",
    label: "Denetim Masası",
    gradient: "from-slate-500 to-slate-700",
  },
  {
    id: "radiology",
    label: "Radyoloji",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: "diagnosis-codes",
    label: "Tanı Kodları",
    gradient: "from-indigo-400 to-indigo-600",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StartMenu({ open, onClose }: Props) {
  const { openWindow } = useWindowStore();
  const { canInstall, isInstalled, install } = usePwaInstall();

  if (!open) return null;

  function launch(app: (typeof apps)[0]) {
    openWindow(app.id, app.label, app.icon);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[480px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden">
        {/* Search */}
        <div className="p-5 pb-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Uygulama veya hasta ara..."
              className="w-full pl-11 pr-4 py-3 bg-surface-container-low border-transparent border focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 rounded-2xl text-sm text-on-surface transition-all placeholder-outline"
              autoFocus
            />
          </div>
        </div>

        {/* Apps */}
        <div className="px-5 pb-2">
          <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-3">
            Uygulamalar
          </p>
          <div className="grid grid-cols-4 gap-3">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => launch(app)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl hover:bg-surface-container-low transition-all group active:scale-95"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${app.gradient} rounded-[14px] flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all`}
                >
                  <AppIcon id={app.id} />
                </div>
                <span className="text-[12px] font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors text-center leading-tight">
                  {app.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-outline-variant/20 mx-5" />

        {/* Bottom */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-lg">
                person
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">Yönetici</p>
              <p className="text-[10px] text-outline">Hendek Diş Polikliniği</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={() => {
                  install();
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-primary-container/15 text-primary text-[12px] font-bold hover:bg-primary-container/25 transition-all flex items-center gap-1.5 border border-primary/10"
              >
                <span className="material-symbols-outlined text-sm">
                  install_desktop
                </span>
                Uygulamayı Yükle
              </button>
            )}
            {isInstalled && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                Yüklü
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2.5 rounded-xl hover:bg-error/10 text-outline hover:text-error transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                power_settings_new
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
