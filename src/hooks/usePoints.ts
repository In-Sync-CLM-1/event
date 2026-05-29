import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PointsLog {
  id: string;
  event_id: string;
  registration_id: string;
  points: number;
  activity_type: string;
  description: string | null;
  awarded_at: string;
  awarded_by: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  registration_id: string;
  full_name: string;
  company: string | null;
  total_points: number;
  rank: number;
}

export function usePointsLog(eventId: string) {
  return useQuery({
    queryKey: ['points-log', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_log')
        .select('*')
        .eq('event_id', eventId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      return data as PointsLog[];
    },
    enabled: !!eventId,
  });
}

export function useUserPoints(registrationId: string) {
  return useQuery({
    queryKey: ['user-points', registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_log')
        .select('*')
        .eq('registration_id', registrationId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      
      const totalPoints = data.reduce((sum, log) => sum + log.points, 0);
      return { logs: data as PointsLog[], totalPoints };
    },
    enabled: !!registrationId,
  });
}

export function useLeaderboard(eventId: string, limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', eventId, limit],
    queryFn: async () => {
      // Get all points grouped by registration
      const { data: pointsData, error: pointsError } = await supabase
        .from('points_log')
        .select('registration_id, points')
        .eq('event_id', eventId);

      if (pointsError) throw pointsError;

      // Aggregate points per registration
      const pointsMap = new Map<string, number>();
      pointsData.forEach(log => {
        const current = pointsMap.get(log.registration_id) || 0;
        pointsMap.set(log.registration_id, current + log.points);
      });

      // Get registration details
      const registrationIds = Array.from(pointsMap.keys());
      if (registrationIds.length === 0) return [];

      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('id, full_name, company')
        .in('id', registrationIds);

      if (regError) throw regError;

      // Build leaderboard
      const leaderboard: LeaderboardEntry[] = registrations.map(reg => ({
        registration_id: reg.id,
        full_name: reg.full_name,
        company: reg.company,
        total_points: pointsMap.get(reg.id) || 0,
        rank: 0,
      }));

      // Sort by points and assign ranks
      leaderboard.sort((a, b) => b.total_points - a.total_points);
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard.slice(0, limit);
    },
    enabled: !!eventId,
  });
}

export function useAwardPoints() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      event_id: string;
      registration_id: string;
      points: number;
      activity_type: string;
      description?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('points_log')
        .insert({
          event_id: data.event_id,
          registration_id: data.registration_id,
          points: data.points,
          activity_type: data.activity_type,
          description: data.description || null,
          awarded_by: user.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['points-log', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['user-points', variables.registration_id] });
      toast({
        title: 'Points awarded',
        description: `${variables.points} points awarded successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
