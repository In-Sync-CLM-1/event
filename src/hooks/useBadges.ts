import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Badge {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  criteria: Record<string, unknown>;
  points_value: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BadgeAward {
  id: string;
  badge_id: string;
  registration_id: string;
  awarded_at: string;
  badge?: Badge;
}

export function useBadges(eventId: string) {
  return useQuery({
    queryKey: ['badges', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;
      return data as Badge[];
    },
    enabled: !!eventId,
  });
}

export function useUserBadges(registrationId: string) {
  return useQuery({
    queryKey: ['user-badges', registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_awards')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('registration_id', registrationId);

      if (error) throw error;
      return data.map(award => ({
        ...award,
        badge: award.badge as Badge,
      })) as BadgeAward[];
    },
    enabled: !!registrationId,
  });
}

export function useCreateBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (badge: {
      event_id: string;
      name: string;
      description?: string | null;
      icon_url?: string | null;
      criteria?: Record<string, unknown>;
      points_value?: number;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('badges')
        .insert({
          event_id: badge.event_id,
          name: badge.name,
          description: badge.description,
          icon_url: badge.icon_url,
          criteria: badge.criteria as unknown as Record<string, never>,
          points_value: badge.points_value,
          sort_order: badge.sort_order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['badges', variables.event_id] });
      toast({ title: 'Badge created successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error creating badge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, criteria, ...badge }: Partial<Badge> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...badge };
      if (criteria !== undefined) {
        updateData.criteria = criteria as unknown as Record<string, never>;
      }
      
      const { data, error } = await supabase
        .from('badges')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['badges', data.event_id] });
      toast({ title: 'Badge updated successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error updating badge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['badges', data.eventId] });
      toast({ title: 'Badge deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting badge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ badgeId, registrationId }: { badgeId: string; registrationId: string }) => {
      const { data, error } = await supabase
        .from('badge_awards')
        .insert({
          badge_id: badgeId,
          registration_id: registrationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-badges', variables.registrationId] });
      toast({ title: 'Badge awarded successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error awarding badge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
