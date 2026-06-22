'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: {
    value: number;
    label: string;
    description: string;
    type: 'number';
  };
  updated_at: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/settings');
    const json = await res.json();
    const data: AdminSetting[] = json.data ?? [];
    setSettings(data);
    const vals: Record<string, string> = {};
    data.forEach(s => { vals[s.setting_key] = String(s.setting_value.value); });
    setValues(vals);
    setDirty({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setDirty(prev => ({ ...prev, [key]: true }));
  };

  const handleSave = async (key: string) => {
    const rawVal = values[key];
    const numVal = parseFloat(rawVal);
    if (isNaN(numVal)) { toast.error('Invalid value'); return; }

    setSaving(prev => ({ ...prev, [key]: true }));
    const res = await fetch(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: numVal }),
    });
    if (!res.ok) { toast.error('Failed to save'); setSaving(prev => ({ ...prev, [key]: false })); return; }
    setDirty(prev => ({ ...prev, [key]: false }));
    setSaving(prev => ({ ...prev, [key]: false }));
    toast.success(`${settings.find(s => s.setting_key === key)?.setting_value.label} saved`);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Platform Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Core financial and operational configuration. Changes are live immediately.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Warning */}
      <div className="flex items-start gap-3 mb-8 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
        <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-orange-300 font-medium">These settings affect live platform behavior</p>
          <p className="text-xs text-orange-400/70 mt-0.5">
            Changes to fee rates and conversion rates take effect immediately for all new transactions.
            Existing pending withdrawals will still use their original rates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton rounded-2xl h-24" />)}</div>
      ) : settings.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Settings className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No settings loaded</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settings.map((s, i) => {
            const isDirty = dirty[s.setting_key];
            const isSaving = saving[s.setting_key];
            return (
              <motion.div key={s.setting_key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={cn('glass rounded-2xl p-5 border transition-all', isDirty ? 'border-violet/40' : 'border-white/[0.08]')}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{s.setting_value.label}</h3>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 font-mono">{s.setting_key}</code>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{s.setting_value.description}</p>
                    <p className="text-xs text-zinc-700 mt-2">
                      Last updated: {new Date(s.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={cn('relative rounded-xl border overflow-hidden transition-all',
                      isDirty ? 'border-violet/50' : 'border-white/[0.08]')}>
                      <input
                        type="number"
                        step="any"
                        value={values[s.setting_key] ?? ''}
                        onChange={e => handleChange(s.setting_key, e.target.value)}
                        className="w-36 h-10 px-3 bg-white/[0.05] text-sm text-white text-right focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleSave(s.setting_key)}
                      disabled={!isDirty || isSaving}
                      className={cn(
                        'flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium transition-all',
                        isDirty && !isSaving
                          ? 'bg-violet text-white hover:bg-violet/90'
                          : 'bg-white/[0.05] text-zinc-600 cursor-not-allowed'
                      )}>
                      <Save className="h-3.5 w-3.5" />
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
