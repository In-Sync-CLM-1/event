import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Event, EventWithDetails, EventStatus } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';

export function useEvents(status?: EventStatus) {
  return useQuery({
    queryKey: ['events', status],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useEvent(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['event', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;
      
      // Try by ID first (UUID format), then by slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          sessions:sessions(*),
          speakers:speakers(*),
          sponsors:sponsors(*)
        `)
        .eq(isUUID ? 'id' : 'slug', idOrSlug)
        .single();

      if (error) throw error;
      return data as EventWithDetails;
    },
    enabled: !!idOrSlug,
  });
}

export function useEventById(id: string) {
  return useQuery({
    queryKey: ['event-by-id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          sessions:sessions(*),
          speakers:speakers(*),
          sponsors:sponsors(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EventWithDetails;
    },
    enabled: !!id,
  });
}

interface CreateEventInput {
  slug: string;
  title: string;
  description?: string;
  venue?: string;
  address?: string;
  city?: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  max_capacity?: number;
  banner_url?: string;
  logo_url?: string;
  status?: EventStatus;
  settings?: Json;
  created_by?: string;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: CreateEventInput) => {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...event,
          settings: event.settings || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

interface UpdateEventInput {
  id: string;
  slug?: string;
  title?: string;
  description?: string;
  venue?: string;
  address?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  max_capacity?: number;
  banner_url?: string;
  logo_url?: string;
  status?: EventStatus;
  settings?: Json;
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEventInput) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['event-by-id', data.id] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
