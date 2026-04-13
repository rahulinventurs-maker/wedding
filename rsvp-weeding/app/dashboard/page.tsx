'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi } from '../../lib/endpoints';

interface EventSummary {
  id: string;
  title: string;
  date_time: string;
  location: string;
  confirmed_count: number;
  waitlist_count: number;
  is_active: boolean;
}

export default function DashboardPage() {
  const [events, setEvents]   = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.list()
      .then((res) => setEvents(res.data.results ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">

      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-muted mb-1">Dashboard</p>
        <h1
          className="text-4xl font-medium text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Your Events
        </h1>
        <div className="divider-gold w-24 mt-3" />
      </div>

      <div className="flex justify-end mb-6">
        <Link
          href="/dashboard/events/new"
          className="rounded-lg bg-primary hover:bg-primary-hover px-5 py-2.5 text-sm font-medium text-white transition"
        >
          + New Event
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <div className="card-parchment p-10 text-center">
          <p className="text-muted text-sm">No events yet.</p>
          <Link
            href="/dashboard/events/new"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="card-parchment flex items-center justify-between p-5 hover:border-primary transition"
            >
              <div>
                <h3 className="font-medium text-foreground">{event.title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(event.date_time).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })} &middot; {event.location}
                </p>
              </div>
              <div className="flex gap-6 text-center shrink-0">
                <div>
                  <p className="text-lg font-semibold text-primary">{event.confirmed_count}</p>
                  <p className="text-xs text-muted">Confirmed</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-secondary">{event.waitlist_count}</p>
                  <p className="text-xs text-muted">Waitlist</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
