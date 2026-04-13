'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '../../../../lib/endpoints';

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  location: string;
  plus_one_allowed: boolean;
  max_capacity: number | null;
  is_active: boolean;
  confirmed_count: number;
  declined_count: number;
  waitlist_count: number;
  is_full: boolean;
}

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="card-parchment p-6 text-center">
      <p className={`text-3xl font-semibold ${color}`} style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

export default function EventDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();

  const [event, setEvent]   = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<EventDetail>>({});
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    eventsApi.get(id)
      .then((res) => {
        setEvent(res.data);
        setForm(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await eventsApi.delete(id);
      router.push('/dashboard');
    } catch {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaveError('');
    try {
      const res = await eventsApi.update(id, {
        title:            form.title,
        description:      form.description,
        date_time:        form.date_time,
        location:         form.location,
        plus_one_allowed: form.plus_one_allowed,
        max_capacity:     form.max_capacity,
        is_active:        form.is_active,
      });
      setEvent(res.data);
      setForm(res.data);
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to save.';
      setSaveError(msg);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Event not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/event/${id}`;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-6 flex gap-2">
        <Link href="/dashboard" className="hover:text-primary transition">Dashboard</Link>
        <span>/</span>
        <span>{event.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-muted mb-1">
            {event.is_active ? 'Active' : 'Inactive'}
            {event.is_full && ' · Full'}
          </p>
          <h1
            className="text-4xl font-medium text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {event.title}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          <button
            onClick={() => { setEditing(!editing); setSaveError(''); }}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-border transition"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-error px-4 py-2 text-sm text-error hover:bg-(--error-light) transition disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
      <div className="divider-gold w-24 mb-8" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard value={event.confirmed_count} label="Confirmed" color="text-primary" />
        <StatCard value={event.declined_count}  label="Declined"  color="text-muted"   />
        <StatCard value={event.waitlist_count}  label="Waitlist"  color="text-secondary" />
      </div>

      {/* Capacity bar */}
      {event.max_capacity !== null && (
        <div className="card-parchment p-4 mb-6">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Capacity</span>
            <span>{event.confirmed_count} / {event.max_capacity}</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (event.confirmed_count / event.max_capacity) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Public link */}
      <div className="card-parchment p-4 mb-6 flex items-center gap-3">
        <span className="text-xs text-muted shrink-0">Public RSVP link</span>
        <span className="flex-1 text-xs font-mono truncate text-foreground">{publicUrl}</span>
        <button
          onClick={() => navigator.clipboard.writeText(publicUrl)}
          className="shrink-0 text-xs text-primary hover:underline"
        >
          Copy
        </button>
      </div>

      {/* Edit form / Detail view */}
      {editing ? (
        <div className="card-parchment p-8 space-y-5">
          {saveError && (
            <div className="rounded-lg bg-(--error-light) border border-error px-4 py-3 text-sm text-error">
              {saveError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input
              type="text"
              value={form.title ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.date_time ? form.date_time.slice(0, 16) : ''}
                onChange={(e) => setForm((f) => ({ ...f, date_time: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
              <input
                type="text"
                value={form.location ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Max Capacity</label>
              <input
                type="number"
                min="1"
                value={form.max_capacity ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_capacity: e.target.value ? parseInt(e.target.value, 10) : null,
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <div className="flex flex-col gap-2 pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.plus_one_allowed ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, plus_one_allowed: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                Allow +1
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                Active (accepting RSVPs)
              </label>
            </div>
          </div>

          <div className="divider-gold" />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setEditing(false); setForm(event); setSaveError(''); }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm text-foreground hover:bg-border transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-primary hover:bg-primary-hover px-6 py-2.5 text-sm font-medium text-white transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="card-parchment p-8 space-y-4">
          <DetailRow label="Date & Time">
            {new Date(event.date_time).toLocaleString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </DetailRow>
          <div className="divider-gold" />
          <DetailRow label="Location">{event.location}</DetailRow>
          {event.description && (
            <>
              <div className="divider-gold" />
              <DetailRow label="Description">{event.description}</DetailRow>
            </>
          )}
          <div className="divider-gold" />
          <DetailRow label="+1 Allowed">{event.plus_one_allowed ? 'Yes' : 'No'}</DetailRow>
          <div className="divider-gold" />
          <DetailRow label="Max Capacity">
            {event.max_capacity !== null ? String(event.max_capacity) : 'Unlimited'}
          </DetailRow>
        </div>
      )}

      {/* Bottom CTAs */}
      <div className="mt-6 flex justify-end gap-3">
        <Link
          href={`/dashboard/events/${id}/analytics`}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-border transition"
        >
          Analytics
        </Link>
        <Link
          href={`/dashboard/events/${id}/attendees`}
          className="rounded-lg bg-secondary hover:bg-secondary-hover px-5 py-2.5 text-sm font-medium text-white transition"
        >
          View Attendees →
        </Link>
      </div>

    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-32 shrink-0 text-xs text-muted pt-0.5">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}
