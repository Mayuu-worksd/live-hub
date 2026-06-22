'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Radio, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth, googleProvider, appleProvider } from '@/lib/firebase/client';
import { cn } from '@/lib/utils/cn';

export default function SignInPage() {
  const router = useRouter();
  const [redirect, setRedirect] = useState('/home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirect(params.get('redirect') || '/home');
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!formData.email) e.email = 'Email is required';
    if (!formData.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to synchronize account session.');
      }
      // cookie is now set — AuthProvider will fetch /api/auth/me and redirect correctly
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message = (err as { message?: string }).message || 'Sign in failed. Please try again.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrors({ password: 'Incorrect email or password' });
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

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
      if (!res.ok) throw new Error('Profile sync failed');
      // AuthProvider's onAuthStateChanged will update the store,
      // and the layout useEffect will redirect to the correct page
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const message = (err as { message?: string }).message ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user closed the popup — not an error
      } else if (code === 'auth/popup-blocked') {
        toast.error('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized in Firebase. Add localhost to Firebase Console → Authentication → Settings → Authorized domains.');
      } else {
        toast.error(`OAuth failed: ${code ?? message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Enter your email first' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Could not send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex relative overflow-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet/20 via-[#09090b] to-cyan/10" />
        <div className="absolute top-40 left-20 w-[400px] h-[400px] rounded-full bg-violet/10 blur-[120px]" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet">
              <Radio className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white">LiveHub</span>
          </Link>
          <h2 className="text-4xl font-semibold text-white leading-tight">
            Welcome back to<br />
            <span className="text-gradient-violet">LiveHub</span>
          </h2>
          <p className="mt-4 text-zinc-400 max-w-md leading-relaxed">
            Sign in to watch your favorite creators, go live, and manage your earnings.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">LiveHub</span>
          </Link>

          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet hover:text-violet-light transition-colors">Sign up</Link>
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {(['google', 'apple'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleOAuth(p)}
                disabled={loading}
                className={cn(
                  'flex items-center justify-center gap-2 h-11 rounded-xl',
                  'bg-white/[0.05] border border-white/[0.08] text-sm font-medium text-zinc-300',
                  'hover:bg-white/[0.08] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {p === 'google' ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-600">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({}); }}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.05] border text-sm text-white placeholder:text-zinc-600',
                    'focus:outline-none focus:bg-white/[0.07] transition-all duration-200',
                    errors.email ? 'border-rose/50' : 'border-white/[0.08] focus:border-violet/50'
                  )}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({}); }}
                  placeholder="Enter your password"
                  className={cn(
                    'w-full h-11 pl-10 pr-10 rounded-xl bg-white/[0.05] border text-sm text-white placeholder:text-zinc-600',
                    'focus:outline-none focus:bg-white/[0.07] transition-all duration-200',
                    errors.password ? 'border-rose/50' : 'border-white/[0.08] focus:border-violet/50'
                  )}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-violet hover:text-violet-light transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-11 rounded-xl',
                'bg-violet text-white text-sm font-semibold',
                'hover:bg-violet-light transition-all duration-200 shadow-lg shadow-violet/20',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
