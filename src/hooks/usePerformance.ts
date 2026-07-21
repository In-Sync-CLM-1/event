import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PerformancePeriod = 'this_quarter' | 'last_quarter' | 'this_year' | 'all';

export interface EventPerformance {
  eventId: string;
  title: string;
  startDate: string;
  city: string | null;
  mode: string | null;
  registered: number;
  attended: number;
  attendanceRate: number;
  hot: number;
  warm: number;
  engaged: number;
  passive: number;
}

export interface PerformanceSummary {
  events: EventPerformance[];
  totalEvents: number;
  totalRegistrations: number;
  totalAttended: number;
  attendanceRate: number;
  salesReadyLeads: number;
  periodLabel: string;
}

export function periodRange(period: PerformancePeriod): { from: Date | null; label: string } {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
  if (period === 'this_quarter') {
    const from = new Date(now.getFullYear(), q * 3, 1);
    const to = new Date(now.getFullYear(), q * 3 + 2, 1);
    return { from, label: `${fmt(from)} – ${fmt(to)} ${now.getFullYear()}` };
  }
  if (period === 'last_quarter') {
    const from = new Date(now.getFullYear(), (q - 1) * 3, 1);
    const to = new Date(now.getFullYear(), (q - 1) * 3 + 2, 1);
    return { from, label: `${fmt(from)} – ${fmt(to)} ${from.getFullYear()}` };
  }
  if (period === 'this_year') {
    return { from: new Date(now.getFullYear(), 0, 1), label: String(now.getFullYear()) };
  }
  return { from: null, label: 'All time' };
}

// Supabase caps selects at 1000 rows — page through so big orgs aren't undercounted.
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const PAGE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < PAGE) return all;
  }
}

export function usePerformance(period: PerformancePeriod) {
  return useQuery({
    queryKey: ['admin', 'performance', period],
    queryFn: async (): Promise<PerformanceSummary> => {
      const { from, label } = periodRange(period);
      const until = period === 'last_quarter'
        ? new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1)
        : null;

      let evQuery = supabase
        .from('events')
        .select('id, title, start_date, city, mode')
        .neq('status', 'draft')
        .order('start_date', { ascending: true });
      if (from) evQuery = evQuery.gte('start_date', from.toISOString());
      if (until) evQuery = evQuery.lt('start_date', until.toISOString());
      const { data: events, error: evErr } = await evQuery;
      if (evErr) throw evErr;

      const ids = (events || []).map((e) => e.id);
      if (!ids.length) {
        return { events: [], totalEvents: 0, totalRegistrations: 0, totalAttended: 0, attendanceRate: 0, salesReadyLeads: 0, periodLabel: label };
      }

      const [regs, checkIns, scores] = await Promise.all([
        fetchAll<{ event_id: string; status: string }>((a, b) =>
          supabase.from('registrations').select('event_id, status').in('event_id', ids).range(a, b)),
        fetchAll<{ event_id: string; registration_id: string }>((a, b) =>
          supabase.from('check_ins').select('event_id, registration_id').is('session_id', null).in('event_id', ids).range(a, b)),
        fetchAll<{ event_id: string; tier: string }>((a, b) =>
          supabase.from('engagement_scores').select('event_id, tier').in('event_id', ids).range(a, b)),
      ]);

      const byEvent = new Map<string, EventPerformance>();
      for (const e of events || []) {
        byEvent.set(e.id, {
          eventId: e.id, title: e.title, startDate: e.start_date, city: e.city, mode: e.mode,
          registered: 0, attended: 0, attendanceRate: 0, hot: 0, warm: 0, engaged: 0, passive: 0,
        });
      }
      for (const r of regs) {
        const e = byEvent.get(r.event_id);
        if (e && r.status !== 'cancelled') e.registered++;
      }
      const seen = new Set<string>();
      for (const c of checkIns) {
        if (seen.has(c.registration_id)) continue;
        seen.add(c.registration_id);
        const e = byEvent.get(c.event_id);
        if (e) e.attended++;
      }
      for (const s of scores) {
        const e = byEvent.get(s.event_id);
        if (!e) continue;
        if (s.tier === 'hot') e.hot++;
        else if (s.tier === 'warm') e.warm++;
        else if (s.tier === 'engaged') e.engaged++;
        else e.passive++;
      }

      const list = [...byEvent.values()];
      for (const e of list) e.attendanceRate = e.registered ? Math.round((e.attended / e.registered) * 100) : 0;

      const totalRegistrations = list.reduce((s, e) => s + e.registered, 0);
      const totalAttended = list.reduce((s, e) => s + e.attended, 0);
      return {
        events: list,
        totalEvents: list.length,
        totalRegistrations,
        totalAttended,
        attendanceRate: totalRegistrations ? Math.round((totalAttended / totalRegistrations) * 100) : 0,
        salesReadyLeads: list.reduce((s, e) => s + e.hot + e.warm, 0),
        periodLabel: label,
      };
    },
  });
}
