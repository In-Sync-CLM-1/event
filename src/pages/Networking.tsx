import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useUserMeetingRequests, useCreateMeetingRequest, useRespondToMeetingRequest, useAvailableSlots } from '@/hooks/useMeetings';
import { useAuth } from '@/contexts/AuthContext';
import { Users, MessageSquare, Check, X, Calendar, Search, Linkedin, Info } from 'lucide-react';

export default function Networking() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<string | null>(null);
  const [meetingMessage, setMeetingMessage] = useState('');
  const [showLinkedInOnly, setShowLinkedInOnly] = useState(false);

  const { data: registrations } = useRegistrations(eventId || '');
  const { data: availableSlots } = useAvailableSlots(eventId || '');

  // Find user's registration
  const userRegistration = registrations?.find(
    r => r.user_id === user?.id || r.email === user?.email
  );

  const { data: meetingRequests } = useUserMeetingRequests(userRegistration?.id || '');
  const createRequest = useCreateMeetingRequest();
  const respondToRequest = useRespondToMeetingRequest();

  // Filter out current user from attendees list
  const attendees = registrations?.filter(
    r => r.id !== userRegistration?.id && r.status !== 'cancelled'
  ) || [];

  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.company?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLinkedIn = !showLinkedInOnly || !!(a as { linkedin_url?: string }).linkedin_url;
    return matchesSearch && matchesLinkedIn;
  });

  const handleSendRequest = async () => {
    if (!eventId || !userRegistration || !selectedAttendee) return;

    await createRequest.mutateAsync({
      event_id: eventId,
      requester_id: userRegistration.id,
      target_id: selectedAttendee,
      message: meetingMessage || undefined,
    });

    setSelectedAttendee(null);
    setMeetingMessage('');
  };

  const incomingRequests = meetingRequests?.filter(
    r => r.target_id === userRegistration?.id && r.status === 'pending'
  ) || [];

  const outgoingRequests = meetingRequests?.filter(
    r => r.requester_id === userRegistration?.id
  ) || [];

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold">Networking</h1>
            <p className="text-muted-foreground mt-2">
              Connect with other attendees
            </p>
          </div>

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Meeting Requests ({incomingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{request.requester?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{request.requester?.company}</p>
                      {request.message && (
                        <p className="text-sm mt-1 italic">"{request.message}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToRequest.mutate({ 
                          requestId: request.id, 
                          status: 'declined' 
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => respondToRequest.mutate({ 
                          requestId: request.id, 
                          status: 'accepted',
                          slotId: availableSlots?.[0]?.id,
                        })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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

          {/* Attendee Directory */}
          <Card>
            <CardHeader>
              <CardTitle>Attendee Directory</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="linkedin-filter"
                    checked={showLinkedInOnly}
                    onCheckedChange={setShowLinkedInOnly}
                  />
                  <Label htmlFor="linkedin-filter" className="flex items-center gap-1 text-sm cursor-pointer">
                    <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                    Has LinkedIn
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAttendees.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No attendees found
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <TooltipProvider>
                    {filteredAttendees.map((attendee) => {
                      const linkedinUrl = (attendee as { linkedin_url?: string }).linkedin_url;
                      return (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{attendee.full_name}</p>
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
                              {attendee.company && (
                                <p className="text-sm text-muted-foreground">{attendee.company}</p>
                              )}
                              {attendee.designation && (
                                <Badge variant="outline" className="mt-1">
                                  {attendee.designation}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedAttendee(attendee.id)}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Meeting with {attendee.full_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Message (optional)</Label>
                                  <Textarea
                                    placeholder="Hi! I'd love to connect and discuss..."
                                    value={meetingMessage}
                                    onChange={(e) => setMeetingMessage(e.target.value)}
                                  />
                                </div>
                                <Button
                                  onClick={handleSendRequest}
                                  disabled={createRequest.isPending}
                                  className="w-full"
                                >
                                  Send Request
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{request.target?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{request.target?.company}</p>
                    </div>
                    <Badge variant={
                      request.status === 'accepted' ? 'default' :
                      request.status === 'declined' ? 'destructive' :
                      'secondary'
                    }>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
