import { useState } from 'react';
import { Search, Clock, Send, Linkedin, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEventAttendees, useCreateMeetingBooking } from '@/hooks/useMeetingSpots';
import { Skeleton } from '@/components/ui/skeleton';

interface MeetingSpotBookingProps {
  eventId: string;
  userRegistrationId: string;
}

const DURATION_OPTIONS = [10, 20, 30] as const;

export function MeetingSpotBooking({ eventId, userRegistrationId }: MeetingSpotBookingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkedInOnly, setShowLinkedInOnly] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<{
    id: string;
    full_name: string;
    company: string | null;
    designation: string | null;
    linkedin_url?: string | null;
  } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<10 | 20 | 30>(30);
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: attendees, isLoading } = useEventAttendees(eventId, userRegistrationId);
  const createBooking = useCreateMeetingBooking();

  const filteredAttendees = attendees?.filter((attendee) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      attendee.full_name.toLowerCase().includes(searchLower) ||
      attendee.company?.toLowerCase().includes(searchLower) ||
      attendee.designation?.toLowerCase().includes(searchLower)
    );
    const matchesLinkedIn = !showLinkedInOnly || !!(attendee as { linkedin_url?: string }).linkedin_url;
    return matchesSearch && matchesLinkedIn;
  });

  const handleRequestMeeting = (attendee: typeof selectedAttendee) => {
    setSelectedAttendee(attendee);
    setDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedAttendee) return;

    await createBooking.mutateAsync({
      event_id: eventId,
      requester_registration_id: userRegistrationId,
      target_registration_id: selectedAttendee.id,
      duration_minutes: selectedDuration,
      message: message || undefined,
    });

    setDialogOpen(false);
    setSelectedAttendee(null);
    setMessage('');
    setSelectedDuration(30);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Find My Connections Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[#0A66C2] mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-sm">Find Your LinkedIn Connections</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Look for the <Linkedin className="h-3 w-3 inline text-[#0A66C2]" /> icon next to attendees. 
              Click it to open their LinkedIn profile and check if you're already connected!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="linkedin-filter-booking"
            checked={showLinkedInOnly}
            onCheckedChange={setShowLinkedInOnly}
          />
          <Label htmlFor="linkedin-filter-booking" className="flex items-center gap-1 text-sm cursor-pointer">
            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            Has LinkedIn
          </Label>
        </div>
      </div>

      {filteredAttendees?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'No attendees match your search' : 'No other attendees registered yet'}
        </div>
      ) : (
        <TooltipProvider>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAttendees?.map((attendee) => {
              const linkedinUrl = (attendee as { linkedin_url?: string }).linkedin_url;
              return (
                <Card key={attendee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{attendee.full_name}</h3>
                          {linkedinUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a 
                                  href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#0A66C2] hover:opacity-80 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View LinkedIn Profile</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {attendee.designation && (
                          <p className="text-sm text-muted-foreground">{attendee.designation}</p>
                        )}
                        {attendee.company && (
                          <Badge variant="secondary" className="mt-1">
                            {attendee.company}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRequestMeeting({ ...attendee, linkedin_url: linkedinUrl })}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Request Meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Meeting</DialogTitle>
            <DialogDescription>
              Send a meeting request to {selectedAttendee?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting Duration</Label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant={selectedDuration === duration ? 'default' : 'outline'}
                    onClick={() => setSelectedDuration(duration)}
                    className="flex-1"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    {duration} min
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi, I'd like to discuss..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={createBooking.isPending}>
              {createBooking.isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
