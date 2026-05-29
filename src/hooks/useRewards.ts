import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reward {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_required: number;
  quantity: number | null;
  claimed_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RewardClaim {
  id: string;
  reward_id: string;
  registration_id: string;
  claimed_at: string;
  fulfilled: boolean;
  fulfilled_at: string | null;
  fulfilled_by: string | null;
  reward?: Reward;
}

export function useRewards(eventId: string) {
  return useQuery({
    queryKey: ['rewards', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!eventId,
  });
}

export function useActiveRewards(eventId: string) {
  return useQuery({
    queryKey: ['rewards', eventId, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('points_required');

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!eventId,
  });
}

export function useUserClaims(registrationId: string) {
  return useQuery({
    queryKey: ['reward-claims', registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_claims')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('registration_id', registrationId);

      if (error) throw error;
      return data.map(claim => ({
        ...claim,
        reward: claim.reward as Reward,
      })) as RewardClaim[];
    },
    enabled: !!registrationId,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reward: Omit<Reward, 'id' | 'claimed_count' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('rewards')
        .insert(reward)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rewards', variables.event_id] });
      toast({ title: 'Reward created successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error creating reward',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...reward }: Partial<Reward> & { id: string }) => {
      const { data, error } = await supabase
        .from('rewards')
        .update(reward)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rewards', data.event_id] });
      toast({ title: 'Reward updated successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error updating reward',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rewards', data.eventId] });
      toast({ title: 'Reward deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting reward',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ rewardId, registrationId, eventId }: { 
      rewardId: string; 
      registrationId: string;
      eventId: string;
    }) => {
      // First check if reward is still available
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('quantity, claimed_count')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      if (reward.quantity !== null && reward.claimed_count >= reward.quantity) {
        throw new Error('This reward is no longer available');
      }

      const { data, error } = await supabase
        .from('reward_claims')
        .insert({
          reward_id: rewardId,
          registration_id: registrationId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update claimed count manually
      await supabase
        .from('rewards')
        .update({ claimed_count: (reward.claimed_count || 0) + 1 })
        .eq('id', rewardId);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reward-claims', variables.registrationId] });
      queryClient.invalidateQueries({ queryKey: ['rewards', variables.eventId] });
      toast({ title: 'Reward claimed successfully!' });
    },
    onError: (error) => {
      toast({
        title: 'Error claiming reward',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useFulfillClaim() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (claimId: string) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reward_claims')
        .update({
          fulfilled: true,
          fulfilled_at: new Date().toISOString(),
          fulfilled_by: user.user?.id,
        })
        .eq('id', claimId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-claims'] });
      toast({ title: 'Claim fulfilled' });
    },
    onError: (error) => {
      toast({
        title: 'Error fulfilling claim',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
