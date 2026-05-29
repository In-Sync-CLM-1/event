import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Video } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(100, 'Slug is too long').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(5000, 'Description is too long').optional(),
  venue: z.string().max(200, 'Venue name is too long').optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  city: z.string().max(100, 'City name is too long').optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  registration_deadline: z.string().optional(),
  max_capacity: z.coerce.number().min(0).max(100000).optional(),
  mode: z.enum(['in_person', 'virtual', 'hybrid']),
  virtual_join_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const createEvent = useCreateEvent();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: 'draft',
      mode: 'in_person',
    },
  });

  const title = watch('title');
  const mode = watch('mode');

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      const result = await createEvent.mutateAsync({
        slug: data.slug,
        title: data.title,
        description: data.description,
        venue: data.venue,
        address: data.address,
        city: data.city,
        status: data.status,
        mode: data.mode,
        virtual_join_url: data.virtual_join_url || undefined,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        registration_deadline: data.registration_deadline
          ? new Date(data.registration_deadline).toISOString()
          : undefined,
        max_capacity: data.max_capacity || undefined,
        created_by: user?.id,
      });

      toast({
        title: 'Event created!',
        description: data.status === 'published' 
          ? 'Your event is now live.' 
          : 'Your event has been saved as a draft.',
      });

      navigate(`/admin/events/${result.id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      toast({
        title: 'Failed to create event',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/events')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Event</h1>
            <p className="text-muted-foreground">Set up a new event with registration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the main details about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Annual Tech Conference 2024"
                  {...register('title', {
                    onChange: (e) => setValue('slug', generateSlug(e.target.value)),
                  })}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/events/</span>
                  <Input
                    id="slug"
                    placeholder="annual-tech-conference-2024"
                    {...register('slug')}
                    className={errors.slug ? 'border-destructive' : ''}
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell attendees what your event is about..."
                  rows={5}
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
              <CardDescription>When will your event take place?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    {...register('start_date')}
                    className={errors.start_date ? 'border-destructive' : ''}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-destructive">{errors.start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    {...register('end_date')}
                    className={errors.end_date ? 'border-destructive' : ''}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-destructive">{errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline</Label>
                <Input
                  id="registration_deadline"
                  type="datetime-local"
                  {...register('registration_deadline')}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow registrations until the event starts
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where will your event be held?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venue">Venue Name</Label>
                <Input
                  id="venue"
                  placeholder="Convention Center"
                  {...register('venue')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  {...register('address')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  {...register('city')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Event Format</CardTitle>
              <CardDescription>Is this event in-person, virtual, or hybrid?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mode">Format</Label>
                <Select
                  defaultValue="in_person"
                  onValueChange={(v) => setValue('mode', v as 'in_person' | 'virtual' | 'hybrid')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hybrid">Hybrid (In-Person + Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(mode === 'virtual' || mode === 'hybrid') && (
                <div className="space-y-2">
                  <Label htmlFor="virtual_join_url">Stream / Join URL</Label>
                  <Input
                    id="virtual_join_url"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    {...register('virtual_join_url')}
                    className={errors.virtual_join_url ? 'border-destructive' : ''}
                  />
                  {errors.virtual_join_url && (
                    <p className="text-sm text-destructive">{errors.virtual_join_url.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave blank to auto-generate a free Jitsi room for each session.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacity & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure capacity and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Maximum Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  placeholder="100"
                  min={0}
                  {...register('max_capacity')}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited capacity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue="draft"
                  onValueChange={(value) => setValue('status', value as 'draft' | 'published')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft - Not visible to public</SelectItem>
                    <SelectItem value="published">Published - Visible and open for registration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createEvent.isPending}
            >
              {createEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/events')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
