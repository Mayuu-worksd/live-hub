'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';

interface StreamCardProps {
  title: string;
  thumbnail: string;
  creatorName: string;
  creatorAvatar: string;
  viewerCount: number;
  category: string;
  isLive?: boolean;
  streamId?: string;
  index?: number;
}

export function StreamCard({
  title,
  thumbnail,
  creatorName,
  creatorAvatar,
  viewerCount,
  category,
  isLive = true,
  streamId = 'stream-1',
  index = 0,
}: StreamCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { openModal } = useAuthModalStore();

  const formatViewers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleClick = () => {
    if (!user) {
      openModal();
    } else {
      router.push(`/live/${streamId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-zinc-900">
          {/* Thumbnail */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${thumbnail})` }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/20" />

          {/* Top Left Stats (Eye + VS) */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="flex items-center gap-1 text-white/90">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{formatViewers(viewerCount)}</span>
            </div>
            <span className="text-[10px] font-bold text-white/70">VS</span>
          </div>

          {/* Bottom Left Creator Info */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            {/* Avatar */}
            <div
              className="h-10 w-10 rounded-full bg-cover bg-center ring-1 ring-white/20 flex-shrink-0"
              style={{ backgroundImage: `url(${creatorAvatar})` }}
            />
            
            {/* Text details */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-bold text-white truncate">{creatorName}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/80 font-medium">
                <span>💎</span>
                <span>{(Math.random() * 10).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        </div>
    </motion.div>
  );
}
