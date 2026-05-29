import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Mic, 
  Clock, 
  Save,
  Loader2,
  CalendarIcon,
  ExternalLink,
  LayoutTemplate,
  MapPin,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useSessions } from '@/hooks/useSessions';
import { useSpeakers } from '@/hooks/useSpeakers';
import { useAdminMeetingSpots } from '@/hooks/useAdminMeetingSpots';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { EventStatus } from '@/types/database';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  start_date: z.date({ required_error: 'Start date is required' }),
  end_date: z.date({ required_error: 'End date is required' }),
  registration_deadline: z.date().optional(),
  max_capacity: z.number().optional(),
  mode: z.enum(['in_person', 'virtual', 'hybrid']),
  virtual_join_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EventEdit() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEvent(eventId);
  const { data: sessions } = useSessions(eventId);
  const { data: speakers } = useSpeakers(eventId);
  const { data: meetingSpots } = useAdminMeetingSpots(eventId);
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    values: event ? {
      title: event.title,
      description: event.description || '',
      venue: event.venue || '',
      address: event.address || '',
      city: event.city || '',
      start_date: new Date(event.start_date),
      end_date: new Date(event.end_date),
      registration_deadline: event.registration_deadline ? new Date(event.registration_deadline) : undefined,
      max_capacity: event.max_capacity || undefined,
      mode: ((event as any).mode as 'in_person' | 'virtual' | 'hybrid') || 'in_person',
      virtual_join_url: (event as any).virtual_join_url || '',
      status: event.status as EventStatus,
    } : undefined,
  });

  const onSubmit = async (data: EventFormData) => {
    if (!eventId) return;
    setIsSaving(true);

    try {
      await updateEvent.mutateAsync({
        id: eventId,
        title: data.title,
        description: data.description || null,
        venue: data.venue || null,
        address: data.address || null,
        city: data.city || null,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        registration_deadline: data.registration_deadline?.toISOString() || null,
        max_capacity: data.max_capacity || null,
        mode: data.mode,
        virtual_join_url: data.virtual_join_url || null,
        status: data.status,
      } as any);

      toast({ title: 'Event updated successfully' });
    } catch (error) {
      toast({
        title: 'Failed to update event',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Button asChild className="mt-4">
            <Link to="/admin/events">Back to Events</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-success/10 text-success border-success/20">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/admin/events">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
              {getStatusBadge(event.status)}
            </div>
          </div>
          {event.status === 'published' && (
            <Button variant="outline" asChild>
              <Link to={`/events/${event.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="details" className="gap-2">
              <Calendar className="h-4 w-4 hidden sm:inline" />
              Details
            </TabsTrigger>
            <TabsTrigger value="landing" className="gap-2">
              <LayoutTemplate className="h-4 w-4 hidden sm:inline" />
              Landing
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:inline" />
              Sessions
              {sessions && sessions.length > 0 && (
                <Badge variant="secondary" className="ml-1">{sessions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="speakers" className="gap-2">
              <Mic className="h-4 w-4 hidden sm:inline" />
              Speakers
              {speakers && speakers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{speakers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2">
              <MapPin className="h-4 w-4 hidden sm:inline" />
              Meetings
              {meetingSpots && meetingSpots.length > 0 && (
                <Badge variant="secondary" className="ml-1">{meetingSpots.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              Attendees
            </TabsTrigger>
          </TabsList>

          {/* Event Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  Update your event information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Title *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="venue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue</FormLabel>
                            <FormControl>
                              <Input placeholder="Convention Center" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="San Francisco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "Pick a date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "Pick a date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="registration_deadline"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Registration Deadline</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "No deadline"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Capacity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Unlimited"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Format</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="in_person">In-Person</SelectItem>
                                <SelectItem value="virtual">Virtual</SelectItem>
                                <SelectItem value="hybrid">Hybrid (In-Person + Online)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {(form.watch('mode') === 'virtual' || form.watch('mode') === 'hybrid') && (
                        <FormField
                          control={form.control}
                          name="virtual_join_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stream / Join URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://zoom.us/j/... — leave blank for auto Jitsi rooms per session"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Landing Page Tab */}
          <TabsContent value="landing">
            <Card>
              <CardHeader>
                <CardTitle>Landing Page</CardTitle>
                <CardDescription>
                  Customize your event's public landing page with a drag-and-drop builder or custom HTML
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Create a custom landing page for your event
                  </p>
                  <Button asChild>
                    <Link to={`/admin/events/${eventId}/landing`}>
                      Open Page Builder
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>
                  Manage your event agenda and sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {sessions?.length || 0} session{sessions?.length !== 1 ? 's' : ''} configured
                  </p>
                  <Button asChild>
                    <Link to={`/admin/events/${eventId}/sessions`}>
                      Manage Sessions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Speakers Tab */}
          <TabsContent value="speakers">
            <Card>
              <CardHeader>
                <CardTitle>Speakers</CardTitle>
                <CardDescription>
                  Manage speakers for your event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {speakers?.length || 0} speaker{speakers?.length !== 1 ? 's' : ''} added
                  </p>
                  <Button asChild>
                    <Link to={`/admin/events/${eventId}/speakers`}>
                      Manage Speakers
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meeting Spots Tab */}
          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Spots</CardTitle>
                <CardDescription>
                  Define physical locations where attendees can book meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {meetingSpots?.length || 0} meeting spot{meetingSpots?.length !== 1 ? 's' : ''} configured
                  </p>
                  <Button asChild>
                    <Link to={`/admin/events/${eventId}/meeting-spots`}>
                      Manage Meeting Spots
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Registrations</CardTitle>
                <CardDescription>
                  View and manage event registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    View all registrations for this event
                  </p>
                  <Button asChild>
                    <Link to={`/admin/events/${eventId}/registrations`}>
                      View Registrations
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
