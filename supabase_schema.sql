-- ══════════════════════════════════════════════════
-- АКИ · Sky Hearts Tracker — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ══════════════════════════════════════════════════

-- Orders table
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  code_phrase     text,
  deadline        date,
  payment_method  text,
  with_guarantor  boolean default false,
  notes           text default '',
  created_at      timestamptz default now()
);

-- Friends / recipients table
create table if not exists friends (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  nick           text not null,
  hearts_target  integer default 0,
  hearts_gifted  integer default 0,
  notes          text default '',
  created_at     timestamptz default now()
);

-- History of gifting events per friend
create table if not exists history (
  id          uuid primary key default gen_random_uuid(),
  friend_id   uuid not null references friends(id) on delete cascade,
  amount      integer not null check (amount > 0),
  note        text default '',
  created_at  timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_friends_order_id  on friends(order_id);
create index if not exists idx_history_friend_id on history(friend_id);
create index if not exists idx_history_created   on history(created_at desc);

-- Row Level Security (optional — service key bypasses this)
alter table orders  enable row level security;
alter table friends enable row level security;
alter table history enable row level security;

-- Allow all via service key (add proper policies if you add user auth later)
create policy "service_all_orders"  on orders  for all using (true);
create policy "service_all_friends" on friends for all using (true);
create policy "service_all_history" on history for all using (true);
