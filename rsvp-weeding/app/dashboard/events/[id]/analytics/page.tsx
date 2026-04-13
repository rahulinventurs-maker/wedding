'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtGuests = (v: any) => [`${v ?? 0} guests`, ''] as [string, string];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtCount  = (v: any) => [`${v ?? 0} guests`, 'Count'] as [string, string];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtRsvps  = (v: any) => [`${v ?? 0} RSVPs`, ''] as [string, string];
import { analyticsApi, eventsApi } from '../../../../../lib/endpoints';

interface Analytics {
  total_rsvps:      number;
  confirmed:        number;
  declined:         number;
  maybe:            number;
  waitlist:         number;
  with_plus_one:    number;
  without_plus_one: number;
  dietary:          { label: string; count: number }[];
  timeline:         { date: string; count: number }[];
}

const COLORS = {
  confirmed: '#d4943a',
  declined:  '#c0392b',
  maybe:     '#7d7870',
  waitlist:  '#5a7d4e',
  plusOne:   '#d4943a',
  noPlusOne: '#e8e6e3',
};

const DIETARY_PALETTE = [
  '#d4943a', '#5a7d4e', '#e05472', '#7d7870',
  '#b87830', '#466440', '#c0392b', '#27241f',
];

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card-parchment p-5 flex flex-col gap-1">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-3xl font-semibold" style={{ color, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData]           = useState<Analytics | null>(null);
  const [eventTitle, setTitle]    = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.get(id),
      eventsApi.get(id),
    ]).then(([analyticsRes, eventRes]) => {
      setData(analyticsRes.data);
      setTitle(eventRes.data.title);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!data)   return <p className="text-sm text-muted">No data.</p>;

  const rsvpRate = data.total_rsvps > 0
    ? Math.round((data.confirmed / data.total_rsvps) * 100)
    : 0;

  const plusOneRate = data.confirmed > 0
    ? Math.round((data.with_plus_one / data.confirmed) * 100)
    : 0;

  const statusPieData = [
    { name: 'Confirmed', value: data.confirmed, color: COLORS.confirmed },
    { name: 'Declined',  value: data.declined,  color: COLORS.declined  },
    { name: 'Maybe',     value: data.maybe,      color: COLORS.maybe    },
    { name: 'Waitlist',  value: data.waitlist,   color: COLORS.waitlist  },
  ].filter((d) => d.value > 0);

  const plusOnePieData = [
    { name: 'Bringing +1',  value: data.with_plus_one,    color: COLORS.plusOne   },
    { name: 'Solo',         value: data.without_plus_one, color: COLORS.noPlusOne },
  ].filter((d) => d.value > 0);

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
        <span>Analytics</span>
      </nav>

      <p className="text-xs tracking-[0.25em] uppercase text-muted mb-1">Insights</p>
      <h1
        className="text-4xl font-medium text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Analytics
      </h1>
      <div className="divider-gold w-24 mt-3 mb-8" />

      {/* Stat pills */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatPill label="Total RSVPs"  value={data.total_rsvps} color="var(--foreground)" />
        <StatPill label="Confirmed"    value={data.confirmed}   color={COLORS.confirmed}  />
        <StatPill label="Declined"     value={data.declined}    color={COLORS.declined}   />
        <StatPill label="Maybe"        value={data.maybe}       color={COLORS.maybe}      />
        <StatPill label="Waitlist"     value={data.waitlist}    color={COLORS.waitlist}   />
      </div>

      {/* Rate summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-parchment p-5">
          <p className="text-xs text-muted mb-1">RSVP confirmation rate</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-semibold text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              {rsvpRate}%
            </p>
            <p className="text-xs text-muted mb-1">of responses are confirmed</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rsvpRate}%` }} />
          </div>
        </div>
        <div className="card-parchment p-5">
          <p className="text-xs text-muted mb-1">+1 rate (confirmed guests)</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-semibold text-secondary" style={{ fontFamily: 'var(--font-display)' }}>
              {plusOneRate}%
            </p>
            <p className="text-xs text-muted mb-1">are bringing a guest</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${plusOneRate}%` }} />
          </div>
        </div>
      </div>

      {/* Charts row 1 — RSVP status + +1 breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-6">

        {/* RSVP status pie */}
        <div className="card-parchment p-6">
          <p className="text-sm font-medium text-foreground mb-4">RSVP Status</p>
          {statusPieData.length === 0 ? (
            <p className="text-xs text-muted text-center py-10">No RSVPs yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                  formatter={fmtGuests}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* +1 pie */}
        <div className="card-parchment p-6">
          <p className="text-sm font-medium text-foreground mb-4">+1 Breakdown (confirmed)</p>
          {plusOnePieData.length === 0 || data.confirmed === 0 ? (
            <p className="text-xs text-muted text-center py-10">No confirmed guests yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={plusOnePieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {plusOnePieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                  formatter={fmtGuests}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart row 2 — dietary bar */}
      <div className="card-parchment p-6 mb-6">
        <p className="text-sm font-medium text-foreground mb-4">Dietary Preferences</p>
        {data.dietary.length === 0 ? (
          <p className="text-xs text-muted text-center py-10">No dietary preferences recorded</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dietary} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                formatter={fmtCount}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.dietary.map((_, i) => (
                  <Cell key={i} fill={DIETARY_PALETTE[i % DIETARY_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart row 3 — RSVPs over time */}
      <div className="card-parchment p-6">
        <p className="text-sm font-medium text-foreground mb-4">RSVPs Over Time</p>
        {data.timeline.length === 0 ? (
          <p className="text-xs text-muted text-center py-10">No RSVPs yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.timeline} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                formatter={fmtRsvps}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
