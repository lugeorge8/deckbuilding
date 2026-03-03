import { NextResponse } from 'next/server';

import { setAdminAuthed } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { passcode?: string } | null;
  const passcode = body?.passcode ?? '';

  const expected = process.env.ADMIN_PASSCODE ?? 'admin123';

  if (passcode !== expected) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  await setAdminAuthed();
  return NextResponse.json({ ok: true });
}
