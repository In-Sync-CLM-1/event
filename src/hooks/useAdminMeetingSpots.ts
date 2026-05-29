import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingSpot {
  id: string;
  event_id: string;
  name: string;
  location: string | null;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export function useAdminMeetingSpots(eventId: string | undefined) {
  return useQuery({
    queryKey: ['admin-meeting-spots', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from('meeting_spots')
        .select('*')
        .eq('event_id', eventId)
        .order('name');
      
      if (error) throw error;
      return data as MeetingSpot[];
    },
    enabled: !!eventId,
  });
}

export function useCreateMeetingSpot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (spot: {
      event_id: string;
      name: string;
      location?: string | null;
      capacity?: number;
    }) => {
      const { data, error } = await supabase
        .from('meeting_spots')
        .insert({
          event_id: spot.event_id,
          name: spot.name,
          location: spot.location || null,
          capacity: spot.capacity || 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-spots', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['meeting-spots', variables.event_id] });
      toast.success('Meeting spot created!');
    },
    onError: (error) => {
      toast.error('Failed to create meeting spot: ' + error.message);
    },
  });
}

export function useUpdateMeetingSpot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<{
        name: string;
        location: string | null;
        capacity: number;
        is_active: boolean;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('meeting_spots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-spots', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['meeting-spots', data.event_id] });
      toast.success('Meeting spot updated!');
    },
    onError: (error) => {
      toast.error('Failed to update meeting spot: ' + error.message);
    },
  });
}

export function useDeleteMeetingSpot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First get the event_id for cache invalidation
      const { data: spot } = await supabase
        .from('meeting_spots')
        .select('event_id')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('meeting_spots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return spot?.event_id;
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-spots', eventId] });
      toast.success('Meeting spot deleted!');
    },
    onError: (error) => {
      toast.error('Failed to delete meeting spot: ' + error.message);
    },
  });
}
