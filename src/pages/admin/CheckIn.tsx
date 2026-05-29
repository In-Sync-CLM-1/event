import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, QrCode, Search, Loader2, Users } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QRScanner } from '@/components/admin/QRScanner';
import { CheckInSearch } from '@/components/admin/CheckInSearch';
import { CheckInConfirmation } from '@/components/admin/CheckInConfirmation';
import { AttendanceStats } from '@/components/admin/AttendanceStats';
import { useEvent } from '@/hooks/useEvents';
import { useEvents } from '@/hooks/useEvents';
import { useSessions } from '@/hooks/useSessions';
import { useCheckInStats, useCreateCheckIn } from '@/hooks/useCheckIns';
import { useRegistrationByNumber } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type CheckInStatus = 'success' | 'error' | 'already_checked_in';

export default function CheckIn() {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedEventId, setSelectedEventId] = useState<string>(paramEventId || '');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('event-level');
  const [scannerActive, setScannerActive] = useState(true);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>('success');
  const [checkedInPerson, setCheckedInPerson] = useState<{ name: string; number: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data: events } = useEvents();
  const { data: event, isLoading: eventLoading } = useEvent(selectedEventId);
  const { data: sessions } = useSessions(selectedEventId);
  const { data: stats, isLoading: statsLoading } = useCheckInStats(selectedEventId);
  const createCheckIn = useCreateCheckIn();

  const handleScan = async (data: string) => {
    if (!selectedEventId) {
      toast({
        title: 'Select an event first',
        description: 'Please select an event before scanning.',
        variant: 'destructive',
      });
      return;
    }

    // Pause scanner during processing
    setScannerActive(false);

    try {
      // Look up registration by QR code data (registration number)
      const { data: registration, error } = await import('@/integrations/supabase/client')
        .then(({ supabase }) => 
          supabase
            .from('registrations')
            .select('*')
            .eq('registration_number', data)
            .eq('event_id', selectedEventId)
            .single()
        );

      if (error || !registration) {
        setCheckInStatus('error');
        setErrorMessage('Registration not found for this event.');
        setCheckedInPerson(null);
        setConfirmationOpen(true);
        return;
      }

      // Attempt check-in
      await createCheckIn.mutateAsync({
        registrationId: registration.id,
        eventId: selectedEventId,
        sessionId: selectedSessionId === 'event-level' ? undefined : selectedSessionId,
        checkedInBy: user?.id,
      });

      setCheckInStatus('success');
      setCheckedInPerson({
        name: registration.full_name,
        number: registration.registration_number,
      });
      setConfirmationOpen(true);

    } catch (err: any) {
      if (err.message === 'Already checked in') {
        setCheckInStatus('already_checked_in');
      } else {
        setCheckInStatus('error');
        setErrorMessage(err.message || 'Check-in failed');
      }
      setConfirmationOpen(true);
    }
  };

  const handleManualCheckIn = async (registration: any) => {
    if (!selectedEventId) return;

    try {
      await createCheckIn.mutateAsync({
        registrationId: registration.id,
        eventId: selectedEventId,
        sessionId: selectedSessionId === 'event-level' ? undefined : selectedSessionId,
        checkedInBy: user?.id,
      });

      setCheckInStatus('success');
      setCheckedInPerson({
        name: registration.full_name,
        number: registration.registration_number,
      });
      setConfirmationOpen(true);

    } catch (err: any) {
      if (err.message === 'Already checked in') {
        setCheckInStatus('already_checked_in');
        setCheckedInPerson({
          name: registration.full_name,
          number: registration.registration_number,
        });
      } else {
        setCheckInStatus('error');
        setErrorMessage(err.message || 'Check-in failed');
        setCheckedInPerson(null);
      }
      setConfirmationOpen(true);
    }
  };

  const handleCloseConfirmation = () => {
    setConfirmationOpen(false);
    setScannerActive(true);
    setCheckedInPerson(null);
    setErrorMessage('');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {paramEventId && (
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link to={`/admin/events/${paramEventId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Event
                </Link>
              </Button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">Check-In</h1>
            <p className="text-muted-foreground mt-1">
              Scan QR codes or search to check in attendees
            </p>
          </div>
        </div>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>
              Choose the event and optional session for check-in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Event-level check-in (optional: select session)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event-level">Event-level check-in</SelectItem>
                  {sessions?.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedEventId && (
          <>
            {/* Stats */}
            <AttendanceStats
              totalRegistrations={stats?.totalRegistrations || 0}
              totalCheckIns={stats?.totalCheckIns || 0}
              todayCheckIns={stats?.todayCheckIns || 0}
              attendanceRate={stats?.attendanceRate || 0}
              isLoading={statsLoading}
            />

            {/* Check-in Methods */}
            <Tabs defaultValue="scan" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="scan" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Scanner
                </TabsTrigger>
                <TabsTrigger value="search" className="gap-2">
                  <Search className="h-4 w-4" />
                  Manual Search
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scan">
                <Card>
                  <CardHeader>
                    <CardTitle>Scan QR Code</CardTitle>
                    <CardDescription>
                      Point the camera at the attendee's QR code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QRScanner
                      onScan={handleScan}
                      isActive={scannerActive}
                      onError={(err) => toast({ title: 'Scanner Error', description: err, variant: 'destructive' })}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search">
                <Card>
                  <CardHeader>
                    <CardTitle>Manual Check-In</CardTitle>
                    <CardDescription>
                      Search for attendees by name, email, or registration number
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CheckInSearch
                      eventId={selectedEventId}
                      onSelect={handleManualCheckIn}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!selectedEventId && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select an Event</h2>
              <p className="text-muted-foreground text-center">
                Choose an event above to start checking in attendees
              </p>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Dialog */}
        <CheckInConfirmation
          isOpen={confirmationOpen}
          onClose={handleCloseConfirmation}
          status={checkInStatus}
          registrationName={checkedInPerson?.name}
          registrationNumber={checkedInPerson?.number}
          errorMessage={errorMessage}
        />
      </div>
    </AdminLayout>
  );
}
