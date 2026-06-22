'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { username: string } | null;
  reported: { username: string } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reports')
      .select('*, reporter:users!reporter_id(username), reported:users!reported_id(username)')
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .then(({ data }) => { setReports((data ?? []) as Report[]); setLoading(false); });
  }, []);

  const resolve = async (id: string) => {
    const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success('Report resolved');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">Open moderation reports</p>
      </motion.div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-20" />)}</div>
      ) : reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Flag className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No open reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
              <Flag className="h-4 w-4 text-rose flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white">
                  <span className="font-medium">@{r.reporter?.username}</span>
                  <span className="text-zinc-400"> reported </span>
                  <span className="font-medium">@{r.reported?.username}</span>
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{r.reason}</p>
                <p className="text-xs text-zinc-600">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => resolve(r.id)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald/10 text-emerald text-xs font-medium hover:bg-emerald/20 transition-colors">
                <Check className="h-3.5 w-3.5" />
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
