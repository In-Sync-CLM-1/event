import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingPageSection {
  id: string;
  type: 'hero' | 'about' | 'speakers' | 'agenda' | 'sponsors' | 'cta';
  config: Record<string, any>;
  order: number;
}

export interface LandingPage {
  id: string;
  event_id: string;
  page_type: 'builder' | 'html';
  sections: LandingPageSection[];
  custom_html: string | null;
  custom_css: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useLandingPage(eventId: string | undefined) {
  return useQuery({
    queryKey: ['landing-page', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      
      // Parse sections from JSON
      if (data) {
        const sectionsData = Array.isArray(data.sections) 
          ? (data.sections as unknown as LandingPageSection[])
          : [];
        return {
          ...data,
          page_type: data.page_type as 'builder' | 'html',
          sections: sectionsData,
        } as LandingPage;
      }
      
      return null;
    },
    enabled: !!eventId,
  });
}

export function useUpsertLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      event_id: string;
      page_type: 'builder' | 'html';
      sections?: LandingPageSection[];
      custom_html?: string | null;
      custom_css?: string | null;
      is_published?: boolean;
    }) => {
      // First check if landing page exists for this event
      const { data: existing } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('event_id', data.event_id)
        .maybeSingle();

      const payload = {
        event_id: data.event_id,
        page_type: data.page_type,
        sections: JSON.parse(JSON.stringify(data.sections || [])),
        custom_html: data.custom_html || null,
        custom_css: data.custom_css || null,
        is_published: data.is_published ?? false,
      };

      let result, error;
      
      if (existing) {
        // Update existing
        const response = await supabase
          .from('landing_pages')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        result = response.data;
        error = response.error;
      } else {
        // Insert new
        const response = await supabase
          .from('landing_pages')
          .insert(payload)
          .select()
          .single();
        result = response.data;
        error = response.error;
      }

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', variables.event_id] });
    },
  });
}

export function usePublishLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, isPublished }: { eventId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('landing_pages')
        .update({ is_published: isPublished })
        .eq('event_id', eventId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landing-page', variables.eventId] });
    },
  });
}
