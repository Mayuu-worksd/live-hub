-- ═══════════════════════════════════════════════════════
-- LiveHub — Webhook Idempotency Constraint
-- ═══════════════════════════════════════════════════════

-- Ensure that reference_id (like Stripe Session ID or Razorpay Payment ID) 
-- is unique for purchase transactions to prevent double crediting from webhook retries.
create unique index if not exists idx_wallet_transactions_purchase_reference_unique 
on public.wallet_transactions (reference_id) 
where type = 'purchase';
-- 