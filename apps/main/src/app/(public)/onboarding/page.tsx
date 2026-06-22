'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Eye, ArrowRight, Check, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

const ROLES = [
  {
    id: 'viewer' as const,
    label: 'Viewer',
    icon: Eye,
    description: 'Watch live streams, follow creators, send gifts, buy coins, and subscribe.',
    perks: ['Watch unlimited streams', 'Send virtual gifts', 'Follow your favorite creators', 'Buy coin packages', 'Subscribe to creators'],
    color: 'violet',
  },
  {
    id: 'creator' as const,
    label: 'Creator',
    icon: Radio,
    description: 'Go live, build your audience, receive gifts, and earn real revenue.',
    perks: ['Broadcast live streams', 'Receive gifts & diamonds', 'Creator dashboard & analytics', 'Manage subscribers', 'Request payouts'],
    color: 'cyan',
  },
];

const INTERESTS = [
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'dance', label: 'Dance', icon: '💃' },
  { id: 'irl', label: 'Just Chatting', icon: '🗣️' },
  { id: 'asmr', label: 'ASMR', icon: '🎧' },
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'art', label: 'Art', icon: '🎨' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'creator' | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(prev => prev.filter(i => i !== id));
    } else {
      if (selectedInterests.length >= 5) return toast.error('You can select up to 5 interests');
      setSelectedInterests(prev => [...prev, id]);
    }
  };

  const handleFinish = async () => {
    if (!selectedRole || !user) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          interests: selectedInterests,
          display_name: displayName || user.username,
          bio: bio || null,
        }),
      });

      if (!res.ok) throw new Error('Onboarding failed');

      setUser({ ...user, role: selectedRole, onboarding_completed: true });
      toast.success(`Welcome to LiveHub, ${displayName || user.username}!`);
      router.replace('/home');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-10 w-full max-w-xs mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: step >= i ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: ROLE */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 mx-auto mb-4 border border-violet/20">
                  <Radio className="h-6 w-6 text-violet" />
                </div>
                <h1 className="text-3xl font-semibold text-white">How will you use LiveHub?</h1>
                <p className="mt-2 text-zinc-400 text-sm">Choose your primary role. You can always change this later.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {ROLES.map((role) => (
                  <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      'relative text-left p-6 rounded-2xl border-2 transition-all duration-200',
                      selectedRole === role.id
                        ? role.color === 'violet'
                          ? 'border-violet bg-violet/10 shadow-lg shadow-violet/10'
                          : 'border-cyan bg-cyan/10 shadow-lg shadow-cyan/10'
                        : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]'
                    )}
                  >
                    {selectedRole === role.id && (
                      <div className={cn('absolute top-4 right-4 h-5 w-5 rounded-full flex items-center justify-center',
                        role.color === 'violet' ? 'bg-violet' : 'bg-cyan')}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl mb-4',
                      role.color === 'violet' ? 'bg-violet/10' : 'bg-cyan/10')}>
                      <role.icon className={cn('h-6 w-6', role.color === 'violet' ? 'text-violet' : 'text-cyan')} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{role.label}</h3>
                    <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{role.description}</p>
                    <ul className="space-y-1.5">
                      {role.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2 text-xs text-zinc-400">
                          <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0',
                            role.color === 'violet' ? 'bg-violet' : 'bg-cyan')} />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedRole}
                className={cn(
                  'w-full flex items-center justify-center gap-2 h-12 rounded-xl',
                  'bg-white text-black font-semibold text-sm',
                  'hover:bg-zinc-200 transition-all shadow-lg',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: INTERESTS */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4 border border-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-semibold text-white">What are you into?</h1>
                <p className="mt-2 text-zinc-400 text-sm">Select up to 5 interests to tune your Home Feed.</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <motion.button
                      key={interest.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleInterest(interest.id)}
                      className={cn(
                        'flex items-center gap-2 px-5 py-3 rounded-full border transition-all duration-200',
                        isSelected 
                          ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20' 
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <span className="text-lg">{interest.icon}</span>
                      <span className="text-sm font-medium">{interest.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="h-12 px-6 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedInterests.length === 0}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 h-12 rounded-xl',
                    'bg-primary text-white font-semibold text-sm',
                    'hover:bg-primary/90 transition-all shadow-lg',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PROFILE SETUP */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-semibold text-white">Setup your profile</h1>
                <p className="mt-2 text-zinc-400 text-sm">Let people know who you are.</p>
              </div>

              <div className="space-y-5 mb-10 glass p-8 rounded-3xl border border-white/10">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)} className="h-12 px-6 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 h-12 rounded-xl',
                    'bg-white text-black font-semibold text-sm',
                    'hover:bg-zinc-200 transition-all shadow-lg',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {loading ? 'Completing Setup...' : 'Finish & Enter LiveHub'}
                  {!loading && <Check className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
