import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { LandingPageBuilder } from '@/components/landing-builder/LandingPageBuilder';
import { useEvent } from '@/hooks/useEvents';
import { useSessions } from '@/hooks/useSessions';
import { useSpeakers } from '@/hooks/useSpeakers';

export default function LandingPageAdmin() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: sessions } = useSessions(eventId);
  const { data: speakers } = useSpeakers(eventId);

  if (eventLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Button asChild className="mt-4">
            <Link to="/admin/events">Back to Events</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  // Transform event data for the builder
  const eventData = {
    title: event.title,
    description: event.description || undefined,
    banner_url: event.banner_url || undefined,
    start_date: event.start_date,
    end_date: event.end_date,
    venue: event.venue || undefined,
    city: event.city || undefined,
    speakers: speakers || [],
    sessions: sessions || [],
    sponsors: (event as any).sponsors || [],
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b bg-card">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Landing Page Builder</h1>
            <p className="text-sm text-muted-foreground">{event.title}</p>
          </div>
        </div>

        {/* Builder */}
        <div className="flex-1 overflow-hidden">
          <LandingPageBuilder eventId={eventId!} event={eventData} />
        </div>
      </div>
    </AdminLayout>
  );
}
