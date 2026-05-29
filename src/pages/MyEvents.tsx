import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Loader2, User, ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { SharedContentTab } from '@/components/my-events/SharedContentTab';
import { InvitationsTab } from '@/components/my-events/InvitationsTab';

export default function MyEvents() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: registrations, isLoading: registrationsLoading } = useMyRegistrations(user?.id);

  const isLoading = authLoading || registrationsLoading;

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
            Please sign in to view your registered events.
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      confirmed: 'default',
      pending: 'secondary',
      checked_in: 'default',
      cancelled: 'destructive',
      waitlisted: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="container-mobile py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground mt-1">
            Your events, shared content, and invitations
          </p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="content">Shared Content</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            {!registrations || registrations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    You haven't registered for any events yet. Browse our upcoming events and find something interesting!
                  </p>
                  <Button asChild>
                    <Link to="/events">
                      Browse Events
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {registrations.map((registration: any) => {
                  const event = registration.event;
                  if (!event) return null;

                  return (
                    <Card key={registration.id} className="overflow-hidden flex flex-col">
                      {event.banner_url && (
                        <div className="aspect-video bg-muted overflow-hidden">
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-5 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
                          {getStatusBadge(registration.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {format(new Date(event.start_date), 'MMM d, yyyy')}
                              {event.end_date !== event.start_date && (
                                <> - {format(new Date(event.end_date), 'MMM d, yyyy')}</>
                              )}
                            </span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="line-clamp-1">{event.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Registered {format(new Date(registration.registered_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-5 pt-0">
                        <Button asChild className="w-full">
                          <Link to={`/events/${event.slug}`}>
                            View Event
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content">
            <SharedContentTab />
          </TabsContent>

          <TabsContent value="invitations">
            <InvitationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
