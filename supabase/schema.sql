-- deckbuilding persistent collection/cart

create table if not exists public.user_selected_decks (
  id bigserial primary key,
  user_key text not null,
  deck_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_key, deck_slug)
);

create table if not exists public.user_owned_cards (
  id bigserial primary key,
  user_key text not null,
  card_key text not null,
  owned_qty int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_key, card_key)
);

create table if not exists public.user_cart_items (
  id bigserial primary key,
  user_key text not null,
  card_key text not null,
  qty int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_key, card_key)
);
