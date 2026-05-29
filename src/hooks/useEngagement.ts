import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EngagementScore {
  id: string;
  event_id: string;
  registration_id: string;
  score: number;
  tier: string;
  calculated_at: string;
  breakdown: Record<string, unknown>;
}

export interface EngagementWithAttendee extends EngagementScore {
  registration?: {
    full_name: string;
    email: string;
    company: string | null;
  };
}

export function useEngagementScores(eventId: string) {
  return useQuery({
    queryKey: ['engagement-scores', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_scores')
        .select(`
          *,
          registration:registrations(full_name, email, company)
        `)
        .eq('event_id', eventId)
        .order('score', { ascending: false });

      if (error) throw error;
      return data as EngagementWithAttendee[];
    },
    enabled: !!eventId,
  });
}

export function useUserEngagement(registrationId: string) {
  return useQuery({
    queryKey: ['user-engagement', registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_scores')
        .select('*')
        .eq('registration_id', registrationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as EngagementScore | null;
    },
    enabled: !!registrationId,
  });
}

export function useCalculateEngagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      // Get all registrations for the event
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'checked_in']);

      if (regError) throw regError;

      const results = [];

      for (const reg of registrations) {
        // Calculate points total
        const { data: points } = await supabase
          .from('points_log')
          .select('points')
          .eq('registration_id', reg.id);

        const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;

        // Calculate sessions attended
        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('id')
          .eq('registration_id', reg.id)
          .not('session_id', 'is', null);

        const sessionsAttended = checkIns?.length || 0;

        // Calculate badges earned
        const { data: badges } = await supabase
          .from('badge_awards')
          .select('id')
          .eq('registration_id', reg.id);

        const badgesEarned = badges?.length || 0;

        // Calculate score (weighted formula)
        const score = totalPoints + (sessionsAttended * 10) + (badgesEarned * 25);

        // Determine tier
        let tier = 'passive';
        if (score >= 500) tier = 'hot';
        else if (score >= 250) tier = 'warm';
        else if (score >= 100) tier = 'engaged';

        // Upsert engagement score
        const { data, error } = await supabase
          .from('engagement_scores')
          .upsert({
            event_id: eventId,
            registration_id: reg.id,
            score,
            tier,
            calculated_at: new Date().toISOString(),
            breakdown: {
              points: totalPoints,
              sessions_attended: sessionsAttended,
              badges_earned: badgesEarned,
            },
          }, { onConflict: 'event_id,registration_id' })
          .select()
          .single();

        if (error) throw error;
        results.push(data);
      }

      return results;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['engagement-scores', eventId] });
      toast({
        title: 'Engagement scores calculated',
        description: 'All attendee engagement scores have been updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error calculating engagement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEngagementTierDistribution(eventId: string) {
  return useQuery({
    queryKey: ['engagement-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_scores')
        .select('tier')
        .eq('event_id', eventId);

      if (error) throw error;

      const distribution = {
        hot: 0,
        warm: 0,
        engaged: 0,
        passive: 0,
      };

      data.forEach(score => {
        const tier = score.tier as keyof typeof distribution;
        if (tier in distribution) {
          distribution[tier]++;
        }
      });

      return distribution;
    },
    enabled: !!eventId,
  });
}
