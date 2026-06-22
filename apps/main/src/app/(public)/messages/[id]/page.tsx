'use client';

import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Image as ImageIcon, Mic, Trash2, Ban, CheckCircle, XCircle, MoreVertical, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { TypingIndicator } from '@/components/messages/TypingIndicator';

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: otherUserId } = use(params);
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch other user profile
    supabase.from('users').select('username, profile:profiles(display_name, avatar_url, is_online, last_seen)').eq('id', otherUserId).single()
      .then(({ data }) => setOtherUser(data));

    // Check block
    fetch('/api/users/blocks')
      .then(res => res.json())
      .then(data => {
        if (data.blocks && data.blocks.includes(otherUserId)) setIsBlocked(true);
      });

    // Fetch initial messages from API (which also handles read receipts)
    fetch(`/api/dm/${otherUserId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) setMessages(data.messages);
        
        // Find conv details to check for requests
        fetch('/api/dm')
          .then(res => res.json())
          .then(dmData => {
            const conv = dmData.conversations?.find((c: any) => c.otherUser.id === otherUserId);
            if (conv) setConversation(conv);
            setLoading(false);
            setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
          });
      });
  }, [user, otherUserId]);

  // Realtime
  useEffect(() => {
    if (!user || !conversation?.id) return;

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new;
            if (msg.is_deleted) return;
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            
            if (msg.sender_id !== user.id) {
              fetch(`/api/dm/${conversation.id}`, { method: 'PATCH' });
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          if (payload.payload.userId === otherUserId) {
            setIsTyping(payload.payload.isTyping);
          }
        }
      )
      .subscribe();

    // Global Presence for online status
    const presenceChannel = supabase.channel('presence:global');
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      let foundOnline = false;
      for (const id in state) {
        if (state[id].some((p: any) => p.user_id === otherUserId)) {
          foundOnline = true;
          break;
        }
      }
      setIsOnline(foundOnline);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, conversation?.id, otherUserId]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!conversation?.id) return;
    fetch('/api/dm/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: conversation.id, isTyping: true })
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch('/api/dm/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id, isTyping: false })
      });
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || isBlocked) return;
    
    const text = input.trim();
    setInput('');
    
    if (conversation?.id) {
      fetch('/api/dm/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversation.id, isTyping: false })
      });
    }

    const tempMsg = {
      id: Math.random().toString(),
      sender_id: user.id,
      content: text,
      message_type: 'text',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherUserId, content: text, type: 'text' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (!conversation) {
        setConversation({ id: data.message.conversation_id, is_approved: true });
      }
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id)); // revert
      setInput(text);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`/api/dm/${conversation.id}?messageId=${messageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Message deleted for everyone');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleApprove = async () => {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`/api/dm/${conversation.id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve');
      setConversation((prev: any) => ({ ...prev, is_approved: true }));
      toast.success('Message request accepted');
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async () => {
    // Basic reject could just block or delete the conversation. We'll just block for now.
    toggleBlock();
  };

  const toggleBlock = async () => {
    try {
      if (isBlocked) {
        await fetch(`/api/users/blocks?blockedId=${otherUserId}`, { method: 'DELETE' });
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        await fetch('/api/users/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockedId: otherUserId })
        });
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch (err) {
      toast.error('Failed to update block status');
    }
  };

  if (!user) return null;

  const isRequestInbox = conversation && !conversation.is_approved && conversation.initiated_by !== user.id;
  const isPendingSent = conversation && !conversation.is_approved && conversation.initiated_by === user.id;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-[#09090b] border-x border-white/[0.08]">
      {/* Header */}
      <div className="h-16 border-b border-white/[0.08] flex items-center justify-between px-4 shrink-0 bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/messages" className="p-2 hover:bg-white/5 rounded-full mr-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {otherUser && (
            <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/[0.08]">
                {otherUser.profile?.avatar_url ? (
                  <img src={otherUser.profile.avatar_url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <span className="text-sm font-bold text-white">{otherUser.username[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-white group-hover:text-primary transition-colors">
                  {otherUser.profile?.display_name || otherUser.username}
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", isOnline ? "bg-live" : "bg-zinc-600")} />
                  <span className="text-xs text-zinc-500">
                    {isOnline ? 'Active now' : 'Offline'}
                  </span>
                </div>
              </div>
            </Link>
          )}
        </div>
        <button 
          onClick={toggleBlock}
          className={cn("p-2 rounded-full transition-colors", isBlocked ? "text-rose bg-rose/10 hover:bg-rose/20" : "text-zinc-400 hover:text-rose hover:bg-white/5")}
          title={isBlocked ? "Unblock User" : "Block User"}
        >
          <Ban className="h-5 w-5" />
        </button>
      </div>

      {/* Message Request Banner */}
      {isRequestInbox && !isBlocked && (
        <div className="p-4 bg-[#111113] border-b border-white/5 shrink-0 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-white font-semibold mb-1">Message Request</h3>
          <p className="text-sm text-zinc-400 mb-4 max-w-sm">
            {otherUser?.username} wants to send you a message. They won't know you've seen it until you accept.
          </p>
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button onClick={handleReject} className="flex-1 py-2 rounded-xl bg-white/5 text-white text-sm font-semibold hover:bg-rose/20 hover:text-rose transition-colors">
              Delete & Block
            </button>
            <button onClick={handleApprove} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <p>Say hi to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[75%] group",
                  isMe ? "self-end items-end" : "self-start items-start"
                )}
              >
                <div className="flex items-center gap-2">
                  {isMe && !msg.is_deleted && (
                    <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm break-words",
                    msg.is_deleted 
                      ? "bg-transparent border border-dashed border-white/20 text-zinc-500 italic rounded-2xl"
                      : isMe 
                        ? "bg-primary text-white rounded-br-none" 
                        : "bg-white/10 text-white rounded-bl-none border border-white/5"
                  )}>
                    {msg.message_type === 'image' ? (
                      <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> [Image Attachment]</div>
                    ) : msg.message_type === 'voice' ? (
                      <div className="flex items-center gap-2"><Mic className="h-4 w-4" /> [Voice Note]</div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-zinc-500 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && !msg.is_deleted && (
                    <span className="text-[10px] text-zinc-500">
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start">
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/[0.08] shrink-0">
        {isBlocked ? (
          <div className="text-center py-3 text-sm text-rose bg-rose/10 rounded-full border border-rose/20">
            You cannot send messages to this user.
          </div>
        ) : isRequestInbox ? (
          <div className="text-center py-3 text-sm text-zinc-500 bg-white/5 rounded-full border border-white/10">
            Accept the request to reply.
          </div>
        ) : isPendingSent ? (
          <div className="text-center py-3 text-sm text-zinc-500 bg-white/5 rounded-full border border-white/10">
            Waiting for {otherUser?.username} to accept your request.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button type="button" onClick={() => toast('Image uploads coming soon!')} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <ImageIcon className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => toast('Voice notes coming soon!')} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <Mic className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={handleTyping}
              placeholder="Message..."
              className="flex-1 h-12 bg-white/5 border border-white/10 rounded-full px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
