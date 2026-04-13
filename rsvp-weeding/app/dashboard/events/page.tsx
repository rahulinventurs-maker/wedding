'use client';

// This route just renders the same events list as the dashboard overview.
// Redirect to /dashboard so we don't duplicate state logic.
import { redirect } from 'next/navigation';

export default function EventsPage() {
  redirect('/dashboard');
}
