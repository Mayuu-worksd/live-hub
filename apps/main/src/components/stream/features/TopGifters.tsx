'use client';

import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TopGiftersProps {
  streamId: string;
}

const MOCK_GIFTERS = [
  { id: '1', username: 'CryptoKing', amount: 50000, avatar: 'https://ui-avatars.com/api/?name=CK&background=FFD700', rank: 1 },
  { id: '2', username: 'QueenBee', amount: 25000, avatar: 'https://ui-avatars.com/api/?name=QB&background=C0C0C0', rank: 2 },
  { id: '3', username: 'NightOwl', amount: 10000, avatar: 'https://ui-avatars.com/api/?name=NO&background=CD7F32', rank: 3 },
];

export default function TopGifters({ streamId }: TopGiftersProps) {
  return (
    <div className="flex bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-1 pr-3 items-center shadow-lg shadow-black/20">
      <div className="flex -space-x-2 mr-3 pl-1">
        {MOCK_GIFTERS.map((gifter) => (
          <div key={gifter.id} className="relative z-10 hover:z-20 transition-all hover:scale-110 cursor-pointer group">
            <div className={cn(
              "w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center bg-black",
              gifter.rank === 1 ? 'border-yellow-400' : gifter.rank === 2 ? 'border-gray-300' : 'border-amber-700'
            )}>
              <img src={gifter.avatar} alt={gifter.username} className="w-full h-full object-cover" />
            </div>
            {gifter.rank === 1 && (
              <div className="absolute -top-2 -right-1">
                <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-md fill-yellow-400" />
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] py-1 px-2 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {gifter.username} ({(gifter.amount / 1000).toFixed(1)}k)
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Top Gifters</span>
        <div className="flex items-center gap-1 text-xs font-bold text-white leading-none">
          <Star className="w-3 h-3 text-rose-400 fill-rose-400" /> 85k Total
        </div>
      </div>
    </div>
  );
}
