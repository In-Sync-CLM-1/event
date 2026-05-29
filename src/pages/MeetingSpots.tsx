import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRegistration, useMeetingBookings } from '@/hooks/useMeetingSpots';
import { useEvents } from '@/hooks/useEvents';
import { MeetingSpotBooking } from '@/components/meetings/MeetingSpotBooking';
import { MyMeetingsView } from '@/components/meetings/MyMeetingsView';
import { Badge } from '@/components/ui/badge';

export default function MeetingSpots() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: registration, isLoading: registrationLoading } = useUserRegistration(eventId, user?.email);
  const { data: bookings } = useMeetingBookings(eventId, registration?.id);

  const event = events?.find((e) => e.id === eventId);
  const isLoading = eventsLoading || registrationLoading;

  const pendingIncomingCount = bookings?.filter(
    (b) => b.status === 'pending' && b.target_registration_id === registration?.id
  ).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Event not found</p>
            <Link to="/events">
              <Button variant="link">Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-8">
          <Link to={`/events/${eventId}`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Spots</CardTitle>
              <CardDescription>Connect with other attendees at {event.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to be registered for this event to book meetings with other attendees.
                  <Link to={`/events/${eventId}`} className="ml-1 underline">
                    Register now
                  </Link>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <Link to={`/events/${eventId}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Meeting Spots
            </CardTitle>
            <CardDescription>
              Schedule face-to-face meetings with other attendees at {event.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="book" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="book" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Book a Meeting
                </TabsTrigger>
                <TabsTrigger value="my-meetings" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  My Meetings
                  {pendingIncomingCount > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {pendingIncomingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="book">
                <MeetingSpotBooking eventId={eventId!} userRegistrationId={registration.id} />
              </TabsContent>

              <TabsContent value="my-meetings">
                <MyMeetingsView eventId={eventId!} userRegistrationId={registration.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
