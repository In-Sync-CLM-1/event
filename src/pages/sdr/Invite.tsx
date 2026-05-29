import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Copy, 
  Link as LinkIcon,
  Users,
  UserCheck,
  Clock,
  Search
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useInvitations } from '@/hooks/useInvitations';
import { MainLayout } from '@/components/layout/MainLayout';
import { format } from 'date-fns';
import { PRODUCTION_URL } from '@/lib/constants';

const invitationSchema = z.object({
  event_id: z.string().min(1, 'Please select an event'),
  invitee_name: z.string().optional(),
  invitee_email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function SDRInvite() {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const eventsQuery = useEvents();
  const events = eventsQuery.data || [];
  const eventFilter = selectedEventId === 'all' ? undefined : selectedEventId;
  const { invitations, stats, isLoading, createInvitation } = useInvitations(eventFilter);

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      event_id: '',
      invitee_name: '',
      invitee_email: '',
    },
  });

  const filteredInvitations = invitations.filter((inv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.invitee_name?.toLowerCase().includes(query) ||
      inv.invitee_email?.toLowerCase().includes(query) ||
      inv.referral_code.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (data: InvitationFormData) => {
    try {
      await createInvitation.mutateAsync({
        event_id: data.event_id,
        invitee_name: data.invitee_name || undefined,
        invitee_email: data.invitee_email || undefined,
      });
      toast.success('Invitation created successfully!');
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create invitation');
    }
  };

  const copyReferralLink = (code: string) => {
    const link = `${PRODUCTION_URL}/register?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'default';
      case 'registered':
        return 'secondary';
      case 'sent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invitations</h1>
            <p className="text-muted-foreground">Manage your referral invitations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invitation</DialogTitle>
                <DialogDescription>
                  Generate a referral link to invite contacts to an event.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="event_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an event" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invitee_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invitee_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email (optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createInvitation.isPending}>
                    {createInvitation.isPending ? 'Creating...' : 'Create Invitation'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Invitations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <LinkIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.registered || 0}</p>
                <p className="text-sm text-muted-foreground">Registered</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.checked_in || 0}</p>
                <p className="text-sm text-muted-foreground">Checked In</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invitations</CardTitle>
            <CardDescription>Track the status of your referral invitations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No invitations match your search' : 'No invitations yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invitation.invitee_name || 'Open Invitation'}
                          </p>
                          {invitation.invitee_email && (
                            <p className="text-sm text-muted-foreground">
                              {invitation.invitee_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invitation.events?.title}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {invitation.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invitation.status)}>
                          {invitation.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyReferralLink(invitation.referral_code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
