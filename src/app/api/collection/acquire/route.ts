import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const USER_KEY = 'admin';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });

  const body = (await req.json().catch(() => null)) as
    | { cardKey?: string; qty?: number }
    | null;

  const cardKey = body?.cardKey;
  const qty = Math.max(0, Math.floor(Number(body?.qty ?? 0)));

  if (!cardKey || qty <= 0) {
    return NextResponse.json({ error: 'Missing cardKey/qty' }, { status: 400 });
  }

  // Read current owned
  const ownedRes = await supabase
    .from('user_owned_cards')
    .select('owned_qty')
    .eq('user_key', USER_KEY)
    .eq('card_key', cardKey)
    .maybeSingle();

  const ownedQty = Number((ownedRes.data as { owned_qty?: number | null } | null)?.owned_qty ?? 0);
  const ownedNext = ownedQty + qty;

  await supabase
    .from('user_owned_cards')
    .upsert({ user_key: USER_KEY, card_key: cardKey, owned_qty: ownedNext }, { onConflict: 'user_key,card_key' });

  // Clear cart item
  await supabase
    .from('user_cart_items')
    .upsert({ user_key: USER_KEY, card_key: cardKey, qty: 0 }, { onConflict: 'user_key,card_key' });

  return NextResponse.json({ ok: true });
}
