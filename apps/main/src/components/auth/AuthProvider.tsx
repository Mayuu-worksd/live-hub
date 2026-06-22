'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, clearUser, setLoading } = useAuthStore();
  const { setBalance } = useWalletStore();

  useEffect(() => {
    let walletChannel: ReturnType<typeof supabase.channel> | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (walletChannel) {
        supabase.removeChannel(walletChannel);
        walletChannel = null;
      }

      if (!firebaseUser) {
        clearUser();
        setLoading(false);
        return;
      }

      try {
        let res = await fetch('/api/auth/me');

        // No session cookie or expired — sync to set cookie then retry
        if (res.status === 401 || res.status === 404) {
          const token = await firebaseUser.getIdToken();
          const syncRes = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          if (!syncRes.ok) {
            clearUser();
            setLoading(false);
            return;
          }
          res = await fetch('/api/auth/me');
        }

        if (!res.ok) {
          clearUser();
          setLoading(false);
          return;
        }

        const { user, profile, wallet } = await res.json();
        setUser(user);
        if (profile) setProfile(profile);
        if (wallet) setBalance(wallet.coin_balance, wallet.diamond_balance);

        walletChannel = supabase
          .channel(`wallet-${user.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, (payload) => {
            if (payload.new) {
              const { coin_balance, diamond_balance } = payload.new as any;
              setBalance(coin_balance, diamond_balance);
            }
          })
          .subscribe();
      } catch (err) {
        console.error('AuthProvider error:', err);
        clearUser();
      }

      setLoading(false);
    });

    return () => {
      unsub();
      if (walletChannel) supabase.removeChannel(walletChannel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
