import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Registration, RegistrationStatus } from '@/types/database';
import type { Json } from '@/integrations/supabase/types';
import QRCode from 'qrcode';

// Generate unique registration number
function generateRegistrationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EV${timestamp}${random}`;
}

// Generate QR code as data URL
async function generateQRCode(registrationNumber: string): Promise<string> {
  try {
    return await QRCode.toDataURL(registrationNumber, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return '';
  }
}

export function useRegistrations(eventId: string) {
  return useQuery({
    queryKey: ['registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data as Registration[];
    },
    enabled: !!eventId,
  });
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ['registration', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, event:events(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useRegistrationByNumber(registrationNumber: string) {
  return useQuery({
    queryKey: ['registration-number', registrationNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, event:events(*)')
        .eq('registration_number', registrationNumber)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!registrationNumber,
  });
}

export function useMyRegistrations(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-registrations', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*, event:events(*)')
        .eq('user_id', userId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

interface CreateRegistrationInput {
  event_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  designation?: string;
  linkedin_url?: string;
  custom_fields?: Json;
  user_id?: string;
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRegistrationInput) => {
      // Check event capacity
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('max_capacity, registration_deadline')
        .eq('id', input.event_id)
        .single();

      if (eventError) throw eventError;

      // Check registration deadline
      if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
        throw new Error('Registration deadline has passed');
      }

      // Check capacity if set
      if (event.max_capacity) {
        const { count, error: countError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', input.event_id)
          .in('status', ['pending', 'confirmed', 'checked_in']);

        if (countError) throw countError;

        if (count && count >= event.max_capacity) {
          // Add to waitlist
          input = { ...input };
        }
      }

      // Check for duplicate registration
      const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', input.event_id)
        .eq('email', input.email.toLowerCase())
        .maybeSingle();

      if (existing) {
        throw new Error('You have already registered for this event');
      }

      // Generate registration number and QR code
      const registration_number = generateRegistrationNumber();
      const qr_code = await generateQRCode(registration_number);

      const { data, error } = await supabase
        .from('registrations')
        .insert({
          event_id: input.event_id,
          email: input.email.toLowerCase(),
          full_name: input.full_name,
          phone: input.phone,
          company: input.company,
          designation: input.designation,
          linkedin_url: input.linkedin_url,
          custom_fields: input.custom_fields || {},
          user_id: input.user_id,
          registration_number,
          qr_code,
          status: 'confirmed' as RegistrationStatus,
          confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Registration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
    },
  });
}

interface UpdateRegistrationInput {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  company?: string;
  designation?: string;
  status?: RegistrationStatus;
  custom_fields?: Json;
  checked_in_at?: string;
  confirmed_at?: string;
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateRegistrationInput) => {
      const { data, error } = await supabase
        .from('registrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Registration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['registration', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, eventId, sessionId, checkedInBy }: {
      registrationId: string;
      eventId: string;
      sessionId?: string;
      checkedInBy?: string;
    }) => {
      // Create check-in record
      const { error: checkInError } = await supabase.from('check_ins').insert({
        registration_id: registrationId,
        event_id: eventId,
        session_id: sessionId,
        checked_in_by: checkedInBy,
        method: 'qr_scan',
      });

      if (checkInError) throw checkInError;

      // Update registration status
      const { data, error } = await supabase
        .from('registrations')
        .update({
          status: 'checked_in' as RegistrationStatus,
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) throw error;
      return data as Registration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['registration', data.id] });
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
    },
  });
}
