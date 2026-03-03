import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const USER_KEY = 'admin';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });

  const body = (await req.json().catch(() => null)) as { selectedDecks?: string[] } | null;
  const selectedDecks = body?.selectedDecks ?? [];

  // Replace selection
  await supabase.from('user_selected_decks').delete().eq('user_key', USER_KEY);
  if (selectedDecks.length) {
    await supabase.from('user_selected_decks').insert(
      selectedDecks.map((deck_slug) => ({ user_key: USER_KEY, deck_slug }))
    );
  }

  return NextResponse.json({ ok: true });
}
