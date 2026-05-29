import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCertificates(eventId: string | undefined) {
  return useQuery({
    queryKey: ['certificates', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('certificates')
        .select(`*, registration:registrations(id, full_name, email, registration_number)`)
        .eq('event_id', eventId)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

export function useCertificateByNumber(certificateNumber: string | undefined) {
  return useQuery({
    queryKey: ['certificate', certificateNumber],
    queryFn: async () => {
      if (!certificateNumber) return null;
      const { data, error } = await supabase
        .from('certificates')
        .select(`*, registration:registrations(id, full_name, email), event:events(id, title, start_date, end_date)`)
        .eq('certificate_number', certificateNumber)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!certificateNumber,
  });
}

export function useCertificateTemplates(eventId: string | undefined) {
  return useQuery({
    queryKey: ['certificate-templates', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
}

function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export function useBulkIssueCertificates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, registrationIds, templateId }: { eventId: string; registrationIds: string[]; templateId?: string }) => {
      const certificates = registrationIds.map(registrationId => ({
        event_id: eventId,
        registration_id: registrationId,
        template_id: templateId || null,
        certificate_number: generateCertificateNumber(),
      }));
      const { data, error } = await supabase.from('certificates').insert(certificates).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificates', variables.eventId] });
    },
  });
}
