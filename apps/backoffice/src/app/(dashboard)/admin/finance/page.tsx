import { supabaseAdmin } from '@/lib/supabase/server';
import { Diamond, DollarSign, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const revalidate = 0; // Disable caching

export default async function FinanceDashboardPage() {
  // Fetch global financial data using admin client
  const [
    { count: totalUsers },
    { data: transactions },
    { data: withdrawals },
    { data: wallets },
    { count: totalSubs }
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('wallet_transactions').select('amount, type, coins_delta'),
    supabaseAdmin.from('withdrawals').select('diamond_amount, status'),
    supabaseAdmin.from('wallets').select('coin_balance, diamond_balance'),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
  ]);

  // Aggregate stats
  let totalRevenueUsd = 0;
  let totalCoinsSold = 0;
  transactions?.forEach(t => {
    if (t.type === 'purchase') {
      totalRevenueUsd += Number(t.amount || 0);
      totalCoinsSold += t.coins_delta;
    }
  });

  let totalWithdrawalsUsd = 0;
  let pendingWithdrawalsUsd = 0;
  withdrawals?.forEach(w => {
    const usdValue = w.diamond_amount * 0.005; // assuming 1 diamond = $0.005
    if (w.status === 'completed') totalWithdrawalsUsd += usdValue;
    if (w.status === 'pending') pendingWithdrawalsUsd += usdValue;
  });

  let circulatingCoins = 0;
  let circulatingDiamonds = 0;
  wallets?.forEach(w => {
    circulatingCoins += w.coin_balance;
    circulatingDiamonds += w.diamond_balance;
  });

  const cards = [
    { title: 'Total Revenue (USD)', value: `$${totalRevenueUsd.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-500' },
    { title: 'Coins Sold', value: totalCoinsSold.toLocaleString(), icon: Diamond, color: 'text-gold' },
    { title: 'Total Paid Out', value: `$${totalWithdrawalsUsd.toFixed(2)}`, icon: ArrowDownRight, color: 'text-rose' },
    { title: 'Pending Payouts', value: `$${pendingWithdrawalsUsd.toFixed(2)}`, icon: CreditCard, color: 'text-orange-500' },
    { title: 'Circulating Coins', value: circulatingCoins.toLocaleString(), icon: Diamond, color: 'text-gold' },
    { title: 'Circulating Diamonds', value: circulatingDiamonds.toLocaleString(), icon: Diamond, color: 'text-cyan' },
    { title: 'Active Subscriptions', value: totalSubs?.toLocaleString() || '0', icon: ArrowUpRight, color: 'text-violet' },
    { title: 'Total Users', value: totalUsers?.toLocaleString() || '0', icon: ArrowUpRight, color: 'text-zinc-300' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Financial Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform-wide revenue, liabilities, and economy stats.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map(c => (
          <div key={c.title} className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-400">{c.title}</p>
              <div className={cn("p-2 rounded-lg bg-white/5", c.color)}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Economy Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-sm text-white font-medium">Platform Profit Estimate</p>
                <p className="text-xs text-zinc-500">Revenue minus Pending & Completed Payouts</p>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                ${(totalRevenueUsd - totalWithdrawalsUsd - pendingWithdrawalsUsd).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-sm text-white font-medium">Creator Liability Estimate</p>
                <p className="text-xs text-zinc-500">Value of circulating diamonds</p>
              </div>
              <p className="text-lg font-bold text-rose">
                ${(circulatingDiamonds * 0.005).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <button className="text-sm text-violet hover:text-violet-light transition-colors">View All</button>
          </div>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{t.type}</p>
                      <p className="text-xs text-zinc-500">{t.coins_delta} coins</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">+${Number(t.amount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8"><p className="text-zinc-500 text-sm">No transactions yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
