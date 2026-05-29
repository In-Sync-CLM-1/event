import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Invitation {
  id: string;
  event_id: string;
  inviter_id: string;
  referral_code: string;
  invitee_email: string | null;
  invitee_name: string | null;
  status: 'pending' | 'sent' | 'registered' | 'checked_in';
  registration_id: string | null;
  sent_at: string | null;
  registered_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitationWithEvent extends Invitation {
  events?: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useInvitations(eventId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: ['invitations', user?.id, eventId],
    queryFn: async () => {
      let query = supabase
        .from('invitations')
        .select(`
          *,
          events:event_id (
            id,
            title,
            start_date,
            end_date
          )
        `)
        .eq('inviter_id', user!.id)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InvitationWithEvent[];
    },
    enabled: !!user,
  });

  const createInvitation = useMutation({
    mutationFn: async (data: {
      event_id: string;
      invitee_email?: string;
      invitee_name?: string;
    }) => {
      const referralCode = generateReferralCode();
      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert({
          event_id: data.event_id,
          inviter_id: user!.id,
          referral_code: referralCode,
          invitee_email: data.invitee_email || null,
          invitee_name: data.invitee_name || null,
          status: data.invitee_email ? 'sent' : 'pending',
          sent_at: data.invitee_email ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const updateInvitation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invitation> & { id: string }) => {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const getInvitationStats = useQuery({
    queryKey: ['invitation-stats', user?.id, eventId],
    queryFn: async () => {
      let query = supabase
        .from('invitations')
        .select('status')
        .eq('inviter_id', user!.id);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(i => i.status === 'pending').length,
        sent: data.filter(i => i.status === 'sent').length,
        registered: data.filter(i => i.status === 'registered').length,
        checked_in: data.filter(i => i.status === 'checked_in').length,
      };

      return stats;
    },
    enabled: !!user,
  });

  return {
    invitations: invitationsQuery.data || [],
    isLoading: invitationsQuery.isLoading,
    error: invitationsQuery.error,
    stats: getInvitationStats.data,
    createInvitation,
    updateInvitation,
    refetch: invitationsQuery.refetch,
  };
}
