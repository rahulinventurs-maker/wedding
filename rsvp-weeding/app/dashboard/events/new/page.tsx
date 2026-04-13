'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '../../../../lib/endpoints';

interface FormState {
  title: string;
  description: string;
  date_time: string;
  location: string;
  plus_one_allowed: boolean;
  max_capacity: string;
}

export default function NewEventPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    date_time: '',
    location: '',
    plus_one_allowed: false,
    max_capacity: '',
  });
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.date_time || !form.location.trim()) {
      setError('Title, date/time, and location are required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title:            form.title.trim(),
        description:      form.description.trim() || null,
        date_time:        form.date_time,
        location:         form.location.trim(),
        plus_one_allowed: form.plus_one_allowed,
        max_capacity:     form.max_capacity ? parseInt(form.max_capacity, 10) : null,
      };

      const res = await eventsApi.create(payload);
      router.push(`/dashboard/events/${res.data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to create event.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-6 flex gap-2">
        <Link href="/dashboard" className="hover:text-primary transition">Dashboard</Link>
        <span>/</span>
        <span>New Event</span>
      </nav>

      {/* Header */}
      <p className="text-xs tracking-[0.25em] uppercase text-muted mb-1">Create</p>
      <h1
        className="text-4xl font-medium text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        New Event
      </h1>
      <div className="divider-gold w-24 mt-3 mb-8" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-parchment p-8 space-y-6">

        {error && (
          <div className="rounded-lg bg-(--error-light) border border-error px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="title">
            Event Title <span className="text-error">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Smith & Jones Wedding"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="A few words about the event…"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
          />
        </div>

        {/* Date/time + Location — 2-col grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="date_time">
              Date &amp; Time <span className="text-error">*</span>
            </label>
            <input
              id="date_time"
              name="date_time"
              type="datetime-local"
              value={form.date_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="location">
              Location <span className="text-error">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={form.location}
              onChange={handleChange}
              placeholder="Venue name or address"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Max capacity */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="max_capacity">
            Max Capacity <span className="text-muted font-normal">(leave blank for unlimited)</span>
          </label>
          <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            min="1"
            value={form.max_capacity}
            onChange={handleChange}
            placeholder="e.g. 120"
            className="w-40 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>

        {/* +1 toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="plus_one_allowed"
            checked={form.plus_one_allowed}
            onChange={handleChange}
            className="w-4 h-4 accent-primary rounded"
          />
          <span className="text-sm text-foreground">Allow guests to bring a +1</span>
        </label>

        <div className="divider-gold" />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-5 py-2.5 text-sm text-foreground hover:bg-border transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 px-6 py-2.5 text-sm font-medium text-white transition"
          >
            {saving ? 'Creating…' : 'Create Event'}
          </button>
        </div>

      </form>
    </div>
  );
}
