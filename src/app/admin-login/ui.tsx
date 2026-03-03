'use client';

import { useState } from 'react';

export function AdminLoginForm() {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next =
    typeof window === 'undefined'
      ? '/collection'
      : new URLSearchParams(window.location.search).get('next') || '/collection';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });

    const text = await res.text();
    const json = text ? (JSON.parse(text) as { error?: string }) : null;

    if (!res.ok) {
      setError(json?.error ?? 'Login failed');
      setLoading(false);
      return;
    }

    window.location.href = next;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Passcode
        </label>
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          type="password"
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-500"
          required
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        disabled={loading}
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
