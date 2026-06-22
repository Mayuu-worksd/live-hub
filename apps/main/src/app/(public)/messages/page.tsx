'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Conversation {
  id: string;
  is_approved: boolean;
  initiated_by: string;
  otherUser: {
    id: string;
    username: string;
    avatar_url: string;
    display_name: string;
  };
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');

  useEffect(() => {
    if (!user) return;
    fetch('/api/dm')
      .then(res => res.json())
      .then(data => {
        if (data.conversations) setConversations(data.conversations);
        setLoading(false);
      });
  }, [user]);

  if (!user) return null;

  const inboxConvs = conversations.filter(c => c.is_approved || c.initiated_by === user.id);
  const requestConvs = conversations.filter(c => !c.is_approved && c.initiated_by !== user.id);
  
  const displayedConvs = activeTab === 'inbox' ? inboxConvs : requestConvs;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-[#09090b] border-x border-white/[0.08]">
      {/* Header */}
      <div className="p-6 border-b border-white/[0.08] shrink-0 bg-black/40 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>
        
        <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              activeTab === 'inbox' ? "bg-white/10 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'requests' ? "bg-white/10 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Requests
            {requestConvs.length > 0 && (
              <span className="h-5 w-5 rounded-full bg-rose flex items-center justify-center text-[10px] text-white">
                {requestConvs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : displayedConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
            <MessageSquare className="h-12 w-12 opacity-50" />
            <p>{activeTab === 'inbox' ? 'No messages yet' : 'No message requests'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {displayedConvs.map((conv) => (
              <Link 
                key={conv.id} 
                href={`/messages/${conv.otherUser.id}`}
                className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/[0.08]">
                    {conv.otherUser.avatar_url ? (
                      <img src={conv.otherUser.avatar_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <span className="text-xl font-bold text-white">{conv.otherUser.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  {conv.unreadCount > 0 && activeTab === 'inbox' && (
                    <div className="absolute -top-1 -right-1 bg-rose h-5 w-5 rounded-full border-2 border-[#09090b] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-white truncate pr-4 group-hover:text-primary transition-colors">
                      {conv.otherUser.display_name || conv.otherUser.username}
                    </h2>
                    <span className="text-xs text-zinc-500 whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm truncate pr-4",
                      conv.unreadCount > 0 ? "text-white font-medium" : "text-zinc-500"
                    )}>
                      {activeTab === 'requests' ? 'Wants to send you a message' : conv.lastMessage || 'Sent a message'}
                    </p>
                    {conv.unreadCount > 0 && <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
