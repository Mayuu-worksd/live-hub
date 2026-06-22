'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { cn } from '@/lib/utils/cn';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, setNotifications, markAsRead, markAllRead } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => data && setNotifications(data));
  }, [user, setNotifications]);

  const handleClick = async (id: string, link?: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    markAsRead(id);
    if (link) router.push(link);
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    markAllRead();
  };

  return (
    <div className="max-w-[700px] mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-semibold text-white">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">Stay up to date with your activity</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs text-violet hover:text-violet-light transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </motion.div>

      {notifications.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Bell className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleClick(n.id, (n.data as { link?: string })?.link)}
              className={cn(
                'glass rounded-xl px-4 py-3.5 cursor-pointer transition-all hover:bg-white/[0.06]',
                !n.is_read && 'border-l-2 border-violet'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn('text-sm', n.is_read ? 'text-zinc-400' : 'text-white font-medium')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{n.body}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-zinc-600">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                  {!n.is_read && (
                    <span className="inline-block mt-1 h-2 w-2 rounded-full bg-violet" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
