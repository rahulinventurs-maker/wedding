'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { attendeesApi, eventsApi } from '../../../../../lib/endpoints';

interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'yes' | 'no' | 'maybe';
  dietary_preferences: string | null;
  plus_one_name: string | null;
  created_at: string;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  position: number;
  dietary_preferences: string | null;
  plus_one_name: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = { yes: 'Confirmed', no: 'Declined', maybe: 'Maybe' };
const STATUS_COLORS: Record<string, string> = {
  yes:   'bg-success-light text-success',
  no:    'bg-(--error-light) text-error',
  maybe: 'bg-warning-light text-warning',
};

export default function AttendeesPage() {
  const { id } = useParams<{ id: string }>();

  const [eventTitle, setEventTitle]     = useState('');
  const [attendees, setAttendees]       = useState<Attendee[]>([]);
  const [waitlist, setWaitlist]         = useState<WaitlistEntry[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<'attendees' | 'waitlist'>('attendees');

  const PAGE_SIZE = 20;

  useEffect(() => {
    eventsApi.get(id).then((res) => setEventTitle(res.data.title));
  }, [id]);

  const fetchAttendees = useCallback(() => {
    setLoading(true);
    attendeesApi
      .list(id, {
        page,
        ...(search       ? { search }             : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      .then((res) => {
        setAttendees(res.data.results ?? []);
        setTotal(res.data.count ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id, page, search, statusFilter]);

  const fetchWaitlist = useCallback(() => {
    setLoading(true);
    attendeesApi
      .waitlist(id, page)
      .then((res) => {
        setWaitlist(res.data.results ?? []);
        setTotal(res.data.count ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id, page]);

  useEffect(() => {
    if (tab === 'attendees') fetchAttendees();
    else fetchWaitlist();
  }, [tab, fetchAttendees, fetchWaitlist]);

  // Reset to page 1 when filters or tab change
  useEffect(() => { setPage(1); }, [search, statusFilter, tab]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <nav className="text-xs text-muted mb-6 flex gap-2">
        <Link href="/dashboard" className="hover:text-primary transition">Dashboard</Link>
        <span>/</span>
        <Link href={`/dashboard/events/${id}`} className="hover:text-primary transition">
          {eventTitle || 'Event'}
        </Link>
        <span>/</span>
        <span>Attendees</span>
      </nav>

      <p className="text-xs tracking-[0.25em] uppercase text-muted mb-1">Guest list</p>
      <h1
        className="text-4xl font-medium text-foreground mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Attendees
      </h1>
      <div className="divider-gold w-24 mt-3 mb-8" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['attendees', 'waitlist'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize transition border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters — only on attendees tab */}
      {tab === 'attendees' && (
        <div className="flex gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-xs rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          >
            <option value="">All statuses</option>
            <option value="yes">Confirmed</option>
            <option value="no">Declined</option>
            <option value="maybe">Maybe</option>
          </select>
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-muted mb-3">{total} {tab === 'attendees' ? 'guest(s)' : 'on waitlist'}</p>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-muted py-10 text-center">Loading…</p>
      ) : tab === 'attendees' ? (
        attendees.length === 0 ? (
          <div className="card-parchment p-10 text-center text-muted text-sm">
            No guests found.
          </div>
        ) : (
          <div className="card-parchment overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">+1</th>
                  <th className="text-left px-5 py-3">Dietary</th>
                  <th className="text-left px-5 py-3">RSVP'd</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? 'bg-transparent' : 'bg-background/50'
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{a.name}</td>
                    <td className="px-5 py-3 text-muted">{a.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">{a.plus_one_name ?? '—'}</td>
                    <td className="px-5 py-3 text-muted">{a.dietary_preferences ?? '—'}</td>
                    <td className="px-5 py-3 text-muted">
                      {new Date(a.created_at).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        waitlist.length === 0 ? (
          <div className="card-parchment p-10 text-center text-muted text-sm">
            Waitlist is empty.
          </div>
        ) : (
          <div className="card-parchment overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="text-left px-5 py-3">#</th>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">+1</th>
                  <th className="text-left px-5 py-3">Dietary</th>
                  <th className="text-left px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w, i) => (
                  <tr
                    key={w.id}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? 'bg-transparent' : 'bg-background/50'
                    }`}
                  >
                    <td className="px-5 py-3 text-muted">{w.position}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{w.name}</td>
                    <td className="px-5 py-3 text-muted">{w.email}</td>
                    <td className="px-5 py-3 text-muted">{w.plus_one_name ?? '—'}</td>
                    <td className="px-5 py-3 text-muted">{w.dietary_preferences ?? '—'}</td>
                    <td className="px-5 py-3 text-muted">
                      {new Date(w.created_at).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-border transition disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-border transition disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
}
