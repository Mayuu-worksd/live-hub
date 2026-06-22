'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, appleProvider } from '@/lib/firebase/client';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSessionSync = async (idToken: string) => {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: idToken, token: idToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to sync session');
    }
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      const idToken = await userCredential.user.getIdToken();
      await handleSessionSync(idToken);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      await handleSessionSync(idToken);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      const idToken = await userCredential.user.getIdToken();
      await handleSessionSync(idToken);
    } catch (err: any) {
      setError(err.message || 'Apple login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Welcome to LiveHub
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-400">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-neutral-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-300">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 bg-neutral-950 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-700 rounded-md shadow-sm placeholder-neutral-500 bg-neutral-950 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neutral-900 text-neutral-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-neutral-700 rounded-md shadow-sm bg-neutral-950 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                Google
              </button>
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-neutral-700 rounded-md shadow-sm bg-neutral-950 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                Apple
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
              >
                {isLogin ? 'Need an account? Register with Email' : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
