import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Session, SessionWithSpeakers, Speaker } from '@/types/database';

export function useSessions(eventId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          session_speakers (
            speaker_id,
            speakers (*)
          )
        `)
        .eq('event_id', eventId)
        .order('start_time', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match SessionWithSpeakers type
      return (data || []).map(session => ({
        ...session,
        speakers: session.session_speakers?.map((ss: any) => ss.speakers).filter(Boolean) || []
      })) as SessionWithSpeakers[];
    },
    enabled: !!eventId,
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          session_speakers (
            speaker_id,
            speakers (*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        speakers: data.session_speakers?.map((ss: any) => ss.speakers).filter(Boolean) || []
      } as SessionWithSpeakers;
    },
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<Session, 'id' | 'created_at' | 'updated_at'> & { speaker_ids?: string[] }) => {
      const { speaker_ids, ...sessionData } = session;
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      // Add speaker associations
      if (speaker_ids && speaker_ids.length > 0) {
        const { error: speakerError } = await supabase
          .from('session_speakers')
          .insert(speaker_ids.map(speakerId => ({
            session_id: data.id,
            speaker_id: speakerId
          })));
        
        if (speakerError) throw speakerError;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.event_id] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      speaker_ids, 
      ...updates 
    }: Partial<Session> & { id: string; speaker_ids?: string[] }) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update speaker associations if provided
      if (speaker_ids !== undefined) {
        // Remove existing associations
        await supabase
          .from('session_speakers')
          .delete()
          .eq('session_id', id);

        // Add new associations
        if (speaker_ids.length > 0) {
          const { error: speakerError } = await supabase
            .from('session_speakers')
            .insert(speaker_ids.map(speakerId => ({
              session_id: id,
              speaker_id: speakerId
            })));
          
          if (speakerError) throw speakerError;
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['session', data.id] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', data.eventId] });
    },
  });
}

export function useReorderSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessions, eventId }: { sessions: { id: string; sort_order: number }[]; eventId: string }) => {
      const updates = sessions.map(s => 
        supabase
          .from('sessions')
          .update({ sort_order: s.sort_order })
          .eq('id', s.id)
      );
      
      await Promise.all(updates);
      return eventId;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', eventId] });
    },
  });
}
