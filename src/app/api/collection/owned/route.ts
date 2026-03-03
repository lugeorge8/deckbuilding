import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const USER_KEY = 'admin';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });

  const body = (await req.json().catch(() => null)) as
    | { cardKey?: string; ownedQty?: number }
    | null;

  const cardKey = body?.cardKey;
  const ownedQty = Math.max(0, Math.floor(Number(body?.ownedQty ?? 0)));

  if (!cardKey) return NextResponse.json({ error: 'Missing cardKey' }, { status: 400 });

  await supabase
    .from('user_owned_cards')
    .upsert({ user_key: USER_KEY, card_key: cardKey, owned_qty: ownedQty }, { onConflict: 'user_key,card_key' });

  return NextResponse.json({ ok: true });
}
