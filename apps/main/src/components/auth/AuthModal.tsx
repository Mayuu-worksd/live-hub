'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, X, Mail } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider, appleProvider } from '@/lib/firebase/client';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { cn } from '@/lib/utils/cn';

export function AuthModal() {
  const router = useRouter();
  const { isOpen, closeModal } = useAuthModalStore();
  const [loading, setLoading] = useState(false);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider === 'google' ? googleProvider : appleProvider);
      const token = await result.user.getIdToken();
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Profile sync failed');
      closeModal();
      router.push(data.onboarding_completed ? '/home' : '/onboarding');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message = (err as { message?: string }).message ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        toast.error(`OAuth failed: ${code ?? message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md h-full md:max-w-md md:h-auto overflow-hidden rounded-3xl bg-[#0F0F0F] border border-white/10 shadow-2xl p-8"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-6 shadow-[0_0_15px_rgba(255,45,85,0.4)]">
                <Radio className="h-6 w-6 text-white" />
              </div>
              
              <h2 className="text-2xl font-black text-white font-heading mb-2">Join LiveHub</h2>
              <p className="text-sm text-zinc-400 mb-8 px-4">
                Sign in to chat, send gifts, and support your favorite creators.
              </p>

              <div className="w-full space-y-3">
                {(['google', 'apple'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleOAuth(p)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 h-12 rounded-xl',
                      'bg-white/5 border border-white/10 text-sm font-bold text-white',
                      'hover:bg-white/10 transition-all duration-200 disabled:opacity-50'
                    )}
                  >
                    {p === 'google' ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    )}
                    Continue with {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 w-full">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={() => {
                  closeModal();
                  router.push('/register');
                }}
                className="w-full mt-6 flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Mail className="w-4 h-4" />
                Sign up with Email
              </button>

              <p className="mt-6 text-xs text-zinc-500">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    closeModal();
                    router.push('/login');
                  }}
                  className="text-primary hover:text-primary/80 font-bold"
                >
                  Log in
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
