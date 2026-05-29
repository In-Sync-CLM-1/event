import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateSession, useUpdateSession } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SessionWithSpeakers, Speaker } from '@/types/database';

const sessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_date: z.date({ required_error: 'Start date is required' }),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  virtual_join_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  track: z.string().optional(),
  max_capacity: z.number().optional(),
  speaker_ids: z.array(z.string()).optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  eventId: string;
  eventMode?: 'in_person' | 'virtual' | 'hybrid';
  session?: SessionWithSpeakers | null;
  speakers: Speaker[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function SessionForm({ eventId, eventMode = 'in_person', session, speakers, onSuccess, onCancel }: SessionFormProps) {
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultDate = session?.start_time ? new Date(session.start_time) : new Date();
  const defaultStartTime = session?.start_time 
    ? format(new Date(session.start_time), 'HH:mm')
    : '09:00';
  const defaultEndTime = session?.end_time
    ? format(new Date(session.end_time), 'HH:mm')
    : '10:00';

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: session?.title || '',
      description: session?.description || '',
      start_date: defaultDate,
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      location: session?.location || '',
      virtual_join_url: session?.virtual_join_url || '',
      track: session?.track || '',
      max_capacity: session?.max_capacity || undefined,
      speaker_ids: session?.speakers?.map(s => s.id) || [],
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(data.start_date);
      const [startHours, startMinutes] = data.start_time.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(data.start_date);
      const [endHours, endMinutes] = data.end_time.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const sessionData = {
        title: data.title,
        description: data.description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: data.location || null,
        virtual_join_url: data.virtual_join_url || null,
        track: data.track || null,
        max_capacity: data.max_capacity || null,
        event_id: eventId,
        speaker_ids: data.speaker_ids,
      };

      if (session) {
        await updateSession.mutateAsync({ id: session.id, ...sessionData });
        toast({ title: 'Session updated successfully' });
      } else {
        await createSession.mutateAsync({ ...sessionData, sort_order: 0 });
        toast({ title: 'Session created successfully' });
      }

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSpeakerIds = form.watch('speaker_ids') || [];

  const toggleSpeaker = (speakerId: string) => {
    const current = form.getValues('speaker_ids') || [];
    if (current.includes(speakerId)) {
      form.setValue('speaker_ids', current.filter(id => id !== speakerId));
    } else {
      form.setValue('speaker_ids', [...current, speakerId]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Title *</FormLabel>
              <FormControl>
                <Input placeholder="Keynote: The Future of Tech" {...field} />
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
                <Textarea 
                  placeholder="What will be covered in this session..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date *</FormLabel>
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
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location / Room</FormLabel>
                <FormControl>
                  <Input placeholder="Main Hall, Room 101..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="track"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Track</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Main Track">Main Track</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Networking">Networking</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(eventMode === 'virtual' || eventMode === 'hybrid') && (
          <FormField
            control={form.control}
            name="virtual_join_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5"><Video className="h-4 w-4" /> Session Join URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://zoom.us/j/... — leave blank to auto-generate Jitsi room" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="max_capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Capacity</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Leave empty for unlimited"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {speakers.length > 0 && (
          <div className="space-y-3">
            <FormLabel>Speakers</FormLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-muted/30">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`speaker-${speaker.id}`}
                    checked={selectedSpeakerIds.includes(speaker.id)}
                    onCheckedChange={() => toggleSpeaker(speaker.id)}
                  />
                  <label
                    htmlFor={`speaker-${speaker.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {speaker.name}
                    {speaker.title && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({speaker.title})
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {session ? 'Update Session' : 'Create Session'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
