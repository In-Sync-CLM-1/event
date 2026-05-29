import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Share2, ArrowLeft, Loader2, UserPlus, CalendarDays, Video, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvent } from '@/hooks/useEvents';
import { useLandingPage, type LandingPageSection } from '@/hooks/useLandingPage';
import { RegistrationForm } from '@/components/events/RegistrationForm';
import { AttendeeCheckIn } from '@/components/events/AttendeeCheckIn';
import { SectionPreview } from '@/components/landing-builder/SectionPreview';
import { AgendaView } from '@/components/events/AgendaView';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRegistrations } from '@/hooks/useRegistrations';
import { useToast } from '@/hooks/use-toast';
import { PRODUCTION_URL } from '@/lib/constants';

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = useEvent(slug || '');
  const { data: landingPage, isLoading: landingLoading } = useLandingPage(event?.id);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(event?.id);
  const { user } = useAuth();
  const { data: myRegistrations } = useMyRegistrations(user?.id);
  const registration = myRegistrations?.find((r: any) => r.event_id === event?.id);
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title,
          text: event?.description || '',
          url: `${PRODUCTION_URL}${window.location.pathname}`,
        });
      } else {
        await navigator.clipboard.writeText(`${PRODUCTION_URL}${window.location.pathname}`);
        toast({
          title: 'Link copied!',
          description: 'Event link has been copied to clipboard.',
        });
      }
    } catch (error) {
      // User cancelled share
    }
  };

  if (isLoading || landingLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !event) {
    return (
      <MainLayout>
        <div className="container-mobile py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <p className="text-muted-foreground mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Check if there's a published custom landing page
  const hasCustomLandingPage = landingPage?.is_published;
  
  // If using custom HTML
  if (hasCustomLandingPage && landingPage.page_type === 'html' && landingPage.custom_html) {
    return (
      <>
        <style>{landingPage.custom_css || ''}</style>
        <div dangerouslySetInnerHTML={{ __html: landingPage.custom_html }} />
      </>
    );
  }

  // If using builder sections
  if (hasCustomLandingPage && landingPage.page_type === 'builder' && landingPage.sections.length > 0) {
    const eventData = {
      title: event.title,
      description: event.description || undefined,
      banner_url: event.banner_url || undefined,
      start_date: event.start_date,
      end_date: event.end_date,
      venue: event.venue || undefined,
      city: event.city || undefined,
      speakers: event.speakers || [],
      sessions: event.sessions || [],
      sponsors: event.sponsors || [],
    };

    return (
      <MainLayout>
        {/* Navigation overlay for custom pages */}
        <div className="fixed top-20 left-4 z-50">
          <Button variant="secondary" size="sm" asChild className="shadow-lg">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <div className="fixed top-20 right-4 z-50">
          <Button variant="secondary" size="icon" className="shadow-lg" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Custom Builder Sections */}
        <div>
          {landingPage.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <SectionPreview key={section.id} section={section} event={eventData} />
            ))}
        </div>

        {/* Floating Registration CTA */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button size="lg" className="shadow-lg" asChild>
            <a href="#register">Register Now</a>
          </Button>
        </div>

        {/* Registration Section */}
        <div id="register" className="py-16 px-6 bg-muted/30">
          <div className="max-w-md mx-auto">
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Register Now</h2>
              <RegistrationForm eventId={event.id} />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Default event page
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();
  const registrationClosed = event.registration_deadline 
    ? new Date(event.registration_deadline) < new Date() 
    : false;

  return (
    <MainLayout>
      {/* Hero Banner */}
      <div className="relative">
        <div className="aspect-[21/9] md:aspect-[3/1] bg-gradient-to-br from-primary/20 to-accent/20">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-20 w-20 text-primary/30" />
            </div>
          )}
        </div>
        
        {/* Back button overlay */}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild className="shadow-lg">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Share button overlay */}
        <div className="absolute top-4 right-4">
          <Button variant="secondary" size="icon" className="shadow-lg" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container-mobile py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge>{format(startDate, 'EEEE, MMMM d, yyyy')}</Badge>
                {event.max_capacity && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {event.max_capacity} spots
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
            </div>

            {/* Event Details */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                <span>
                  {isMultiDay
                    ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                    : format(startDate, 'MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </span>
              </div>
              {event.venue && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>
                    {event.venue}
                    {event.city && `, ${event.city}`}
                  </span>
                </div>
              )}
              {(event as any).mode && (event as any).mode !== 'in_person' && (
                <div className="flex items-center gap-2 text-violet-600">
                  <Video className="h-5 w-5" />
                  <span className="font-medium capitalize">{(event as any).mode === 'hybrid' ? 'Hybrid Event' : 'Virtual Event'}</span>
                </div>
              )}
            </div>

            {/* Virtual join banner for registered attendees */}
            {(event as any).virtual_join_url && registration && (
              <a
                href={(event as any).virtual_join_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors group"
              >
                <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-violet-900 text-sm">Join Online</p>
                  <p className="text-violet-600 text-xs">Click to open the event stream / meeting room</p>
                </div>
                <ExternalLink className="h-4 w-4 text-violet-400 group-hover:text-violet-600 transition-colors" />
              </a>
            )}

            <Separator />

            {/* Description */}
            {event.description && (
              <div className="prose prose-sm max-w-none">
                <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Speakers</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {event.speakers.map((speaker) => (
                    <div
                      key={speaker.id}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                    >
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={speaker.photo_url || undefined} alt={speaker.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {speaker.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{speaker.name}</h3>
                        {speaker.title && (
                          <p className="text-sm text-muted-foreground">
                            {speaker.title}
                            {speaker.company && ` at ${speaker.company}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda */}
            {sessions && sessions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Agenda</h2>
                  {registration && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/events/${slug}/my-schedule`}>
                        <CalendarDays className="h-4 w-4 mr-2" />
                        My Schedule
                      </Link>
                    </Button>
                  )}
                </div>
                <AgendaView
                  sessions={sessions}
                  registrationId={registration?.id}
                  eventId={event.id}
                  eventMode={(event as any).mode ?? 'in_person'}
                  eventSlug={event.slug}
                  isLoading={sessionsLoading}
                />
              </div>
            )}

            {/* Sponsors */}
            {event.sponsors && event.sponsors.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Sponsors</h2>
                <div className="flex flex-wrap gap-4">
                  {event.sponsors.map((sponsor) => (
                    <a
                      key={sponsor.id}
                      href={sponsor.website_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      {sponsor.logo_url ? (
                        <img
                          src={sponsor.logo_url}
                          alt={sponsor.name}
                          className="h-12 object-contain"
                        />
                      ) : (
                        <span className="font-medium">{sponsor.name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Registration & Check-in Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Meeting Spots Link */}
            <Link to={`/events/${event.id}/meeting-spots`}>
              <Button variant="outline" className="w-full justify-start gap-2">
                <UserPlus className="h-4 w-4" />
                Book a Meeting with Attendees
              </Button>
            </Link>

            <div className="sticky top-20">
              <Tabs defaultValue="register" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="register">Register</TabsTrigger>
                  <TabsTrigger value="checkin">Check In</TabsTrigger>
                </TabsList>
                <TabsContent value="register" className="mt-4">
                  <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Register Now</h2>
                    
                    {registrationClosed ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">
                          Registration for this event has closed.
                        </p>
                      </div>
                    ) : (
                      <RegistrationForm eventId={event.id} />
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="checkin" className="mt-4">
                  <AttendeeCheckIn eventId={event.id} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
