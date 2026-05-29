import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Speaker } from '@/types/database';

export function useSpeakers(eventId: string | undefined) {
  return useQuery({
    queryKey: ['speakers', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Speaker[];
    },
    enabled: !!eventId,
  });
}

export function useSpeaker(speakerId: string | undefined) {
  return useQuery({
    queryKey: ['speaker', speakerId],
    queryFn: async () => {
      if (!speakerId) return null;
      
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('id', speakerId)
        .single();

      if (error) throw error;
      return data as Speaker;
    },
    enabled: !!speakerId,
  });
}

export function useCreateSpeaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (speaker: Omit<Speaker, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('speakers')
        .insert(speaker)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['speakers', data.event_id] });
    },
  });
}

export function useUpdateSpeaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Speaker> & { id: string }) => {
      const { data, error } = await supabase
        .from('speakers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['speakers', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['speaker', data.id] });
    },
  });
}

export function useDeleteSpeaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('speakers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['speakers', data.eventId] });
    },
  });
}

export function useUploadSpeakerPhoto() {
  return useMutation({
    mutationFn: async ({ file, eventId, speakerId }: { file: File; eventId: string; speakerId?: string }) => {
      const ext = file.name.split('.').pop();
      const fileName = `speakers/${eventId}/${speakerId || 'new'}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('event-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    },
  });
}
