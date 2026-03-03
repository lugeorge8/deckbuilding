import { cookies } from 'next/headers';

const COOKIE = 'deckbuilding_admin';

export async function isAdminAuthed() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE)?.value === '1';
}

export async function setAdminAuthed() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminAuthed() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}
