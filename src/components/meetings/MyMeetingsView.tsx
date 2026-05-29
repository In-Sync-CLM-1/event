import { useState } from 'react';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { Clock, Check, X, MessageSquare, Calendar, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MeetingBooking, useMeetingBookings, useRespondToBooking } from '@/hooks/useMeetingSpots';
import { MeetingOutcomeForm } from './MeetingOutcomeForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MyMeetingsViewProps {
  eventId: string;
  userRegistrationId: string;
}

export function MyMeetingsView({ eventId, userRegistrationId }: MyMeetingsViewProps) {
  const { data: bookings, isLoading } = useMeetingBookings(eventId, userRegistrationId);
  const respondToBooking = useRespondToBooking();
  const [outcomeBooking, setOutcomeBooking] = useState<MeetingBooking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<MeetingBooking | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const pendingIncoming = bookings?.filter(
    (b) => b.status === 'pending' && b.target_registration_id === userRegistrationId
  );
  const pendingOutgoing = bookings?.filter(
    (b) => b.status === 'pending' && b.requester_registration_id === userRegistrationId
  );
  const confirmed = bookings?.filter((b) => b.status === 'confirmed');
  const completed = bookings?.filter((b) => b.status === 'completed');
  const cancelled = bookings?.filter((b) => b.status === 'cancelled' || b.status === 'declined');

  const getOtherPerson = (booking: MeetingBooking) => {
    return booking.requester_registration_id === userRegistrationId
      ? booking.target
      : booking.requester;
  };

  const handleRespond = async (bookingId: string, status: 'confirmed' | 'declined') => {
    await respondToBooking.mutateAsync({ bookingId, status });
  };

  const handleCancel = async () => {
    if (!cancelBooking) return;
    await respondToBooking.mutateAsync({ bookingId: cancelBooking.id, status: 'cancelled' });
    setCancelBooking(null);
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'completed': return 'outline';
      case 'cancelled':
      case 'declined': return 'destructive';
      default: return 'secondary';
    }
  };

  const renderBookingCard = (booking: MeetingBooking, showActions: 'incoming' | 'outgoing' | 'confirmed' | 'none') => {
    const otherPerson = getOtherPerson(booking);
    const canRecordOutcome = booking.status === 'confirmed' && 
      booking.scheduled_start && isPast(new Date(booking.scheduled_start));

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{otherPerson?.full_name}</h3>
                <Badge variant={statusBadgeVariant(booking.status)}>
                  {booking.status}
                </Badge>
              </div>
              
              {otherPerson?.company && (
                <p className="text-sm text-muted-foreground">
                  {otherPerson.designation && `${otherPerson.designation} at `}
                  {otherPerson.company}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {booking.duration_minutes} minutes
                </span>
                {booking.scheduled_start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(booking.scheduled_start), 'PPp')}
                  </span>
                )}
                {booking.spot?.name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {booking.spot.name}
                  </span>
                )}
              </div>

              {booking.message && (
                <div className="flex items-start gap-2 text-sm bg-muted p-2 rounded">
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{booking.message}</p>
                </div>
              )}

              {booking.status === 'completed' && booking.outcome_rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < booking.outcome_rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {showActions === 'incoming' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(booking.id, 'confirmed')}
                    disabled={respondToBooking.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRespond(booking.id, 'declined')}
                    disabled={respondToBooking.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}
              
              {showActions === 'outgoing' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelBooking(booking)}
                >
                  Cancel Request
                </Button>
              )}

              {showActions === 'confirmed' && (
                <>
                  {canRecordOutcome ? (
                    <Button size="sm" onClick={() => setOutcomeBooking(booking)}>
                      Record Outcome
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {booking.scheduled_start 
                        ? `Starts ${formatDistanceToNow(new Date(booking.scheduled_start), { addSuffix: true })}`
                        : 'Time not scheduled'}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelBooking(booking)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isEmpty = !bookings?.length;

  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No meetings yet</p>
        <p className="text-sm">Request a meeting with another attendee to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingIncoming && pendingIncoming.length > 0 && (
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="secondary">{pendingIncoming.length}</Badge>
              Incoming Requests
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {pendingIncoming.map((booking) => renderBookingCard(booking, 'incoming'))}
          </div>
        </section>
      )}

      {pendingOutgoing && pendingOutgoing.length > 0 && (
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Pending Requests</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {pendingOutgoing.map((booking) => renderBookingCard(booking, 'outgoing'))}
          </div>
        </section>
      )}

      {confirmed && confirmed.length > 0 && (
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {confirmed.map((booking) => renderBookingCard(booking, 'confirmed'))}
          </div>
        </section>
      )}

      {completed && completed.length > 0 && (
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Completed Meetings</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {completed.map((booking) => renderBookingCard(booking, 'none'))}
          </div>
        </section>
      )}

      {cancelled && cancelled.length > 0 && (
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <div className="space-y-3 opacity-60">
            {cancelled.map((booking) => renderBookingCard(booking, 'none'))}
          </div>
        </section>
      )}

      {outcomeBooking && (
        <MeetingOutcomeForm
          booking={outcomeBooking}
          open={!!outcomeBooking}
          onClose={() => setOutcomeBooking(null)}
        />
      )}

      <AlertDialog open={!!cancelBooking} onOpenChange={() => setCancelBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this meeting with {getOtherPerson(cancelBooking!)?.full_name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancel Meeting</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
