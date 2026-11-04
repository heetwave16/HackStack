'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, Mail, UserRound } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface AuthPanelProps {
  onUserChange: (user: User | null) => void;
}

export default function AuthPanel({ onUserChange }: AuthPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseBrowser) return;
    const supabase = supabaseBrowser;
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      onUserChange(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      onUserChange(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [onUserChange]);

  if (!supabaseBrowser) return null;
  const supabase = supabaseBrowser;

  async function sendMagicLink() {
    if (!email.trim()) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    });
    setBusy(false);
    setMessage(error ? error.message : 'Check your inbox for the sign-in link.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-line px-3 text-xs font-medium text-fg-2 transition-colors hover:border-line-strong hover:bg-surface-1 hover:text-fg"
      >
        {user ? <UserRound className="h-3.5 w-3.5 text-accent" /> : <LogIn className="h-3.5 w-3.5" />}
        {user ? 'Account' : 'Save your work'}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-line bg-surface-1 p-4 shadow-2xl">
          {user ? (
            <>
              <p className="text-sm font-medium text-fg">{user.email}</p>
              <p className="mt-1 text-xs leading-relaxed text-fg-3">Projects and generation history are linked to this account.</p>
              <button type="button" onClick={() => void signOut()} className="mt-4 inline-flex items-center gap-2 text-xs text-fg-2 hover:text-fg">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-fg">Sign in to keep projects</p>
              <p className="mt-1 text-xs leading-relaxed text-fg-3">We’ll email you a one-click sign-in link. No password to remember.</p>
              <div className="mt-3 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Mail className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-fg-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') void sendMagicLink(); }}
                    placeholder="you@example.com"
                    className="h-8 w-full rounded-md border border-line bg-surface-0 pl-8 pr-2 text-xs text-fg outline-none focus:border-accent"
                  />
                </div>
                <button type="button" disabled={busy || !email.trim()} onClick={() => void sendMagicLink()} className="rounded-md bg-accent px-3 text-xs font-semibold text-surface-0 disabled:opacity-50">
                  {busy ? 'Sending' : 'Email me'}
                </button>
              </div>
              {message && <p className="mt-3 text-xs leading-relaxed text-fg-3">{message}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
