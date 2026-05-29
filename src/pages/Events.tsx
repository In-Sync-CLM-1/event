import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

export default function Events() {
  const { data: events, isLoading, error } = useEvents('published');
  const { isAdmin } = useAuth();

  return (
    <MainLayout>
      <div className="container-mobile py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Upcoming Events</h1>
          <p className="text-muted-foreground mt-2">
            Discover and register for upcoming events
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive">Failed to load events</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : events?.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No events yet</h2>
            <p className="text-muted-foreground mb-6">
              Check back later for upcoming events
            </p>
            {isAdmin && (
              <Button asChild>
                <Link to="/admin/events/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events?.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.slug}`}
                className="group block"
              >
                <article className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Event Banner */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative">
                    {event.banner_url ? (
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">
                        {format(new Date(event.start_date), 'MMM d, yyyy')}
                      </Badge>
                      {event.max_capacity && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {event.max_capacity}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    {event.venue && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{event.venue}</span>
                        {event.city && <span>, {event.city}</span>}
                      </div>
                    )}

                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <Button variant="outline" className="w-full mt-4">
                      View Details
                    </Button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
