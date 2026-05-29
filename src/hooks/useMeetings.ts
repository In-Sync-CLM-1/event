import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MeetingSlot {
  id: string;
  event_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_available: boolean;
  created_at: string;
}

export interface MeetingRequest {
  id: string;
  slot_id: string | null;
  event_id: string;
  requester_id: string;
  target_id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  slot?: MeetingSlot;
  requester?: { full_name: string; email: string; company: string | null };
  target?: { full_name: string; email: string; company: string | null };
}

export function useMeetingSlots(eventId: string) {
  return useQuery({
    queryKey: ['meeting-slots', eventId],
    queryFn: async () => {
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

export function useAvailableSlots(eventId: string) {
  return useQuery({
    queryKey: ['meeting-slots', eventId, 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_slots')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_available', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time');

      if (error) throw error;
      return data as MeetingSlot[];
    },
    enabled: !!eventId,
  });
}

export function useMeetingRequests(eventId: string) {
  return useQuery({
    queryKey: ['meeting-requests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          slot:meeting_slots(*),
          requester:registrations!meeting_requests_requester_id_fkey(full_name, email, company),
          target:registrations!meeting_requests_target_id_fkey(full_name, email, company)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MeetingRequest[];
    },
    enabled: !!eventId,
  });
}

export function useUserMeetingRequests(registrationId: string) {
  return useQuery({
    queryKey: ['user-meeting-requests', registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          slot:meeting_slots(*),
          requester:registrations!meeting_requests_requester_id_fkey(full_name, email, company),
          target:registrations!meeting_requests_target_id_fkey(full_name, email, company)
        `)
        .or(`requester_id.eq.${registrationId},target_id.eq.${registrationId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MeetingRequest[];
    },
    enabled: !!registrationId,
  });
}

export function useCreateMeetingSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (slot: Omit<MeetingSlot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('meeting_slots')
        .insert(slot)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-slots', variables.event_id] });
      toast({ title: 'Meeting slot created' });
    },
    onError: (error) => {
      toast({
        title: 'Error creating slot',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateMeetingRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: {
      event_id: string;
      slot_id?: string;
      requester_id: string;
      target_id: string;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from('meeting_requests')
        .insert({
          ...request,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-requests', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['user-meeting-requests'] });
      toast({
        title: 'Meeting request sent',
        description: 'The attendee will be notified of your request',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error sending request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRespondToMeetingRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, status, slotId }: { 
      requestId: string; 
      status: 'accepted' | 'declined';
      slotId?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (slotId) updateData.slot_id = slotId;

      const { data, error } = await supabase
        .from('meeting_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Mark slot as unavailable if accepted
      if (status === 'accepted' && slotId) {
        await supabase
          .from('meeting_slots')
          .update({ is_available: false })
          .eq('id', slotId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-meeting-requests'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-slots'] });
      toast({ title: 'Meeting request updated' });
    },
    onError: (error) => {
      toast({
        title: 'Error updating request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
