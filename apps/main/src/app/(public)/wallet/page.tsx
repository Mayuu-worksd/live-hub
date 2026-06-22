'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Plus, History } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import type { CoinPackage, WalletTransaction } from '@/types/wallet';

export default function WalletPage() {
  const { user } = useAuthStore();
  const { coinBalance, diamondBalance, setBalance } = useWalletStore();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('coin_packages')
      .select('*')
      .eq('is_active', true)
      .order('price_usd')
      .then(({ data }) => data && setPackages(data));
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wallets')
      .select('id, coin_balance, diamond_balance')
      .eq('user_id', user.id)
      .single()
      .then(({ data: wallet }) => {
        if (!wallet) return;
        setBalance(wallet.coin_balance, wallet.diamond_balance);
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data }) => data && setTransactions(data));
      });
  }, [user, setBalance]);

  const handleBuy = async (pkg: CoinPackage) => {
    if (!user) return;
    setBuying(pkg.id);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, userId: user.id }),
      });
      const { url, error } = await res.json();
      if (error) { toast.error(error); return; }
      window.location.href = url;
    } catch {
      toast.error('Payment failed to initiate');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Wallet</h1>
        <p className="text-sm text-zinc-500 mt-1">Buy coins, send gifts, and track your transactions</p>
      </motion.div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="h-4 w-4 text-gold" />
            <span className="text-xs font-medium text-zinc-400">Coin Balance</span>
          </div>
          <p className="text-3xl font-semibold text-white">{coinBalance.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">Use to send gifts &amp; subscriptions</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">💎</span>
            <span className="text-xs font-medium text-zinc-400">Diamond Balance</span>
          </div>
          <p className="text-3xl font-semibold text-white">{diamondBalance.toLocaleString()}</p>
          <p className="text-xs text-zinc-500 mt-1">Earned from gifts received</p>
        </div>
      </div>

      {/* Coin packages */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4 text-violet" />
          <h2 className="text-sm font-semibold text-white">Buy Coins</h2>
        </div>
        {packages.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm">No coin packages available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'glass rounded-2xl p-4 relative',
                  pkg.is_popular && 'border-violet/30 ring-1 ring-violet/20'
                )}
              >
                {pkg.is_popular && (
                  <span className="absolute -top-2 left-4 text-[10px] font-semibold text-white bg-violet px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <div className="text-2xl mb-2">🪙</div>
                <p className="text-sm font-semibold text-white">{pkg.name}</p>
                <p className="text-lg font-bold text-gold mt-1">
                  {(pkg.coins + pkg.bonus_coins).toLocaleString()}
                </p>
                {pkg.bonus_coins > 0 && (
                  <p className="text-[10px] text-emerald">+{pkg.bonus_coins} bonus</p>
                )}
                <button
                  onClick={() => handleBuy(pkg)}
                  disabled={buying === pkg.id}
                  className={cn(
                    'mt-3 w-full h-9 rounded-xl text-xs font-semibold transition-all',
                    'bg-violet text-white hover:bg-violet-light',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  {buying === pkg.id ? 'Redirecting…' : `$${pkg.price_usd}`}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="glass rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white">{tx.description}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {tx.coins_delta !== 0 && (
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        tx.coins_delta > 0 ? 'text-emerald' : 'text-rose'
                      )}
                    >
                      {tx.coins_delta > 0 ? '+' : ''}
                      {tx.coins_delta} coins
                    </p>
                  )}
                  {tx.diamonds_delta !== 0 && (
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        tx.diamonds_delta > 0 ? 'text-cyan' : 'text-rose'
                      )}
                    >
                      {tx.diamonds_delta > 0 ? '+' : ''}
                      {tx.diamonds_delta} 💎
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
