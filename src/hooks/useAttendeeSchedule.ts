import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AttendeeScheduleItem {
  id: string;
  registration_id: string;
  session_id: string;
  added_at: string;
}

export function useAttendeeSchedule(registrationId: string | undefined) {
  return useQuery({
    queryKey: ['attendee-schedule', registrationId],
    queryFn: async () => {
      if (!registrationId) return [];
      
      const { data, error } = await supabase
        .from('attendee_schedules')
        .select(`
          *,
          sessions (
            *,
            session_speakers (
              speakers (*)
            )
          )
        `)
        .eq('registration_id', registrationId)
        .order('added_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!registrationId,
  });
}

export function useAddToSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, sessionId }: { registrationId: string; sessionId: string }) => {
      const { data, error } = await supabase
        .from('attendee_schedules')
        .insert({
          registration_id: registrationId,
          session_id: sessionId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendee-schedule', data.registration_id] });
    },
  });
}

export function useRemoveFromSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, sessionId }: { registrationId: string; sessionId: string }) => {
      const { error } = await supabase
        .from('attendee_schedules')
        .delete()
        .eq('registration_id', registrationId)
        .eq('session_id', sessionId);

      if (error) throw error;
      return { registrationId, sessionId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendee-schedule', data.registrationId] });
    },
  });
}

export function useIsSessionInSchedule(registrationId: string | undefined, sessionId: string) {
  const { data: schedule } = useAttendeeSchedule(registrationId);
  return schedule?.some((item: any) => item.session_id === sessionId) || false;
}

// Check for conflicts with existing schedule
export function useCheckScheduleConflict() {
  return useMutation({
    mutationFn: async ({ 
      registrationId, 
      sessionStartTime, 
      sessionEndTime 
    }: { 
      registrationId: string; 
      sessionStartTime: string; 
      sessionEndTime: string;
    }) => {
      const { data, error } = await supabase
        .from('attendee_schedules')
        .select(`
          sessions (
            id,
            title,
            start_time,
            end_time
          )
        `)
        .eq('registration_id', registrationId);

      if (error) throw error;

      const newStart = new Date(sessionStartTime);
      const newEnd = new Date(sessionEndTime);

      const conflicts = (data || []).filter((item: any) => {
        const existingStart = new Date(item.sessions.start_time);
        const existingEnd = new Date(item.sessions.end_time);
        
        // Check for overlap
        return (newStart < existingEnd && newEnd > existingStart);
      });

      return conflicts.map((c: any) => c.sessions);
    },
  });
}
