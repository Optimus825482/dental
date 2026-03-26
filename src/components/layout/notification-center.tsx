import { useNotificationStore } from "@/stores/notification-store";
import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function NotificationCenter() {
  const {
    isOpen,
    setOpen,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startPolling(15000); // 15 seconds for testing
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-16 right-4 z-[9999] w-[380px] h-[500px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-5 pb-4 flex items-center justify-between border-b border-outline-variant/20">
        <div>
          <h3 className="font-semibold text-on-surface">Bildirim Merkezi</h3>
          <p className="text-xs text-outline font-medium">
            {unreadCount > 0
              ? `${unreadCount} Okunmamış Bildirim`
              : "Tüm bildirimler okundu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-primary hover:bg-primary-container/20 px-3 py-1.5 rounded-lg transition-all font-semibold"
          >
            Tümünü Oku
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-outline/50 space-y-3">
            <span
              className="material-symbols-outlined text-5xl"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              notifications_off
            </span>
            <p className="text-sm font-medium">Yeni bildirim yok</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => {
              const isUnread = !n.readAt;
              let icon = "info";
              let color = "text-primary";
              let bg = "bg-primary-container/20";
              
              if (n.type === "alert" || n.type === "error") {
                icon = "warning";
                color = "text-error";
                bg = "bg-error-container/20";
              } else if (n.type === "success") {
                icon = "check_circle";
                color = "text-emerald-500";
                bg = "bg-emerald-500/10";
              }

              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && markAsRead([n.id])}
                  className={`p-3 rounded-2xl flex gap-3 transition-all cursor-default ${
                    isUnread
                      ? "bg-surface-container-low hover:bg-surface-container-high"
                      : "opacity-60 hover:opacity-100 hover:bg-surface-container-lowest"
                  }`}
                >
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${bg} ${color}`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4
                        className={`text-[13px] font-semibold truncate ${
                          isUnread ? "text-on-surface" : "text-on-surface-variant"
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-outline whitespace-nowrap pt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2 relative mt-4">
                      <div className="w-2 h-2 rounded-full bg-primary absolute right-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
