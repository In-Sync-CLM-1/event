import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingSlot {
  id: string;
  event_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_available: boolean;
  created_at: string;
}

export function useAdminMeetingSlots(eventId: string | undefined) {
  return useQuery({
    queryKey: ['admin-meeting-slots', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('meeting_slots')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time');
      
      if (error) throw error;
      return data as MeetingSlot[];
    },
    enabled: !!eventId,
  });
}

export function useCreateMeetingSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slot: {
      event_id: string;
      start_time: string;
      end_time: string;
      location?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('meeting_slots')
        .insert({
          event_id: slot.event_id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          location: slot.location || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-slots', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', variables.event_id] });
      toast.success('Meeting slot created!');
    },
    onError: (error) => {
      toast.error('Failed to create meeting slot: ' + error.message);
    },
  });
}

export function useUpdateMeetingSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<{
        start_time: string;
        end_time: string;
        location: string | null;
        is_available: boolean;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('meeting_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-slots', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', data.event_id] });
      toast.success('Meeting slot updated!');
    },
    onError: (error) => {
      toast.error('Failed to update meeting slot: ' + error.message);
    },
  });
}

export function useDeleteMeetingSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First get the event_id for cache invalidation
      const { data: slot } = await supabase
        .from('meeting_slots')
        .select('event_id')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('meeting_slots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return slot?.event_id;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-slots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', eventId] });
      toast.success('Meeting slot deleted!');
    },
    onError: (error) => {
      toast.error('Failed to delete meeting slot: ' + error.message);
    },
  });
}

export function useBulkCreateMeetingSlots() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slots: {
      event_id: string;
      start_time: string;
      end_time: string;
      location?: string | null;
    }[]) => {
      if (slots.length === 0) return [];
      
      const { data, error } = await supabase
        .from('meeting_slots')
        .insert(slots.map(s => ({
          event_id: s.event_id,
          start_time: s.start_time,
          end_time: s.end_time,
          location: s.location || null,
        })))
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['admin-meeting-slots', data[0].event_id] });
        queryClient.invalidateQueries({ queryKey: ['meeting-slots', data[0].event_id] });
      }
      toast.success(`Created ${data?.length || 0} meeting slots!`);
    },
    onError: (error) => {
      toast.error('Failed to create meeting slots: ' + error.message);
    },
  });
}
