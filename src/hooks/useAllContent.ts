import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

export function useAllContent(eventId?: string) {
  return useQuery({
    queryKey: ['all-content', eventId],
    queryFn: async () => {
      let query = supabase
        .from('content_library')
        .select('*')
        .order('title');

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentItem[];
    },
  });
}
