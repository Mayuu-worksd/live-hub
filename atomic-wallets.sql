-- ═══════════════════════════════════════════════════════
-- LiveHub — Atomic Wallet Transactions RPC
-- ═══════════════════════════════════════════════════════

create or replace function public.process_wallet_transaction(
  p_user_id uuid,
  p_type text,
  p_coins_delta integer,
  p_diamonds_delta integer,
  p_reference_id text,
  p_description text
) returns jsonb as $$
declare
  v_wallet_id uuid;
  v_coin_balance integer;
  v_diamond_balance integer;
  v_result jsonb;
begin
  -- Update wallet balances atomically
  update public.wallets
  set coin_balance = coin_balance + p_coins_delta,
      diamond_balance = diamond_balance + p_diamonds_delta,
      total_earned = total_earned + case when p_diamonds_delta > 0 then p_diamonds_delta else 0 end,
      updated_at = now()
  where user_id = p_user_id
  returning id, coin_balance, diamond_balance into v_wallet_id, v_coin_balance, v_diamond_balance;

  if v_wallet_id is null then
    raise exception 'Wallet not found for user %', p_user_id;
  end if;

  -- Ensure no negative balances (basic double-spending protection)
  if v_coin_balance < 0 then
    raise exception 'Insufficient coins';
  end if;
  if v_diamond_balance < 0 then
    raise exception 'Insufficient diamonds';
  end if;

  -- Insert ledger record
  insert into public.wallet_transactions (
    wallet_id, type, amount, coins_delta, diamonds_delta, reference_id, description, created_at
  ) values (
    v_wallet_id, p_type, 0, p_coins_delta, p_diamonds_delta, p_reference_id, p_description, now()
  );

  v_result := jsonb_build_object(
    'wallet_id', v_wallet_id,
    'coin_balance', v_coin_balance,
    'diamond_balance', v_diamond_balance
  );
  
  return v_result;
end;
$$ language plpgsql security definer;
