// Database types for the Event Management Platform

export type AppRole = 'super_admin' | 'event_manager' | 'staff' | 'attendee' | 'sales_rep' | 'platform_admin';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventMode = 'in_person' | 'virtual' | 'hybrid';
export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'checked_in';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  designation: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  max_capacity: number | null;
  banner_url: string | null;
  logo_url: string | null;
  mode: EventMode;
  virtual_join_url: string | null;
  status: EventStatus;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventOrganizer {
  id: string;
  event_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Speaker {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  title: string | null;
  company: string | null;
  bio: string | null;
  photo_url: string | null;
  social_links: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  track: string | null;
  max_capacity: number | null;
  virtual_join_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SessionSpeaker {
  id: string;
  session_id: string;
  speaker_id: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string | null;
  registration_number: string;
  email: string;
  full_name: string;
  phone: string | null;
  company: string | null;
  designation: string | null;
  linkedin_url: string | null;
  status: RegistrationStatus;
  custom_fields: Record<string, unknown>;
  qr_code: string | null;
  registered_at: string;
  confirmed_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  registration_id: string;
  session_id: string | null;
  event_id: string;
  check_in_time: string;
  check_out_time: string | null;
  checked_in_by: string | null;
  method: string;
  created_at: string;
}

export interface Sponsor {
  id: string;
  event_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  sort_order: number;
  created_at: string;
}

// Extended types with relations
export interface EventWithDetails extends Event {
  sessions?: Session[];
  speakers?: Speaker[];
  sponsors?: Sponsor[];
  registrations_count?: number;
}

export interface RegistrationWithEvent extends Registration {
  event?: Event;
}

export interface SessionWithSpeakers extends Session {
  speakers?: Speaker[];
}
