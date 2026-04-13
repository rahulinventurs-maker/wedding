'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/endpoints';

type Role = 'admin' | 'participant';

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username:   '',
    email:      '',
    password:   '',
    confirm:    '',
    first_name: '',
    last_name:  '',
    role:       'admin' as Role,
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username:   form.username,
        email:      form.email,
        password:   form.password,
        first_name: form.first_name,
        last_name:  form.last_name,
        role:       form.role,
      });
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <p className="text-sm tracking-[0.3em] uppercase text-muted mb-2">
            Wedding Platform
          </p>
          <h1
            className="text-5xl font-medium text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Create Account
          </h1>
          <div className="divider-gold w-32 mx-auto mt-4" />
        </div>

        <div className="card-parchment p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="rounded-lg bg-(--error-light) border border-error px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">First name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={set('first_name')}
                  placeholder="Jane"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Last name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={set('last_name')}
                  placeholder="Smith"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Username <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={set('username')}
                placeholder="janesmith"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="jane@example.com"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Confirm password <span className="text-error">*</span>
              </label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="Repeat your password"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Account type <span className="text-error">*</span>
              </label>
              <select
                value={form.role}
                onChange={set('role')}
                className={inputClass}
              >
                <option value="admin">Admin — manage events and guests</option>
                <option value="participant">Participant — guest account</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 px-4 py-2.5 text-sm font-medium text-white transition cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
