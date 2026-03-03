import Link from 'next/link';

import { AdminLoginForm } from './ui';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-lg px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            deckbuilding
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Admin login</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter the admin passcode to access collection + cart.
          </p>

          <div className="mt-6">
            <AdminLoginForm />
          </div>

          <div className="mt-8">
            <Link href="/" className="text-sm underline text-zinc-700">
              ← Back
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
