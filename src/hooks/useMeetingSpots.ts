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

export interface MeetingBooking {
  id: string;
  event_id: string;
  spot_id: string | null;
  requester_registration_id: string;
  target_registration_id: string;
  scheduled_start: string | null;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined';
  outcome_notes: string | null;
  outcome_rating: number | null;
  topics_discussed: string[] | null;
  follow_up_required: boolean;
  message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  spot?: MeetingSpot;
  requester?: {
    id: string;
    full_name: string;
    company: string | null;
    designation: string | null;
    email: string;
  };
  target?: {
    id: string;
    full_name: string;
    company: string | null;
    designation: string | null;
    email: string;
  };
}

export function useMeetingSpots(eventId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-spots', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('meeting_spots')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as MeetingSpot[];
    },
    enabled: !!eventId,
  });
}

export function useMeetingBookings(eventId: string | undefined, registrationId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-bookings', eventId, registrationId],
    queryFn: async () => {
      if (!eventId || !registrationId) return [];
      
      const { data, error } = await supabase
        .from('meeting_bookings')
        .select(`
          *,
          spot:meeting_spots(*),
          requester:registrations!meeting_bookings_requester_registration_id_fkey(id, full_name, company, designation, email),
          target:registrations!meeting_bookings_target_registration_id_fkey(id, full_name, company, designation, email)
        `)
        .eq('event_id', eventId)
        .or(`requester_registration_id.eq.${registrationId},target_registration_id.eq.${registrationId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MeetingBooking[];
    },
    enabled: !!eventId && !!registrationId,
  });
}

export function useEventAttendees(eventId: string | undefined, excludeRegistrationId?: string) {
  return useQuery({
    queryKey: ['event-attendees', eventId, excludeRegistrationId],
    queryFn: async () => {
      if (!eventId) return [];
      
      let query = supabase
        .from('registrations')
        .select('id, full_name, company, designation, email, linkedin_url')
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'checked_in'])
        .order('full_name');
      
      if (excludeRegistrationId) {
        query = query.neq('id', excludeRegistrationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useCreateMeetingBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: {
      event_id: string;
      spot_id?: string;
      requester_registration_id: string;
      target_registration_id: string;
      scheduled_start?: string;
      duration_minutes: number;
      message?: string;
    }) => {
      const { data, error } = await supabase
        .from('meeting_bookings')
        .insert(booking)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-bookings', variables.event_id] });
      toast.success('Meeting request sent!');
    },
    onError: (error) => {
      toast.error('Failed to send meeting request: ' + error.message);
    },
  });
}

export function useRespondToBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, status, scheduledStart, spotId }: {
      bookingId: string;
      status: 'confirmed' | 'declined' | 'cancelled';
      scheduledStart?: string;
      spotId?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (scheduledStart) updateData.scheduled_start = scheduledStart;
      if (spotId) updateData.spot_id = spotId;
      
      const { data, error } = await supabase
        .from('meeting_bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-bookings'] });
      const statusMessage = data.status === 'confirmed' ? 'Meeting confirmed!' : 
                           data.status === 'declined' ? 'Meeting declined' : 'Meeting cancelled';
      toast.success(statusMessage);
    },
    onError: (error) => {
      toast.error('Failed to update meeting: ' + error.message);
    },
  });
}

export function useRecordMeetingOutcome() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, outcome }: {
      bookingId: string;
      outcome: {
        outcome_notes?: string;
        outcome_rating?: number;
        topics_discussed?: string[];
        follow_up_required?: boolean;
      };
    }) => {
      const { data, error } = await supabase
        .from('meeting_bookings')
        .update({
          ...outcome,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-bookings'] });
      toast.success('Meeting outcome recorded!');
    },
    onError: (error) => {
      toast.error('Failed to record outcome: ' + error.message);
    },
  });
}

export function useUserRegistration(eventId: string | undefined, userEmail: string | undefined) {
  return useQuery({
    queryKey: ['user-registration', eventId, userEmail],
    queryFn: async () => {
      if (!eventId || !userEmail) return null;
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('email', userEmail)
        .in('status', ['confirmed', 'checked_in'])
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!userEmail,
  });
}
