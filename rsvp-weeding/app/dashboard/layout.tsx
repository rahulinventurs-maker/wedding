'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { href: '/dashboard',        label: 'Overview' },
  { href: '/dashboard/events', label: 'Events' },
];

function Header() {
  const router      = useRouter();
  const pathname    = usePathname();
  const logout      = useAuthStore((s) => s.logout);
  const loadSession = useAuthStore((s) => s.loadSession);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed,  setRefreshed]  = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshed(false);
    try {
      await loadSession();
      setRefreshed(true);
      setTimeout(() => setRefreshed(false), 2000);
    } finally {
      setRefreshing(false);
    }
  };

  // Derive a readable page title from the current path
  const pageTitle = (() => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname === '/dashboard/events/new') return 'New Event';
    if (pathname?.endsWith('/attendees')) return 'Attendees';
    if (pathname?.match(/\/dashboard\/events\/[^/]+$/)) return 'Event Detail';
    return 'Dashboard';
  })();

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-8 border-b border-border bg-surface">
      <p className="text-sm font-medium text-foreground">{pageTitle}</p>

      <div className="flex items-center gap-2">
        {/* Refresh session button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh session"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground hover:bg-border transition disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshed ? 'Refreshed' : refreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-error px-3 py-1.5 text-xs text-error hover:bg-error-light transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-surface min-h-screen px-4 py-8">

      <div className="mb-10 px-2">
        <p className="text-xs tracking-[0.25em] uppercase text-muted">Admin</p>
        <h2
          className="text-2xl font-semibold text-foreground leading-tight mt-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          RSVP
        </h2>
        <div className="divider-gold mt-3" />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary-light hover:text-primary transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const loadSession = useAuthStore((s) => s.loadSession);
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    loadSession().finally(() => setReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const token = accessToken ?? localStorage.getItem('access_token');
    if (!token) router.replace('/login');
  }, [ready, accessToken, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
