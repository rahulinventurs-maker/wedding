'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '../../../lib/endpoints';

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date_time: string;
  location: string;
  plus_one_allowed: boolean;
  is_active: boolean;
  is_full: boolean;
}

interface FormState {
  name: string;
  email: string;
  status: 'yes' | 'no' | 'maybe';
  dietary_preferences: string;
  plus_one_name: string;
}

// Backend returns { status: 'waitlist' | 'yes' | 'no' | 'maybe', data: {...} }
type SubmitResult =
  | { status: 'waitlist'; data: { position: number; name: string } }
  | { status: 'yes' | 'no' | 'maybe'; data: { qr_code_url: string | null; name: string; status: string } };

export default function PublicEventPage() {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent]       = useState<PublicEvent | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    status: 'yes',
    dietary_preferences: '',
    plus_one_name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [result, setResult]         = useState<SubmitResult | null>(null);

  useEffect(() => {
    publicApi.getEvent(id)
      .then((res) => setEvent(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name:                form.name.trim(),
        email:               form.email.trim(),
        status:              form.status,
        dietary_preferences: form.dietary_preferences.trim() || null,
        plus_one_name:       form.plus_one_name.trim() || null,
      };

      const res = await publicApi.submitRsvp(id, payload);
      setResult(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted text-sm">Loading event…</p>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p
            className="text-3xl font-medium text-foreground mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Event not found
          </p>
          <p className="text-sm text-muted">This invitation link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (result) {
    if (result.status === 'waitlist') {
      const wl = result.data;
      return (
        <PageShell event={event}>
          <div className="card-parchment p-10 text-center space-y-4">
            <p className="text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              You&rsquo;re on the waitlist
            </p>
            <div className="divider-gold w-24 mx-auto" />
            <p className="text-sm text-muted">
              Hi <strong>{wl.name}</strong>, this event is currently at capacity.
              You are <strong>#{wl.position}</strong> on the waitlist.
              We&rsquo;ll be in touch if a spot opens up.
            </p>
          </div>
        </PageShell>
      );
    }

    const rsvp = result.data;
    return (
      <PageShell event={event}>
        <div className="card-parchment p-10 text-center space-y-4">
          {rsvp.status === 'yes' ? (
            <>
              <p
                className="text-4xl font-medium text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                See you there!
              </p>
              <div className="divider-gold w-24 mx-auto" />
              <p className="text-sm text-muted">
                Your RSVP is confirmed, <strong>{rsvp.name}</strong>.
                Please save your QR code — you&rsquo;ll need it at the door.
              </p>
              {rsvp.qr_code_url && (
                <div className="flex justify-center pt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rsvp.qr_code_url}
                    alt="Your entry QR code"
                    className="w-48 h-48 rounded-xl border border-border shadow-sm"
                  />
                </div>
              )}
              <p className="text-xs text-muted pt-2">Screenshot or save this QR code for entry.</p>
            </>
          ) : (
            <>
              <p
                className="text-4xl font-medium text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Response recorded
              </p>
              <div className="divider-gold w-24 mx-auto" />
              <p className="text-sm text-muted">
                Thank you, <strong>{rsvp.name}</strong>. We&rsquo;ve noted your response.
              </p>
            </>
          )}
        </div>
      </PageShell>
    );
  }

  // ── RSVP form ─────────────────────────────────────────────────────────────

  return (
    <PageShell event={event}>
      {!event.is_active ? (
        <div className="card-parchment p-10 text-center text-muted text-sm">
          This event is no longer accepting RSVPs.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-parchment p-8 space-y-6">

          {error && (
            <div className="rounded-lg bg-error-light border border-error px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {event.is_full && (
            <div className="rounded-lg bg-warning-light border border-warning px-4 py-3 text-sm text-warning">
              This event is at capacity — submitting will add you to the waitlist.
            </div>
          )}

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="name">
                Your Name <span className="text-error">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="email">
                Email <span className="text-error">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          {/* RSVP status */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Will you attend?</p>
            <div className="flex gap-3">
              {(['yes', 'no', 'maybe'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={form.status === s}
                    onChange={handleChange}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground capitalize">
                    {s === 'yes' ? 'Yes, I&apos;ll be there' : s === 'no' ? "Can't make it" : 'Maybe'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* +1 */}
          {event.plus_one_allowed && form.status === 'yes' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="plus_one_name">
                Guest name <span className="text-muted font-normal">(+1, optional)</span>
              </label>
              <input
                id="plus_one_name"
                name="plus_one_name"
                type="text"
                value={form.plus_one_name}
                onChange={handleChange}
                placeholder="Your guest's full name"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          )}

          {/* Dietary */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="dietary_preferences">
              Dietary preferences <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="dietary_preferences"
              name="dietary_preferences"
              type="text"
              value={form.dietary_preferences}
              onChange={handleChange}
              placeholder="e.g. vegetarian, nut allergy…"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
          </div>

          <div className="divider-gold" />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 px-8 py-2.5 text-sm font-medium text-white transition"
            >
              {submitting ? 'Sending…' : 'Send RSVP'}
            </button>
          </div>

        </form>
      )}
    </PageShell>
  );
}

// Shared page wrapper with event hero header
function PageShell({ event, children }: { event: PublicEvent; children: React.ReactNode }) {
  const dateStr = new Date(event.date_time).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-surface border-b border-border py-16 px-4 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-muted mb-3">You&rsquo;re invited</p>
        <h1
          className="text-5xl md:text-6xl font-medium text-foreground mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {event.title}
        </h1>
        <div className="divider-gold w-32 mx-auto mb-5" />
        <p className="text-sm text-muted">{dateStr}</p>
        <p className="text-sm text-foreground mt-1">{event.location}</p>
        {event.description && (
          <p className="mt-4 text-sm text-muted max-w-lg mx-auto">{event.description}</p>
        )}
      </div>

      {/* Form / result area */}
      <div className="max-w-xl mx-auto px-4 py-10">
        {children}
      </div>
    </div>
  );
}
