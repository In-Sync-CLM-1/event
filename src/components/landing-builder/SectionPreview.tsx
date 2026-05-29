import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LandingPageSection } from '@/hooks/useLandingPage';

interface SectionPreviewProps {
  section: LandingPageSection;
  event?: {
    title: string;
    description?: string;
    banner_url?: string;
    start_date: string;
    end_date: string;
    venue?: string;
    city?: string;
    speakers?: Array<{
      id: string;
      name: string;
      title?: string;
      company?: string;
      photo_url?: string;
    }>;
    sessions?: Array<{
      id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      location?: string;
    }>;
    sponsors?: Array<{
      id: string;
      name: string;
      logo_url?: string;
      website_url?: string;
      tier?: string;
    }>;
  };
}

export function SectionPreview({ section, event }: SectionPreviewProps) {
  const config = section.config;

  switch (section.type) {
    case 'hero':
      return (
        <div
          className="relative min-h-[400px] flex items-center justify-center text-center text-white"
          style={{
            backgroundImage: config.backgroundImage
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.backgroundImage})`
              : event?.banner_url
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${event.banner_url})`
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="max-w-3xl px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {config.headline || event?.title || 'Event Title'}
            </h1>
            {(config.subheadline || event?.description) && (
              <p className="text-xl opacity-90 mb-8">
                {config.subheadline || event?.description?.slice(0, 150)}
              </p>
            )}
            {event && (
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm opacity-80">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.start_date), 'MMMM d, yyyy')}
                </span>
                {event.venue && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.venue}{event.city && `, ${event.city}`}
                  </span>
                )}
              </div>
            )}
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              {config.ctaText || 'Register Now'}
            </Button>
          </div>
        </div>
      );

    case 'about':
      return (
        <div className="py-16 px-6 max-w-4xl mx-auto">
          <div className={`grid gap-8 ${config.imageUrl ? 'md:grid-cols-2 items-center' : ''}`}>
            <div>
              <h2 className="text-3xl font-bold mb-6">
                {config.title || 'About This Event'}
              </h2>
              <div className="prose prose-lg text-muted-foreground whitespace-pre-wrap">
                {config.content || event?.description || 'Add your event description here...'}
              </div>
            </div>
            {config.imageUrl && (
              <div>
                <img
                  src={config.imageUrl}
                  alt=""
                  className="rounded-lg shadow-lg w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      );

    case 'speakers':
      const speakers = event?.speakers || [];
      return (
        <div className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">
              {config.title || 'Meet Our Speakers'}
            </h2>
            {speakers.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {speakers.map((speaker) => (
                  <div
                    key={speaker.id}
                    className="bg-card rounded-xl p-6 text-center shadow-sm"
                  >
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={speaker.photo_url || undefined} alt={speaker.name} />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {speaker.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{speaker.name}</h3>
                    {speaker.title && (
                      <p className="text-sm text-muted-foreground">
                        {speaker.title}
                        {speaker.company && ` at ${speaker.company}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No speakers added yet. Add speakers in the event management section.
              </p>
            )}
          </div>
        </div>
      );

    case 'agenda':
      const sessions = event?.sessions || [];
      return (
        <div className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">
              {config.title || 'Event Schedule'}
            </h2>
            {sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map((session) => (
                    <div
                      key={session.id}
                      className="flex gap-4 p-5 bg-card rounded-lg border"
                    >
                      <div className="text-sm text-muted-foreground min-w-[100px]">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.start_time), 'h:mm a')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{session.title}</h3>
                        {session.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {session.description}
                          </p>
                        )}
                        {session.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No sessions added yet. Add sessions in the event management section.
              </p>
            )}
          </div>
        </div>
      );

    case 'sponsors':
      const sponsors = event?.sponsors || [];
      return (
        <div className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">
              {config.title || 'Our Sponsors'}
            </h2>
            {sponsors.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-8">
                {sponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.website_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 bg-card rounded-lg hover:shadow-md transition-shadow"
                  >
                    {sponsor.logo_url ? (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.name}
                        className="h-16 object-contain"
                      />
                    ) : (
                      <span className="text-lg font-semibold">{sponsor.name}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No sponsors added yet. Add sponsors in the event management section.
              </p>
            )}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="py-20 px-6 bg-primary text-primary-foreground text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              {config.headline || 'Ready to Join?'}
            </h2>
            {config.description && (
              <p className="text-lg opacity-90 mb-8">{config.description}</p>
            )}
            <Button size="lg" variant="secondary">
              {config.buttonText || 'Register Now'}
            </Button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
