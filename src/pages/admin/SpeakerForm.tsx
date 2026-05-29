import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateSpeaker, useUpdateSpeaker, useUploadSpeakerPhoto } from '@/hooks/useSpeakers';
import { useToast } from '@/hooks/use-toast';
import type { Speaker } from '@/types/database';

const speakerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

type SpeakerFormData = z.infer<typeof speakerSchema>;

interface SpeakerFormProps {
  eventId: string;
  speaker?: Speaker | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SpeakerForm({ eventId, speaker, onSuccess, onCancel }: SpeakerFormProps) {
  const createSpeaker = useCreateSpeaker();
  const updateSpeaker = useUpdateSpeaker();
  const uploadPhoto = useUploadSpeakerPhoto();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(speaker?.photo_url || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<SpeakerFormData>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      name: speaker?.name || '',
      title: speaker?.title || '',
      company: speaker?.company || '',
      bio: speaker?.bio || '',
      linkedin: speaker?.social_links?.linkedin || '',
      twitter: speaker?.social_links?.twitter || '',
      website: speaker?.social_links?.website || '',
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: SpeakerFormData) => {
    setIsSubmitting(true);

    try {
      let finalPhotoUrl = photoUrl;

      // Upload photo if new file selected
      if (photoFile) {
        finalPhotoUrl = await uploadPhoto.mutateAsync({
          file: photoFile,
          eventId,
          speakerId: speaker?.id,
        });
      }

      const speakerData = {
        name: data.name,
        title: data.title || null,
        company: data.company || null,
        bio: data.bio || null,
        photo_url: finalPhotoUrl,
        social_links: {
          linkedin: data.linkedin || undefined,
          twitter: data.twitter || undefined,
          website: data.website || undefined,
        },
        event_id: eventId,
        sort_order: speaker?.sort_order || 0,
        user_id: null,
      };

      if (speaker) {
        await updateSpeaker.mutateAsync({ id: speaker.id, ...speakerData });
        toast({ title: 'Speaker updated successfully' });
      } else {
        await createSpeaker.mutateAsync(speakerData);
        toast({ title: 'Speaker added successfully' });
      }

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save speaker. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const watchedName = form.watch('name');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoUrl || undefined} alt="Speaker photo" />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {watchedName ? getInitials(watchedName) : 'SP'}
              </AvatarFallback>
            </Avatar>
            {photoUrl && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removePhoto}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {photoUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
              Recommended: 400x400px, max 5MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="CEO, CTO, Lead Developer..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company / Organization</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief speaker biography..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Social Links</h4>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter/X URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {speaker ? 'Update Speaker' : 'Add Speaker'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
