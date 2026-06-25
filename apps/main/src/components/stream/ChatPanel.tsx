'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import type { StreamMessage } from '@/types/stream';
import { Send, ShieldAlert, Pin, MoreVertical, Ban, MicOff, Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPanel({ streamId, isHost, isOverlay = false }: { streamId: string, isHost?: boolean, isOverlay?: boolean }) {
  const { user } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat?stream_id=${streamId}`)
      .then(res => res.json())
      .then(({ messages: data }) => {
        if (data) setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

    const channel = supabase
      .channel(`chat:${streamId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stream_messages', filter: `stream_id=eq.${streamId}` },
        async (payload) => {
          const newMsg = payload.new as StreamMessage;
          const res = await fetch(`/api/chat/message?id=${newMsg.id}`);
          if (res.ok) {
            const { message } = await res.json();
            setMessages((prev) => {
              if (prev.some(m => m.id === message.id)) return prev;
              const updated = [...prev, message];
              return updated.length > 200 ? updated.slice(-200) : updated;
            });
          } else {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              const updated = [...prev, newMsg];
              return updated.length > 200 ? updated.slice(-200) : updated;
            });
          }
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setLoading(true);
    const text = input.trim();
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stream_id: streamId, content: text }),
    });

    if (!res.ok) {
      toast.error('Failed to send message');
      setInput(text);
    }
    setLoading(false);
  };

  const handleModerate = (action: string, username: string) => {
    toast.success(`${action} applied to ${username}`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Header (Hidden in overlay mode) */}
      {!isOverlay && (
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Chat</h2>
          {isHost && (
            <div className="flex gap-2">
              <button className="h-7 w-7 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors" title="Subscriber Only Mode">
                <ShieldAlert className="h-3.5 w-3.5" />
              </button>
              <button className="h-7 w-7 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors" title="Slow Mode">
                <span className="text-[10px] font-bold">1s</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pinned Message */}
      {(pinnedMsg || isHost) && !isOverlay && (
        <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-b border-white/[0.05] p-3 flex gap-2 items-start shrink-0">
          <Pin className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-white/90 font-medium">
              {pinnedMsg || "Welcome to the stream! Drop a follow if you enjoy the content!"}
            </p>
          </div>
          {isHost && (
            <button onClick={() => setPinnedMsg(null)} className="text-zinc-500 hover:text-white text-xs">Unpin</button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className={cn(
        "flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0",
        isOverlay ? "mask-image-to-top" : ""
      )}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id}
              className={cn(
                "group flex flex-col gap-0.5 text-sm leading-relaxed shrink-0 break-words rounded-xl p-2 transition-colors",
                isOverlay ? "bg-black/40 backdrop-blur-md border border-white/5 shadow-md" : "hover:bg-white/[0.02]"
              )}
            >
              {msg.type === 'system' ? (
                <span className="text-zinc-400 text-xs italic font-medium">{msg.content}</span>
              ) : (
                <div className="flex gap-2 items-start">
                  {msg.user?.profile?.avatar_url ? (
                    <img src={msg.user.profile.avatar_url} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] text-white font-bold">{msg.user?.username?.[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "font-bold text-xs",
                        msg.user_id === user?.id ? "text-rose-400" : "text-zinc-300"
                      )}>
                        {msg.user?.username || 'User'}
                      </span>
                      {msg.type === 'gift' && <span className="bg-fuchsia-500/20 text-fuchsia-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Sent Gift</span>}
                    </div>
                    <span className={cn(
                      "block",
                      msg.type === 'gift' ? 'text-fuchsia-400 font-bold' : 'text-zinc-100'
                    )}>
                      {msg.content}
                    </span>
                  </div>

                  {isHost && msg.user_id !== user?.id && (
                    <div className="hidden group-hover:flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1">
                      <button onClick={() => handleModerate('Muted', msg.user?.username || '')} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><MicOff className="w-3 h-3" /></button>
                      <button onClick={() => handleModerate('Banned', msg.user?.username || '')} className="p-1 hover:bg-rose-500/20 rounded text-zinc-400 hover:text-rose-400"><Ban className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input Area (Hidden if overlay and not focused on mobile, but handled by parent) */}
      <div className={cn("p-4 border-t border-white/[0.05] shrink-0", isOverlay ? "bg-transparent pb-6" : "bg-white/[0.02]")}>
        {!user ? (
          <button 
            onClick={() => openModal('chat in real-time')} 
            className="w-full text-center py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/10 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md font-semibold transition-colors cursor-pointer"
          >
            Sign in to join the conversation
          </button>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chat..."
              disabled={loading}
              className={cn(
                "flex-1 h-11 rounded-full px-4 text-sm text-white focus:outline-none transition-all disabled:opacity-50",
                isOverlay ? "bg-black/50 backdrop-blur-xl border border-white/20 focus:bg-black/70 focus:border-white/40 shadow-lg" : "bg-white/5 border border-white/10 focus:bg-white/10 focus:border-violet-400"
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={cn(
                "h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0",
                isOverlay ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "bg-violet text-white hover:bg-violet-light"
              )}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
