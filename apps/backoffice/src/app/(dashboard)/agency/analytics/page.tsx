'use client';

import { motion } from 'framer-motion';

export default function AgencyAnalyticsPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Creator performance metrics</p>
      </motion.div>
    </div>
  );
}
