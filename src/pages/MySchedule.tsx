import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendeeSchedule, useRemoveFromSchedule } from '@/hooks/useAttendeeSchedule';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

export default function MySchedule() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Find user's registration for this event
  const { data: registrations, isLoading: registrationsLoading } = useMyRegistrations(user?.id);
  const registration = registrations?.find((r: any) => r.event?.slug === eventSlug);
  
  const { data: schedule, isLoading: scheduleLoading } = useAttendeeSchedule(registration?.id);
  const { data: event, isLoading: eventLoading } = useEvent(registration?.event_id);
  const removeFromSchedule = useRemoveFromSchedule();

  const handleRemoveSession = async (sessionId: string) => {
    if (!registration) return;

    try {
      await removeFromSchedule.mutateAsync({
        registrationId: registration.id,
        sessionId,
      });
      toast({ title: 'Session removed from your schedule' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove session.',
        variant: 'destructive',
      });
    }
  };

  const downloadICS = () => {
    if (!schedule || !event) return;

    const icsContent = schedule.map((item: any) => {
      const session = item.sessions;
      const start = new Date(session.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(session.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return `BEGIN:VEVENT
UID:${session.id}@event-sync
DTSTART:${start}
DTEND:${end}
SUMMARY:${session.title}
DESCRIPTION:${session.description || ''}
LOCATION:${session.location || event.venue || ''}
END:VEVENT`;
    }).join('\n');

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event-Sync//EN
${icsContent}
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}-my-schedule.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = registrationsLoading || scheduleLoading || eventLoading;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-12 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your schedule.
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!registration) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Registration Found</h1>
          <p className="text-muted-foreground mb-6">
            You are not registered for this event.
          </p>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Group sessions by date
  const sessionsByDate = schedule?.reduce((acc: Record<string, any[]>, item: any) => {
    const date = format(new Date(item.sessions.start_time), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {}) || {};

  const dates = Object.keys(sessionsByDate).sort();

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/events/${eventSlug}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground mt-1">{event?.title}</p>
          </div>
          {schedule && schedule.length > 0 && (
            <Button variant="outline" onClick={downloadICS}>
              <Download className="h-4 w-4 mr-2" />
              Export to Calendar
            </Button>
          )}
        </div>

        {!schedule || schedule.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No sessions added yet</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Browse the event agenda and add sessions to build your personal schedule.
              </p>
              <Button asChild>
                <Link to={`/events/${eventSlug}/agenda`}>Browse Agenda</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={dates[0]} className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-2">
              {dates.map((date) => (
                <TabsTrigger key={date} value={date} className="px-4">
                  {format(new Date(date), 'EEE, MMM d')}
                  <Badge variant="secondary" className="ml-2">
                    {sessionsByDate[date].length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {dates.map((date) => (
              <TabsContent key={date} value={date} className="space-y-4">
                {sessionsByDate[date]
                  .sort((a: any, b: any) => 
                    new Date(a.sessions.start_time).getTime() - new Date(b.sessions.start_time).getTime()
                  )
                  .map((item: any) => {
                    const session = item.sessions;
                    const speakers = session.session_speakers?.map((ss: any) => ss.speakers).filter(Boolean) || [];

                    return (
                      <Card key={item.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start gap-4">
                                <div className="text-center min-w-[80px]">
                                  <p className="text-lg font-semibold">
                                    {format(new Date(session.start_time), 'h:mm a')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(session.end_time), 'h:mm a')}
                                  </p>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{session.title}</h3>
                                  {session.description && (
                                    <p className="text-muted-foreground mt-1 text-sm">
                                      {session.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                    {session.location && (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {session.location}
                                      </div>
                                    )}
                                    {session.track && (
                                      <Badge variant="outline">{session.track}</Badge>
                                    )}
                                  </div>
                                  {speakers.length > 0 && (
                                    <div className="flex items-center gap-2 mt-3">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {speakers.map((s: any) => s.name).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveSession(session.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
