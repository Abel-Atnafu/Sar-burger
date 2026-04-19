-- ============================================================
-- SAR Burger — Supabase schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('burger','sandwich','drink')),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  image_url text default '',
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  items text default '',
  price numeric(10,2) not null default 0,
  available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists hours (
  day int primary key check (day between 0 and 6),
  open_time time not null default '10:00',
  close_time time not null default '23:00',
  closed boolean not null default false
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text default '',
  item_summary text default '',
  total numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null default ''
);

-- Public view of settings that hides the password hash.
create or replace view public_settings as
  select key, value from settings where key <> 'admin_password_hash';

-- ============================================================
-- Row Level Security
-- ============================================================

alter table menu_items enable row level security;
alter table combos      enable row level security;
alter table hours       enable row level security;
alter table orders      enable row level security;
alter table settings    enable row level security;

-- Public read: menu, combos, hours.
drop policy if exists "public read menu" on menu_items;
create policy "public read menu" on menu_items for select using (true);

drop policy if exists "public read combos" on combos;
create policy "public read combos" on combos for select using (true);

drop policy if exists "public read hours" on hours;
create policy "public read hours" on hours for select using (true);

-- Public read settings EXCEPT the password hash row.
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings
  for select using (key <> 'admin_password_hash');

-- No direct public access to orders; RPCs handle it.
-- No direct public INSERT/UPDATE/DELETE on any table.
-- All writes go through SECURITY DEFINER functions below.

-- ============================================================
-- Realtime — publish relevant tables for live customer updates
-- ============================================================

do $$
begin
  begin
    alter publication supabase_realtime add table menu_items;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table combos;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table hours;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table settings;
  exception when duplicate_object then null; end;
end $$;

-- ============================================================
-- Password helpers (bcrypt via pgcrypto)
-- ============================================================

create or replace function _check_admin_password(p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
begin
  select value into stored_hash from settings where key = 'admin_password_hash';
  if stored_hash is null then
    raise exception 'admin password not initialized';
  end if;
  if crypt(p_password, stored_hash) <> stored_hash then
    raise exception 'invalid admin password';
  end if;
end;
$$;

revoke all on function _check_admin_password(text) from public;

-- ============================================================
-- Admin RPCs (all gated by password)
-- ============================================================

create or replace function admin_login(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  return true;
end;
$$;

create or replace function admin_upsert_menu_item(p_password text, p_item jsonb)
returns menu_items
language plpgsql
security definer
set search_path = public
as $$
declare
  result menu_items;
begin
  perform _check_admin_password(p_password);
  if (p_item->>'id') is not null and (p_item->>'id') <> '' then
    update menu_items set
      category    = coalesce(p_item->>'category', category),
      name        = coalesce(p_item->>'name', name),
      description = coalesce(p_item->>'description', description),
      price       = coalesce((p_item->>'price')::numeric, price),
      image_url   = coalesce(p_item->>'image_url', image_url),
      available   = coalesce((p_item->>'available')::boolean, available),
      sort_order  = coalesce((p_item->>'sort_order')::int, sort_order)
    where id = (p_item->>'id')::uuid
    returning * into result;
  else
    insert into menu_items (category, name, description, price, image_url, available, sort_order)
    values (
      p_item->>'category',
      p_item->>'name',
      coalesce(p_item->>'description',''),
      coalesce((p_item->>'price')::numeric, 0),
      coalesce(p_item->>'image_url',''),
      coalesce((p_item->>'available')::boolean, true),
      coalesce((p_item->>'sort_order')::int, 0)
    )
    returning * into result;
  end if;
  return result;
end;
$$;

create or replace function admin_delete_menu_item(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  delete from menu_items where id = p_id;
end;
$$;

create or replace function admin_upsert_combo(p_password text, p_combo jsonb)
returns combos
language plpgsql
security definer
set search_path = public
as $$
declare
  result combos;
begin
  perform _check_admin_password(p_password);
  if (p_combo->>'id') is not null and (p_combo->>'id') <> '' then
    update combos set
      name        = coalesce(p_combo->>'name', name),
      description = coalesce(p_combo->>'description', description),
      items       = coalesce(p_combo->>'items', items),
      price       = coalesce((p_combo->>'price')::numeric, price),
      available   = coalesce((p_combo->>'available')::boolean, available),
      sort_order  = coalesce((p_combo->>'sort_order')::int, sort_order)
    where id = (p_combo->>'id')::uuid
    returning * into result;
  else
    insert into combos (name, description, items, price, available, sort_order)
    values (
      p_combo->>'name',
      coalesce(p_combo->>'description',''),
      coalesce(p_combo->>'items',''),
      coalesce((p_combo->>'price')::numeric, 0),
      coalesce((p_combo->>'available')::boolean, true),
      coalesce((p_combo->>'sort_order')::int, 0)
    )
    returning * into result;
  end if;
  return result;
end;
$$;

create or replace function admin_delete_combo(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  delete from combos where id = p_id;
end;
$$;

create or replace function admin_upsert_hours(
  p_password text,
  p_day int,
  p_open time,
  p_close time,
  p_closed boolean
)
returns hours
language plpgsql
security definer
set search_path = public
as $$
declare
  result hours;
begin
  perform _check_admin_password(p_password);
  insert into hours (day, open_time, close_time, closed)
  values (p_day, p_open, p_close, p_closed)
  on conflict (day) do update set
    open_time  = excluded.open_time,
    close_time = excluded.close_time,
    closed     = excluded.closed
  returning * into result;
  return result;
end;
$$;

create or replace function admin_list_orders(p_password text)
returns setof orders
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  return query select * from orders order by created_at desc;
end;
$$;

create or replace function admin_upsert_order(p_password text, p_order jsonb)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  result orders;
begin
  perform _check_admin_password(p_password);
  if (p_order->>'id') is not null and (p_order->>'id') <> '' then
    update orders set
      customer_name = coalesce(p_order->>'customer_name', customer_name),
      item_summary  = coalesce(p_order->>'item_summary', item_summary),
      total         = coalesce((p_order->>'total')::numeric, total),
      status        = coalesce(p_order->>'status', status),
      note          = coalesce(p_order->>'note', note)
    where id = (p_order->>'id')::uuid
    returning * into result;
  else
    insert into orders (customer_name, item_summary, total, status, note)
    values (
      coalesce(p_order->>'customer_name',''),
      coalesce(p_order->>'item_summary',''),
      coalesce((p_order->>'total')::numeric, 0),
      coalesce(p_order->>'status','pending'),
      coalesce(p_order->>'note','')
    )
    returning * into result;
  end if;
  return result;
end;
$$;

create or replace function admin_delete_order(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  delete from orders where id = p_id;
end;
$$;

create or replace function admin_clear_orders(p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  delete from orders;
end;
$$;

create or replace function admin_update_setting(p_password text, p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  if p_key = 'admin_password_hash' then
    raise exception 'use admin_change_password to change the password';
  end if;
  insert into settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;
end;
$$;

create or replace function admin_change_password(p_password text, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform _check_admin_password(p_password);
  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'new password must be at least 6 characters';
  end if;
  update settings
     set value = crypt(p_new_password, gen_salt('bf'))
   where key = 'admin_password_hash';
end;
$$;

-- Lock down direct execution; expose only to anon/authenticated.
grant execute on function
  admin_login(text),
  admin_upsert_menu_item(text, jsonb),
  admin_delete_menu_item(text, uuid),
  admin_upsert_combo(text, jsonb),
  admin_delete_combo(text, uuid),
  admin_upsert_hours(text, int, time, time, boolean),
  admin_list_orders(text),
  admin_upsert_order(text, jsonb),
  admin_delete_order(text, uuid),
  admin_clear_orders(text),
  admin_update_setting(text, text, text),
  admin_change_password(text, text)
to anon, authenticated;

-- ============================================================
-- Seed data (only if empty)
-- ============================================================

insert into settings (key, value) values
  ('restaurant_name', 'SAR Burger'),
  ('tagline', 'Smash-grilled burgers, Ethiopian soul.'),
  ('phone', '251000000000'),
  ('address', 'Addis Ababa, Ethiopia'),
  ('maps_embed', '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15762.88!2d38.7578!3d9.0084!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMDAnMzAuMiJOIDM4wrA0NSczOC4wIkU!5e0!3m2!1sen!2set!4v1700000000" width="100%" height="320" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'),
  ('admin_password_hash', crypt('sarAdmin2025', gen_salt('bf')))
on conflict (key) do nothing;

insert into hours (day, open_time, close_time, closed) values
  (0, '10:00', '23:00', false),
  (1, '10:00', '23:00', false),
  (2, '10:00', '23:00', false),
  (3, '10:00', '23:00', false),
  (4, '10:00', '23:00', false),
  (5, '10:00', '23:00', false),
  (6, '10:00', '23:00', false)
on conflict (day) do nothing;

insert into menu_items (category, name, description, price, sort_order)
select * from (values
  ('burger',   'Classic SAR Burger',     'Beef patty, cheddar, lettuce, tomato, special sauce.', 320, 1),
  ('burger',   'Double Smash',           'Two smashed patties, caramelized onion, pickles.',     420, 2),
  ('burger',   'Spicy Chicken Burger',   'Crispy chicken, jalapeño mayo, slaw.',                  310, 3),
  ('sandwich', 'Grilled Chicken Club',   'Chicken, bacon, tomato, lettuce, toasted bun.',         280, 1),
  ('sandwich', 'Veggie Delight',         'Grilled veg, hummus, cheese, toasted.',                 220, 2),
  ('drink',    'Fresh Lemonade',         'House-made, lightly sweet.',                             90, 1),
  ('drink',    'Iced Coffee',            'Ethiopian single-origin, cold-brewed.',                 110, 2)
) as v(category, name, description, price, sort_order)
where not exists (select 1 from menu_items);

insert into combos (name, description, items, price, sort_order)
select * from (values
  ('Classic Combo', 'Our signature — burger + fries + drink.', 'Classic SAR Burger, Fries, Fresh Lemonade', 450, 1)
) as v(name, description, items, price, sort_order)
where not exists (select 1 from combos);
