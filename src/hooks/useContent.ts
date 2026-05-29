import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContentItem {
  id: string;
  event_id: string;
  session_id: string | null;
  title: string;
  description: string | null;
  type: string;
  url: string;
  thumbnail_url: string | null;
  is_gated: boolean;
  expires_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  session?: { title: string };
}

export interface ContentView {
  id: string;
  content_id: string;
  registration_id: string;
  viewed_at: string;
  duration_seconds: number;
}

export function useContentLibrary(eventId: string) {
  return useQuery({
    queryKey: ['content-library', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_library')
        .select(`
          *,
          session:sessions(title)
        `)
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!eventId,
  });
}

export function usePublicContent(eventId: string) {
  return useQuery({
    queryKey: ['content-library', eventId, 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_library')
        .select(`
          *,
          session:sessions(title)
        `)
        .eq('event_id', eventId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('sort_order');

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!eventId,
  });
}

export function useContentViews(contentId: string) {
  return useQuery({
    queryKey: ['content-views', contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_views')
        .select(`
          *,
          registration:registrations(full_name, email)
        `)
        .eq('content_id', contentId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!contentId,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (content: Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'session'>) => {
      const { data, error } = await supabase
        .from('content_library')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-library', variables.event_id] });
      toast({ title: 'Content added successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error adding content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...content }: Partial<ContentItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('content_library')
        .update(content)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-library', data.event_id] });
      toast({ title: 'Content updated successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error updating content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('content_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-library', data.eventId] });
      toast({ title: 'Content deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTrackContentView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, registrationId, durationSeconds = 0 }: {
      contentId: string;
      registrationId: string;
      durationSeconds?: number;
    }) => {
      const { data, error } = await supabase
        .from('content_views')
        .insert({
          content_id: contentId,
          registration_id: registrationId,
          duration_seconds: durationSeconds,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content-views', variables.contentId] });
    },
  });
}
