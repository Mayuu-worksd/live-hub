'use client';

import { motion } from 'framer-motion';

export default function AgencyRevenuePage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">Revenue</h1>
        <p className="text-sm text-zinc-500 mt-1">Agency earnings overview</p>
      </motion.div>
    </div>
  );
}
