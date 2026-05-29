import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CheckIn } from '@/types/database';

export function useCheckIns(eventId: string | undefined) {
  return useQuery({
    queryKey: ['check-ins', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          registration:registrations(
            id,
            full_name,
            email,
            registration_number,
            status
          ),
          session:sessions(
            id,
            title
          )
        `)
        .eq('event_id', eventId)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

export function useCheckInStats(eventId: string | undefined) {
  return useQuery({
    queryKey: ['check-in-stats', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      // Get total registrations
      const { count: totalRegistrations } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'checked_in']);

      // Get total check-ins (unique registrations)
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('registration_id')
        .eq('event_id', eventId)
        .is('session_id', null);

      const uniqueCheckIns = new Set(checkIns?.map(c => c.registration_id)).size;

      // Get today's check-ins
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCheckIns } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .gte('check_in_time', today.toISOString());

      return {
        totalRegistrations: totalRegistrations || 0,
        totalCheckIns: uniqueCheckIns,
        todayCheckIns: todayCheckIns || 0,
        attendanceRate: totalRegistrations ? Math.round((uniqueCheckIns / totalRegistrations) * 100) : 0,
      };
    },
    enabled: !!eventId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSessionCheckIns(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-check-ins', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          registration:registrations(
            id,
            full_name,
            email,
            registration_number
          )
        `)
        .eq('session_id', sessionId)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationId,
      eventId,
      sessionId,
      checkedInBy,
      method = 'qr_scan'
    }: {
      registrationId: string;
      eventId: string;
      sessionId?: string;
      checkedInBy?: string;
      method?: string;
    }) => {
      // Check if already checked in for this session/event
      const query = supabase
        .from('check_ins')
        .select('id')
        .eq('registration_id', registrationId)
        .eq('event_id', eventId);
      
      if (sessionId) {
        query.eq('session_id', sessionId);
      } else {
        query.is('session_id', null);
      }

      const { data: existing } = await query.single();

      if (existing) {
        throw new Error('Already checked in');
      }

      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          registration_id: registrationId,
          event_id: eventId,
          session_id: sessionId,
          checked_in_by: checkedInBy,
          method,
        })
        .select()
        .single();

      if (error) throw error;

      // Update registration status if event check-in
      if (!sessionId) {
        await supabase
          .from('registrations')
          .update({ 
            status: 'checked_in',
            checked_in_at: new Date().toISOString()
          })
          .eq('id', registrationId);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['check-in-stats', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['session-check-ins', data.session_id] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkInId: string) => {
      const { data, error } = await supabase
        .from('check_ins')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', checkInId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['session-check-ins', data.session_id] });
    },
  });
}
