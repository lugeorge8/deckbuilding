import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const USER_KEY = 'admin';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ selectedDecks: [], owned: {}, cart: {} });
  }

  const [selRes, ownedRes, cartRes] = await Promise.all([
    supabase.from('user_selected_decks').select('deck_slug').eq('user_key', USER_KEY),
    supabase.from('user_owned_cards').select('card_key, owned_qty').eq('user_key', USER_KEY),
    supabase.from('user_cart_items').select('card_key, qty').eq('user_key', USER_KEY),
  ]);

  const selectedDecks = (selRes.data ?? []).map((r) => (r as { deck_slug: string }).deck_slug);

  const owned: Record<string, number> = {};
  for (const r of ownedRes.data ?? []) {
    const row = r as { card_key: string; owned_qty: number | null };
    owned[row.card_key] = Number(row.owned_qty ?? 0);
  }

  const cart: Record<string, number> = {};
  for (const r of cartRes.data ?? []) {
    const row = r as { card_key: string; qty: number | null };
    cart[row.card_key] = Number(row.qty ?? 0);
  }

  return NextResponse.json({ selectedDecks, owned, cart });
}
