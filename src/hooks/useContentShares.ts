import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContentShare {
  id: string;
  content_id: string;
  sharer_id: string;
  recipient_email: string;
  recipient_registration_id: string | null;
  share_token: string;
  viewed_at: string | null;
  view_count: number;
  created_at: string;
}

export interface ContentShareWithDetails extends ContentShare {
  content_library?: {
    id: string;
    title: string;
    type: string;
    thumbnail_url: string | null;
  };
}

function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function useContentShares(eventId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ['content-shares', user?.id, eventId],
    queryFn: async () => {
      let query = supabase
        .from('content_shares')
        .select(`
          *,
          content_library:content_id (
            id,
            title,
            type,
            thumbnail_url,
            event_id
          )
        `)
        .eq('sharer_id', user!.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by event_id if provided
      let filtered = data;
      if (eventId) {
        filtered = data.filter((share: any) => 
          share.content_library?.event_id === eventId
        );
      }

      return filtered as ContentShareWithDetails[];
    },
    enabled: !!user,
  });

  const createShare = useMutation({
    mutationFn: async (data: {
      content_id: string;
      recipient_email: string;
    }) => {
      const shareToken = generateShareToken();
      const { data: share, error } = await supabase
        .from('content_shares')
        .insert({
          content_id: data.content_id,
          sharer_id: user!.id,
          recipient_email: data.recipient_email,
          share_token: shareToken,
        })
        .select()
        .single();

      if (error) throw error;
      return share;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-shares'] });
    },
  });

  const trackView = useMutation({
    mutationFn: async (shareToken: string) => {
      const { data: share, error: fetchError } = await supabase
        .from('content_shares')
        .select('id, view_count')
        .eq('share_token', shareToken)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('content_shares')
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (share.view_count || 0) + 1,
        })
        .eq('id', share.id);

      if (updateError) throw updateError;
    },
  });

  const getShareStats = useQuery({
    queryKey: ['content-share-stats', user?.id, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_shares')
        .select(`
          id,
          viewed_at,
          view_count,
          content_library:content_id (
            event_id
          )
        `)
        .eq('sharer_id', user!.id);

      if (error) throw error;

      // Filter by event_id if provided
      let filtered = data;
      if (eventId) {
        filtered = data.filter((share: any) => 
          share.content_library?.event_id === eventId
        );
      }

      const stats = {
        totalShares: filtered.length,
        totalViews: filtered.reduce((sum: number, s: any) => sum + (s.view_count || 0), 0),
        viewedCount: filtered.filter((s: any) => s.viewed_at).length,
        viewRate: filtered.length > 0 
          ? Math.round((filtered.filter((s: any) => s.viewed_at).length / filtered.length) * 100) 
          : 0,
      };

      return stats;
    },
    enabled: !!user,
  });

  return {
    shares: sharesQuery.data || [],
    isLoading: sharesQuery.isLoading,
    error: sharesQuery.error,
    stats: getShareStats.data,
    createShare,
    trackView,
    refetch: sharesQuery.refetch,
  };
}
