export interface Wallet {
  id: string;
  user_id: string;
  coin_balance: number;
  diamond_balance: number;
  pending_withdrawal: number;
  total_earned: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'refund';
  amount: number;
  coins_delta: number;
  diamonds_delta: number;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_usd: number;
  price_inr: number;
  bonus_coins: number;
  is_popular: boolean;
  is_active: boolean;
}
