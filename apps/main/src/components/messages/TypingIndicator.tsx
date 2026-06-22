'use client';

import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded-2xl rounded-bl-none w-fit border border-white/5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-zinc-400 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
