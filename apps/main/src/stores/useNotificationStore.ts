import { create } from 'zustand';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  markAsRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length });
  },
  markAllRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, is_read: true }));
    set({ notifications, unreadCount: 0 });
  },
}));
