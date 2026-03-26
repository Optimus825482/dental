"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useWindowStore } from "@/stores/window-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDashboard } from "@/components/mobile/mobile-dashboard";
import { useDesktopStore } from "@/stores/desktop-store";
import { CalendarIcon } from "@/components/dashboard/app-icons";

const WindowRenderer = dynamic(
  () =>
    import("@/components/windows/window-renderer").then(
      (m) => m.WindowRenderer,
    ),
  { ssr: false },
);
const DraggableWidgets = dynamic(
  () =>
    import("@/components/dashboard/draggable-widgets").then(
      (m) => m.DraggableWidgets,
    ),
  { ssr: false },
);

const APP_DEFS = [
  {
    id: "patients",
    label: "Hasta Kabul",
    gradient: "from-blue-900 to-blue-700",
    defaultX: 20,
    defaultY: 10,
  },
  {
    id: "treatments",
    label: "İşlemler",
    gradient: "from-emerald-900 to-emerald-600",
    defaultX: 110,
    defaultY: 10,
  },
  {
    id: "finance",
    label: "Cari Hesaplar",
    gradient: "from-amber-900 to-orange-500",
    defaultX: 200,
    defaultY: 10,
  },
  {
    id: "reports",
    label: "Raporlar",
    gradient: "from-gray-900 to-gray-600",
    defaultX: 290,
    defaultY: 10,
  },
  {
    id: "calendar",
    label: "Randevu Takvimi",
    gradient: "from-slate-900 to-slate-700",
    defaultX: 380,
    defaultY: 10,
  },
];

function AppSvg({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    patients: (
      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
        <path
          d="M12 2L4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6l-8-4z"
          fill="white"
          fillOpacity="0.2"
          stroke="white"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="8" r="2" fill="white" />
        <path
          d="M8 16v-1c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5v1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10 18l1.5 1.5L14 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    treatments: (
      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
        <circle cx="7" cy="6" r="3" fill="white" />
        <path
          d="M1 19v-1.5c0-3 2-5.5 6-5.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="12"
          y="4"
          width="10"
          height="16"
          rx="2"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <circle cx="15" cy="8" r="1" fill="white" />
        <rect x="17" y="7.5" width="4" height="1" rx="0.5" fill="white" />
        <circle cx="15" cy="12" r="1" fill="white" />
        <rect x="17" y="11.5" width="4" height="1" rx="0.5" fill="white" />
        <circle cx="15" cy="16" r="1" fill="white" />
        <rect x="17" y="15.5" width="4" height="1" rx="0.5" fill="white" />
      </svg>
    ),
    finance: (
      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
        <rect
          x="2"
          y="1"
          width="20"
          height="22"
          rx="2"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <rect
          x="4"
          y="3"
          width="16"
          height="4"
          rx="1"
          fill="white"
          fillOpacity="0.8"
        />
        <rect
          x="4"
          y="9"
          width="16"
          height="8"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <path
          d="M5 15l3-2 3 1 3-3 3 2 2-1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="13" r="1" fill="white" />
        <circle cx="11" cy="14" r="1" fill="white" />
        <circle cx="14" cy="11" r="1" fill="white" />
        <circle cx="17" cy="13" r="1" fill="white" />
        <rect
          x="4"
          y="19"
          width="8"
          height="1.5"
          rx="0.75"
          fill="white"
          fillOpacity="0.5"
        />
        <rect
          x="14"
          y="19"
          width="6"
          height="3"
          rx="1"
          fill="white"
          fillOpacity="0.2"
        />
      </svg>
    ),
    reports: (
      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
        <rect
          x="1"
          y="2"
          width="22"
          height="20"
          rx="2"
          fill="white"
          fillOpacity="0.15"
        />
        <rect
          x="3"
          y="4"
          width="8"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.4"
        />
        <path
          d="M5 8h4M5 6h2"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect
          x="13"
          y="4"
          width="8"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.25"
        />
        <path
          d="M15 8h4M15 6h3"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect
          x="3"
          y="12"
          width="18"
          height="8"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <rect
          x="5"
          y="16"
          width="2"
          height="3"
          rx="0.5"
          fill="white"
          fillOpacity="0.9"
        />
        <rect
          x="8"
          y="14"
          width="2"
          height="5"
          rx="0.5"
          fill="white"
          fillOpacity="0.8"
        />
        <rect
          x="11"
          y="15"
          width="2"
          height="4"
          rx="0.5"
          fill="white"
          fillOpacity="0.7"
        />
        <rect
          x="14"
          y="13"
          width="2"
          height="6"
          rx="0.5"
          fill="white"
          fillOpacity="0.9"
        />
        <rect
          x="17"
          y="14"
          width="2"
          height="5"
          rx="0.5"
          fill="white"
          fillOpacity="0.6"
        />
      </svg>
    ),
    calendar: <CalendarIcon />,
    "diagnosis-codes": (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
        <rect
          x="6"
          y="5"
          width="28"
          height="30"
          rx="4"
          fill="white"
          opacity="0.15"
        />
        <path
          d="M12 13h6M12 19h10M12 25h8"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M22 13h6M24 19h4M22 25h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    ),
  };
  return <>{icons[id] || null}</>;
}

export default function DesktopPage() {
  const { openWindow } = useWindowStore();
  const isMobile = useIsMobile();
  const { hiddenWidgets } = useDesktopStore();

  const allWidgets = [
    ...APP_DEFS.map((app) => ({
      id: `app-${app.id}`,
      defaultX: app.defaultX,
      defaultY: app.defaultY,
      hidden: hiddenWidgets?.includes(`app-${app.id}`),
      component: (
        <AppIconWidget
          label={app.label}
          gradient={app.gradient}
          icon={<AppSvg id={app.id} />}
          onClick={() => openWindow(app.id, app.label, app.id)}
          widgetId={`app-${app.id}`}
        />
      ),
    })),
    {
      id: "widget-clock",
      defaultX: 720,
      defaultY: 10,
      hidden: hiddenWidgets?.includes("widget-clock"),
      component: <ClockWidget />,
    },
    {
      id: "widget-appt-total",
      defaultX: 720,
      defaultY: 200,
      hidden: hiddenWidgets?.includes("widget-appt-total"),
      component: <ApptStatWidget type="total" />,
    },
    {
      id: "widget-appt-done",
      defaultX: 860,
      defaultY: 200,
      hidden: hiddenWidgets?.includes("widget-appt-done"),
      component: <ApptStatWidget type="completed" />,
    },
    {
      id: "widget-appt-remain",
      defaultX: 1000,
      defaultY: 200,
      hidden: hiddenWidgets?.includes("widget-appt-remain"),
      component: <ApptStatWidget type="remaining" />,
    },
    {
      id: "widget-appointments",
      defaultX: 720,
      defaultY: 310,
      hidden: hiddenWidgets?.includes("widget-appointments"),
      component: <AppointmentsWidget />,
    },
  ].filter((w) => !w.hidden);

  if (isMobile) return <MobileDashboard />;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <DraggableWidgets widgets={allWidgets} />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 9050 }}
      >
        <WindowRenderer />
      </div>
    </div>
  );
}

function AppIconWidget({
  label,
  gradient,
  icon,
  onClick,
  widgetId,
}: {
  label: string;
  gradient: string;
  icon: React.ReactNode;
  onClick: () => void;
  widgetId: string;
}) {
  const { widgetsLocked, toggleWidgetVisibility } = useDesktopStore();
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <button
        onClick={onClick}
        onContextMenu={(e) => {
          if (widgetsLocked) return;
          e.preventDefault();
          e.stopPropagation();
          setCtx({ x: e.clientX, y: e.clientY });
        }}
        className="flex flex-col items-center gap-2 group cursor-pointer select-none"
      >
        <div
          className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-[20px] flex items-center justify-center transition-all duration-150 group-hover:scale-110 group-hover:-translate-y-1 group-active:scale-95 border border-black/70`}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold text-on-surface drop-shadow-sm text-center leading-tight w-16">
          {label}
        </span>
      </button>
      {ctx && (
        <>
          <div
            className="fixed inset-0 z-[9995]"
            onClick={() => setCtx(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCtx(null);
            }}
          />
          <div
            className="fixed z-[9996] bg-white/95 backdrop-blur-xl rounded-2xl border border-outline-variant/20 py-1.5 w-44"
            style={{
              left: ctx.x,
              top: ctx.y,
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            }}
          >
            <button
              onClick={() => {
                setCtx(null);
                toggleWidgetVisibility(widgetId);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/5 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-error text-lg">
                delete
              </span>
              <span className="text-sm font-semibold text-error">Kaldır</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hours = time.getHours();
  const greeting =
    hours < 12 ? "Günaydın" : hours < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <div
      className="rounded-3xl border border-black/70 p-5 w-[230px] overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)",
      }}
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
        {greeting}
      </p>
      <span className="text-[52px] font-black text-white tracking-tighter font-headline leading-none block">
        {time.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="text-xs font-medium text-white/60 mt-1.5 capitalize block">
        {time.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          weekday: "long",
          year: "numeric",
        })}
      </span>
      <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 w-fit">
        <span
          className="material-symbols-outlined text-amber-300 text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          partly_cloudy_day
        </span>
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
          Güneşli · 24°C
        </span>
      </div>
    </div>
  );
}

function ApptStatWidget({
  type,
}: {
  type: "total" | "completed" | "remaining";
}) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const kpis = d?.kpis;
        if (!kpis) return;
        if (type === "total") setValue(kpis.todayAppointments ?? 0);
        else if (type === "completed") setValue(kpis.completedToday ?? 0);
        else
          setValue((kpis.todayAppointments ?? 0) - (kpis.completedToday ?? 0));
      })
      .catch(() => setValue(0));
  }, [type]);

  const configs = {
    total: {
      label: "Toplam",
      sublabel: "Bugünkü randevu",
      icon: "event",
      gradient: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
      glow: "rgba(59,130,246,0.45)",
    },
    completed: {
      label: "Tamamlandı",
      sublabel: "Bugün yapılan",
      icon: "check_circle",
      gradient: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
      glow: "rgba(16,185,129,0.45)",
    },
    remaining: {
      label: "Bekliyor",
      sublabel: "Kalan randevu",
      icon: "pending",
      gradient: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
      glow: "rgba(245,158,11,0.45)",
    },
  };
  const config = configs[type];

  return (
    <div
      className="rounded-2xl border border-black/70 p-4 w-[138px] relative overflow-hidden"
      style={{ background: config.gradient }}
    >
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/20 backdrop-blur-sm">
        <span
          className="material-symbols-outlined text-white text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {config.icon}
        </span>
      </div>
      <p className="text-4xl font-black text-white leading-none font-headline">
        {value === null ? "—" : value}
      </p>
      <p className="text-[11px] font-bold text-white/90 mt-1 leading-tight">
        {config.label}
      </p>
      <p className="text-[10px] text-white/55 leading-tight">
        {config.sublabel}
      </p>
    </div>
  );
}

function AppointmentsWidget() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/appointments?date=${today}`)
      .then((r) => r.json())
      .then((d) => setAppointments((d.appointments || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  const STATUS_DOT: Record<string, string> = {
    COMPLETED: "bg-emerald-400",
    IN_PROGRESS: "bg-blue-400 animate-pulse",
    CONFIRMED: "bg-violet-400",
    SCHEDULED: "bg-slate-400",
    CANCELLED: "bg-red-400",
    NO_SHOW: "bg-amber-400",
  };

  return (
    <div
      className="rounded-3xl border border-black/70 p-5 w-[300px] relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.94) 0%, rgba(241,245,249,0.97) 100%)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_month
            </span>
          </div>
          <h3 className="font-headline font-bold text-on-surface text-sm">
            Sıradaki Randevular
          </h3>
        </div>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {appointments.length} randevu
        </span>
      </div>
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center py-5 gap-2 text-on-surface-variant/50">
          <span className="text-3xl">📅</span>
          <p className="text-xs font-medium">Bugün randevu yok</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {appointments.map((a) => {
            const initials = `${a.patient?.firstName?.[0] || ""}${a.patient?.lastName?.[0] || ""}`;
            const dot = STATUS_DOT[a.status] || "bg-slate-400";
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 hover:bg-white transition-colors border border-black/5"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                  style={{ background: a.doctor?.color || "#00677e" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">
                    {a.patient?.firstName} {a.patient?.lastName}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {new Date(a.startTime).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {a.doctor?.name || "—"}
                  </p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
