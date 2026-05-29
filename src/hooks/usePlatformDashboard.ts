import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';

export interface PlatformSummary {
  totalEvents: number;
  publishedEvents: number;
  totalRegistrations: number;
  recentRegistrations: number;
  totalUsers: number;
  totalCheckIns: number;
  todayCheckIns: number;
  avgAttendanceRate: number;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  start_date: string;
  city: string | null;
  registrations: number;
  checkIns: number;
  attendanceRate: number;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  type: 'event_created' | 'registration' | 'check_in';
  detail: string;
  timestamp: string;
}

export interface PlatformDashboardData {
  summary: PlatformSummary;
  events: EventRow[];
  activityFeed: ActivityItem[];
}

const EMPTY: PlatformDashboardData = {
  summary: {
    totalEvents: 0, publishedEvents: 0,
    totalRegistrations: 0, recentRegistrations: 0,
    totalUsers: 0, totalCheckIns: 0, todayCheckIns: 0,
    avgAttendanceRate: 0,
  },
  events: [],
  activityFeed: [],
};

export function usePlatformDashboard() {
  const [data, setData] = useState<PlatformDashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const todayStart = startOfDay(new Date()).toISOString();

      const [eventsRes, registrationsRes, checkInsRes] = await Promise.all([
        supabase.from('events').select('id, title, slug, status, start_date, city, created_at'),
        supabase.from('registrations').select('id, event_id, user_id, status, created_at, full_name, email'),
        supabase.from('check_ins').select('id, event_id, check_in_time'),
      ]);

      if (signal?.cancelled) return;

      const events = eventsRes.data ?? [];
      const registrations = registrationsRes.data ?? [];
      const checkIns = checkInsRes.data ?? [];

      const uniqueUsers = new Set(registrations.map(r => r.user_id ?? r.email)).size;
      const recentRegistrations = registrations.filter(r => r.created_at >= sevenDaysAgo).length;
      const todayCheckIns = checkIns.filter(c => c.check_in_time >= todayStart).length;
      const publishedEvents = events.filter(e => e.status === 'published').length;

      // Average attendance rate across events that have registrations
      const eventAttendanceRates = events.map(e => {
        const regs = registrations.filter(r => r.event_id === e.id).length;
        const ins = checkIns.filter(c => c.event_id === e.id).length;
        return regs > 0 ? (ins / regs) * 100 : 0;
      }).filter(r => r > 0);

      const avgAttendanceRate = eventAttendanceRates.length > 0
        ? Math.round(eventAttendanceRates.reduce((a, b) => a + b, 0) / eventAttendanceRates.length)
        : 0;

      const summary: PlatformSummary = {
        totalEvents: events.length,
        publishedEvents,
        totalRegistrations: registrations.length,
        recentRegistrations,
        totalUsers: uniqueUsers,
        totalCheckIns: checkIns.length,
        todayCheckIns,
        avgAttendanceRate,
      };

      const eventRows: EventRow[] = events.map(e => {
        const regs = registrations.filter(r => r.event_id === e.id).length;
        const ins = checkIns.filter(c => c.event_id === e.id).length;
        return {
          id: e.id,
          title: e.title,
          slug: e.slug,
          status: e.status,
          start_date: e.start_date,
          city: e.city,
          registrations: regs,
          checkIns: ins,
          attendanceRate: regs > 0 ? Math.round((ins / regs) * 100) : 0,
          created_at: e.created_at,
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at));

      // Activity feed: recent events + recent registrations
      const feed: ActivityItem[] = [];

      for (const e of events.slice(0, 5)) {
        feed.push({
          id: `event-${e.id}`,
          type: 'event_created',
          detail: `Event "${e.title}" was created`,
          timestamp: e.created_at,
        });
      }

      for (const r of registrations.filter(r => r.created_at >= sevenDaysAgo).slice(0, 15)) {
        const event = events.find(e => e.id === r.event_id);
        feed.push({
          id: `reg-${r.id}`,
          type: 'registration',
          detail: `${r.full_name} registered for "${event?.title ?? 'an event'}"`,
          timestamp: r.created_at,
        });
      }

      feed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      if (signal?.cancelled) return;
      setData({ summary, events: eventRows, activityFeed: feed.slice(0, 20) });
    } catch (err) {
      console.error('Platform dashboard error:', err);
      if (!signal?.cancelled) setData(EMPTY);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchAll(signal);
    return () => { signal.cancelled = true; };
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll({ cancelled: false }), [fetchAll]);

  return { data, loading, refresh };
}
