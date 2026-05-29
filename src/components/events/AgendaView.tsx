import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, User, Plus, Check, Loader2, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddToSchedule, useRemoveFromSchedule, useAttendeeSchedule } from '@/hooks/useAttendeeSchedule';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { SessionWithSpeakers } from '@/types/database';

interface AgendaViewProps {
  sessions: SessionWithSpeakers[];
  registrationId?: string;
  eventId?: string;
  eventMode?: 'in_person' | 'virtual' | 'hybrid';
  eventSlug?: string;
  isLoading?: boolean;
}

function jitsiUrl(eventSlug: string, sessionId: string) {
  return `https://meet.jit.si/eventsync-${eventSlug}-${sessionId.slice(0, 8)}`;
}

function resolveJoinUrl(session: SessionWithSpeakers, eventSlug?: string): string | null {
  if (session.virtual_join_url) return session.virtual_join_url;
  if (eventSlug) return jitsiUrl(eventSlug, session.id);
  return null;
}

export function AgendaView({ sessions, registrationId, eventId, eventMode = 'in_person', eventSlug, isLoading }: AgendaViewProps) {
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const { data: schedule } = useAttendeeSchedule(registrationId);
  const addToSchedule = useAddToSchedule();
  const removeFromSchedule = useRemoveFromSchedule();
  const { toast } = useToast();
  const isVirtual = eventMode === 'virtual' || eventMode === 'hybrid';

  const handleJoinSession = async (session: SessionWithSpeakers) => {
    const joinUrl = resolveJoinUrl(session, eventSlug);
    if (!joinUrl) return;

    // Virtual check-in: log it in check_ins (best-effort, don't block join)
    if (registrationId && eventId) {
      supabase.from('check_ins').insert({
        registration_id: registrationId,
        session_id: session.id,
        event_id: eventId,
        method: 'virtual',
        check_in_time: new Date().toISOString(),
      }).then(() => {
        supabase
          .from('registrations')
          .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
          .eq('id', registrationId)
          .eq('status', 'confirmed')
          .then(() => {});
      });
    }

    window.open(joinUrl, '_blank', 'noopener,noreferrer');
  };

  const isInSchedule = (sessionId: string) => {
    return schedule?.some((item: any) => item.session_id === sessionId) || false;
  };

  const handleToggleSchedule = async (sessionId: string) => {
    if (!registrationId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in and register to add sessions to your schedule.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isInSchedule(sessionId)) {
        await removeFromSchedule.mutateAsync({ registrationId, sessionId });
        toast({ title: 'Removed from your schedule' });
      } else {
        await addToSchedule.mutateAsync({ registrationId, sessionId });
        toast({ title: 'Added to your schedule' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your schedule.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No sessions scheduled</h2>
          <p className="text-muted-foreground">
            Check back later for the event agenda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get unique tracks
  const tracks = ['all', ...new Set(sessions.map(s => s.track || 'Main Track'))];

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc: Record<string, SessionWithSpeakers[]>, session) => {
    const date = format(new Date(session.start_time), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const dates = Object.keys(sessionsByDate).sort();

  // Filter sessions by track
  const filterSessions = (daySessions: SessionWithSpeakers[]) => {
    if (trackFilter === 'all') return daySessions;
    return daySessions.filter(s => (s.track || 'Main Track') === trackFilter);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={trackFilter} onValueChange={setTrackFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by track" />
          </SelectTrigger>
          <SelectContent>
            {tracks.map((track) => (
              <SelectItem key={track} value={track}>
                {track === 'all' ? 'All Tracks' : track}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Day Tabs */}
      <Tabs defaultValue={dates[0]} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-2">
          {dates.map((date) => (
            <TabsTrigger key={date} value={date} className="px-4">
              {format(new Date(date), 'EEE, MMM d')}
            </TabsTrigger>
          ))}
        </TabsList>

        {dates.map((date) => {
          const daySessions = filterSessions(sessionsByDate[date]);
          
          return (
            <TabsContent key={date} value={date} className="space-y-4">
              {daySessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No sessions matching the selected filter.
                </p>
              ) : (
                daySessions
                  .sort((a, b) => 
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                  )
                  .map((session) => {
                    const inSchedule = isInSchedule(session.id);

                    return (
                      <Card key={session.id} className={inSchedule ? 'ring-2 ring-primary' : ''}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start gap-4">
                                <div className="text-center min-w-[80px] bg-muted rounded-lg p-2">
                                  <p className="text-lg font-semibold">
                                    {format(new Date(session.start_time), 'h:mm')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(session.start_time), 'a')}
                                  </p>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start gap-2">
                                    <h3 className="font-semibold text-lg">{session.title}</h3>
                                    {session.track && (
                                      <Badge variant="outline" className="shrink-0">
                                        {session.track}
                                      </Badge>
                                    )}
                                  </div>
                                  {session.description && (
                                    <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                                      {session.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      {format(new Date(session.start_time), 'h:mm a')} - 
                                      {format(new Date(session.end_time), 'h:mm a')}
                                    </div>
                                    {session.location && (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {session.location}
                                      </div>
                                    )}
                                    {isVirtual && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Video className="h-3 w-3" />
                                        {session.virtual_join_url ? 'Custom room' : 'Jitsi room'}
                                      </Badge>
                                    )}
                                  </div>
                                  {session.speakers && session.speakers.length > 0 && (
                                    <div className="flex items-center gap-2 mt-3">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {session.speakers.map(s => s.name).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              {isVirtual && (
                                <Button
                                  size="sm"
                                  className="bg-violet-600 hover:bg-violet-700 text-white"
                                  onClick={() => handleJoinSession(session)}
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Session
                                  <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                                </Button>
                              )}
                              {registrationId && (
                                <Button
                                  variant={inSchedule ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleToggleSchedule(session.id)}
                                  disabled={addToSchedule.isPending || removeFromSchedule.isPending}
                                >
                                  {inSchedule ? (
                                    <>
                                      <Check className="h-4 w-4 mr-2" />
                                      In My Schedule
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add to Schedule
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
