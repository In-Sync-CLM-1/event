import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  waitlisted: number;
  cancelled: number;
  checkedIn: number;
}

export interface AttendanceTrend {
  date: string;
  checkIns: number;
}

export interface SessionPopularity {
  sessionId: string;
  title: string;
  attendees: number;
  capacity: number | null;
  fillRate: number;
}

export interface EngagementDistribution {
  tier: string;
  count: number;
  percentage: number;
}

export function useRegistrationStats(eventId: string) {
  return useQuery({
    queryKey: ['analytics', 'registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('status')
        .eq('event_id', eventId);

      if (error) throw error;

      const stats: RegistrationStats = {
        total: data.length,
        confirmed: 0,
        pending: 0,
        waitlisted: 0,
        cancelled: 0,
        checkedIn: 0,
      };

      data.forEach(reg => {
        switch (reg.status) {
          case 'confirmed': stats.confirmed++; break;
          case 'pending': stats.pending++; break;
          case 'waitlisted': stats.waitlisted++; break;
          case 'cancelled': stats.cancelled++; break;
          case 'checked_in': stats.checkedIn++; break;
        }
      });

      return stats;
    },
    enabled: !!eventId,
  });
}

export function useAttendanceTrends(eventId: string) {
  return useQuery({
    queryKey: ['analytics', 'attendance-trends', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('check_in_time')
        .eq('event_id', eventId)
        .is('session_id', null) // Only event-level check-ins
        .order('check_in_time');

      if (error) throw error;

      // Group by date
      const trendMap = new Map<string, number>();
      data.forEach(checkIn => {
        const date = new Date(checkIn.check_in_time).toISOString().split('T')[0];
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      });

      const trends: AttendanceTrend[] = Array.from(trendMap.entries())
        .map(([date, checkIns]) => ({ date, checkIns }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trends;
    },
    enabled: !!eventId,
  });
}

export function useSessionPopularity(eventId: string) {
  return useQuery({
    queryKey: ['analytics', 'session-popularity', eventId],
    queryFn: async () => {
      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, title, max_capacity')
        .eq('event_id', eventId);

      if (sessionsError) throw sessionsError;

      // Get check-ins per session
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('session_id')
        .eq('event_id', eventId)
        .not('session_id', 'is', null);

      if (checkInsError) throw checkInsError;

      // Count check-ins per session
      const checkInCounts = new Map<string, number>();
      checkIns.forEach(ci => {
        if (ci.session_id) {
          checkInCounts.set(ci.session_id, (checkInCounts.get(ci.session_id) || 0) + 1);
        }
      });

      const popularity: SessionPopularity[] = sessions.map(session => {
        const attendees = checkInCounts.get(session.id) || 0;
        const fillRate = session.max_capacity ? (attendees / session.max_capacity) * 100 : 0;
        
        return {
          sessionId: session.id,
          title: session.title,
          attendees,
          capacity: session.max_capacity,
          fillRate: Math.round(fillRate),
        };
      });

      return popularity.sort((a, b) => b.attendees - a.attendees);
    },
    enabled: !!eventId,
  });
}

export function useEngagementDistribution(eventId: string) {
  return useQuery({
    queryKey: ['analytics', 'engagement-distribution', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_scores')
        .select('tier')
        .eq('event_id', eventId);

      if (error) throw error;

      const tierCounts = new Map<string, number>();
      data.forEach(score => {
        tierCounts.set(score.tier, (tierCounts.get(score.tier) || 0) + 1);
      });

      const total = data.length || 1;
      const tiers = ['hot', 'warm', 'engaged', 'passive'];

      const distribution: EngagementDistribution[] = tiers.map(tier => ({
        tier,
        count: tierCounts.get(tier) || 0,
        percentage: Math.round(((tierCounts.get(tier) || 0) / total) * 100),
      }));

      return distribution;
    },
    enabled: !!eventId,
  });
}

export function usePointsDistribution(eventId: string) {
  return useQuery({
    queryKey: ['analytics', 'points-distribution', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_log')
        .select('activity_type, points')
        .eq('event_id', eventId);

      if (error) throw error;

      const activityTotals = new Map<string, number>();
      data.forEach(log => {
        activityTotals.set(
          log.activity_type, 
          (activityTotals.get(log.activity_type) || 0) + log.points
        );
      });

      return Array.from(activityTotals.entries())
        .map(([activity, points]) => ({ activity, points }))
        .sort((a, b) => b.points - a.points);
    },
    enabled: !!eventId,
  });
}

export function useContentAnalytics(eventId: string) {
  return useQuery({
    queryKey: ['analytics', 'content', eventId],
    queryFn: async () => {
      const { data: content, error: contentError } = await supabase
        .from('content_library')
        .select('id, title, type')
        .eq('event_id', eventId);

      if (contentError) throw contentError;

      const { data: views, error: viewsError } = await supabase
        .from('content_views')
        .select('content_id, duration_seconds')
        .in('content_id', content.map(c => c.id));

      if (viewsError) throw viewsError;

      const viewCounts = new Map<string, { views: number; totalDuration: number }>();
      views.forEach(view => {
        const current = viewCounts.get(view.content_id) || { views: 0, totalDuration: 0 };
        viewCounts.set(view.content_id, {
          views: current.views + 1,
          totalDuration: current.totalDuration + (view.duration_seconds || 0),
        });
      });

      return content.map(item => {
        const stats = viewCounts.get(item.id) || { views: 0, totalDuration: 0 };
        return {
          ...item,
          views: stats.views,
          avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0,
        };
      }).sort((a, b) => b.views - a.views);
    },
    enabled: !!eventId,
  });
}
