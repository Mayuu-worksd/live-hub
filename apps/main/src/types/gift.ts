export type GiftCategory = 'basic' | 'premium' | 'ultra';

export interface Gift {
  id: string;
  name: string;
  coin_cost: number;
  animation_url: string | null;
  category: GiftCategory;
  is_active: boolean;
  emoji?: string;
}

export interface StreamGift {
  id: string;
  stream_id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  quantity: number;
  coins_spent: number;
  diamonds_earned: number;
  created_at: string;
  gift?: Gift;
  sender?: {
    id: string;
    username: string;
    profile: {
      display_name: string | null;
      avatar_url: string | null;
    };
  };
}
