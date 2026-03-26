import { create } from "zustand";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  metadata?: any;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  
  // Actions
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Polling
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
}

let pollInterval: NodeJS.Timeout | null = null;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: NotificationItem[] = await res.json();
      
      const unreadCount = data.filter((n) => !n.readAt).length;
      
      set({ notifications: data, unreadCount, isLoading: false });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (ids: string[]) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        // optimistically update
        set((state) => {
          const newNotifs = state.notifications.map((n) =>
            ids.includes(n.id) ? { ...n, readAt: new Date().toISOString(), status: "read" } : n
          );
          return {
            notifications: newNotifs,
            unreadCount: newNotifs.filter((n) => !n.readAt).length,
          };
        });
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  },

  markAllAsRead: async () => {
    const unreadIds = get().notifications.filter((n) => !n.readAt).map((n) => n.id);
    if (unreadIds.length > 0) {
      await get().markAsRead(unreadIds);
    }
  },

  startPolling: (intervalMs = 30000) => {
    // Initial fetch
    get().fetchNotifications();
    
    // Clear existing interval if any
    if (pollInterval) clearInterval(pollInterval);
    
    // Start new interval
    pollInterval = setInterval(() => {
      get().fetchNotifications();
    }, intervalMs);
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
}));
