-- ─── Billing Schema ───────────────────────────────────────────────────────────
-- One billing_account per organiser user (super_admin / event_manager).
-- Prepaid wallet: recharge via Razorpay, monthly ₹199/user subscription deducted.

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.billing_accounts (
  id               uuid         primary key default gen_random_uuid(),
  user_id          uuid         not null unique references auth.users(id) on delete cascade,
  balance          numeric(12,2) not null default 0 check (balance >= 0),
  total_credited   numeric(12,2) not null default 0,
  total_debited    numeric(12,2) not null default 0,
  plan             text         not null default 'free_trial' check (plan in ('free_trial','pro')),
  trial_events_used int         not null default 0,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now()
);

create table if not exists public.billing_transactions (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references auth.users(id) on delete cascade,
  type         text         not null check (type in ('credit','debit')),
  category     text         not null check (category in ('topup','subscription','adjustment','refund')),
  amount       numeric(12,2) not null check (amount > 0),
  balance_after numeric(12,2) not null,
  description  text         not null,
  reference_id text,
  created_at   timestamptz  not null default now()
);

create index if not exists billing_transactions_user_created
  on public.billing_transactions(user_id, created_at desc);

-- ── Auto-create billing account on new user ───────────────────────────────────

create or replace function public.handle_new_user_billing()
returns trigger language plpgsql security definer as $$
begin
  insert into public.billing_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_billing on auth.users;
create trigger on_auth_user_created_billing
  after insert on auth.users
  for each row execute function public.handle_new_user_billing();

-- ── RPC: credit_wallet ────────────────────────────────────────────────────────

create or replace function public.credit_wallet(
  _user_id     uuid,
  _amount      numeric,
  _category    text,
  _description text,
  _reference_id text default null
)
returns numeric language plpgsql security definer as $$
declare
  _new_balance numeric;
begin
  -- Upsert account in case trigger didn't run yet
  insert into public.billing_accounts (user_id)
  values (_user_id)
  on conflict (user_id) do nothing;

  update public.billing_accounts
  set
    balance        = balance + _amount,
    total_credited = total_credited + _amount,
    updated_at     = now()
  where user_id = _user_id
  returning balance into _new_balance;

  insert into public.billing_transactions
    (user_id, type, category, amount, balance_after, description, reference_id)
  values
    (_user_id, 'credit', _category, _amount, _new_balance, _description, _reference_id);

  return _new_balance;
end;
$$;

-- ── RPC: debit_wallet ─────────────────────────────────────────────────────────
-- Returns -1 if insufficient balance, otherwise returns new balance.

create or replace function public.debit_wallet(
  _user_id     uuid,
  _amount      numeric,
  _category    text,
  _description text,
  _reference_id text default null
)
returns numeric language plpgsql security definer as $$
declare
  _new_balance numeric;
begin
  update public.billing_accounts
  set
    balance      = balance - _amount,
    total_debited = total_debited + _amount,
    updated_at   = now()
  where user_id = _user_id
    and balance >= _amount
  returning balance into _new_balance;

  if _new_balance is null then
    return -1;
  end if;

  insert into public.billing_transactions
    (user_id, type, category, amount, balance_after, description, reference_id)
  values
    (_user_id, 'debit', _category, _amount, _new_balance, _description, _reference_id);

  return _new_balance;
end;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.billing_accounts     enable row level security;
alter table public.billing_transactions enable row level security;

-- Users see only their own account
create policy "users_own_billing_account"
  on public.billing_accounts for all
  using (user_id = auth.uid());

-- Users see only their own transactions
create policy "users_own_billing_transactions"
  on public.billing_transactions for all
  using (user_id = auth.uid());

-- Platform admins see everything
create policy "platform_admin_billing_accounts"
  on public.billing_accounts for all
  using (public.is_platform_admin(auth.uid()));

create policy "platform_admin_billing_transactions"
  on public.billing_transactions for all
  using (public.is_platform_admin(auth.uid()));

-- ── Backfill existing users ───────────────────────────────────────────────────

insert into public.billing_accounts (user_id)
select id from auth.users
on conflict (user_id) do nothing;
