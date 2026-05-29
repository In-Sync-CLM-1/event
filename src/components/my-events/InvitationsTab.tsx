import { format } from 'date-fns';
import { Mail, Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function InvitationsTab() {
  const { user } = useAuth();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['my-invitations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          events:event_id (
            id,
            title,
            slug,
            start_date,
            end_date,
            venue,
            banner_url
          )
        `)
        .eq('invitee_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No invitations</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Invitations to upcoming events will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'outline',
      sent: 'secondary',
      registered: 'default',
      checked_in: 'default',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {invitations.map((invitation: any) => {
        const event = invitation.events;
        if (!event) return null;

        return (
          <Card key={invitation.id} className="overflow-hidden flex flex-col">
            {event.banner_url && (
              <div className="aspect-video bg-muted overflow-hidden">
                <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-4 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold line-clamp-2">{event.title}</h4>
                {getStatusBadge(invitation.status)}
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{format(new Date(event.start_date), 'MMM d, yyyy')}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                )}
              </div>
              {invitation.status === 'pending' || invitation.status === 'sent' ? (
                <Button asChild className="w-full" size="sm">
                  <Link to={`/events/${event.slug}`}>
                    Register Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link to={`/events/${event.slug}`}>
                    View Event
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
