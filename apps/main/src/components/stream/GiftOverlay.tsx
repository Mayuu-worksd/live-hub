'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface GiftEvent {
  id: string;
  emoji: string;
  name: string;
  senderName: string;
}

export default function GiftOverlay({ streamId }: { streamId: string }) {
  const [activeGifts, setActiveGifts] = useState<GiftEvent[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`gifts:${streamId}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stream_gifts', filter: `stream_id=eq.${streamId}` },
        async (payload) => {
          const giftRecord = payload.new;
          
          // Fetch sender and gift details (could be optimized by joining, but realtime payload doesn't join)
          const [senderRes, catalogRes] = await Promise.all([
            supabase.from('users').select('username').eq('id', giftRecord.sender_id).single(),
            supabase.from('gift_catalog').select('emoji, name').eq('id', giftRecord.gift_id).single()
          ]);

          if (senderRes.data && catalogRes.data) {
            const newGift: GiftEvent = {
              id: giftRecord.id,
              emoji: catalogRes.data.emoji,
              name: catalogRes.data.name,
              senderName: senderRes.data.username
            };
            
            setActiveGifts(prev => [...prev, newGift]);
            
            // Remove after animation completes (3 seconds)
            setTimeout(() => {
              setActiveGifts(prev => prev.filter(g => g.id !== newGift.id));
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      <AnimatePresence>
        {activeGifts.map((gift) => (
          <motion.div
            key={gift.id}
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1.5, y: -200 }}
            exit={{ opacity: 0, scale: 2, y: -400 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center drop-shadow-2xl"
          >
            <span className="text-8xl md:text-9xl filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              {gift.emoji}
            </span>
            <span className="text-white font-black text-xl md:text-2xl mt-4 bg-black/50 px-4 py-1 rounded-full backdrop-blur-md border border-white/20">
              {gift.senderName} sent {gift.name}!
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
