import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  User, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  ArrowLeft,
  Linkedin,
  Twitter,
  Globe
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSpeakers, useDeleteSpeaker } from '@/hooks/useSpeakers';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { SpeakerForm } from './SpeakerForm';
import type { Speaker } from '@/types/database';

export default function AdminSpeakers() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: speakers, isLoading: speakersLoading } = useSpeakers(eventId);
  const deleteSpeaker = useDeleteSpeaker();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);

  const handleDelete = async (speaker: Speaker) => {
    if (!confirm(`Are you sure you want to delete "${speaker.name}"?`)) return;

    try {
      await deleteSpeaker.mutateAsync({ id: speaker.id, eventId: eventId! });
      toast({
        title: 'Speaker deleted',
        description: 'The speaker has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: 'There was an error deleting the speaker.',
        variant: 'destructive',
      });
    }
  };

  const openEditForm = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSpeaker(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isLoading = eventLoading || speakersLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to={`/admin/events/${eventId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Speakers</h1>
            <p className="text-muted-foreground mt-1">
              {event?.title} - Manage event speakers
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Speaker
          </Button>
        </div>

        {/* Speakers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : speakers?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No speakers yet</h2>
              <p className="text-muted-foreground mb-6">
                Add speakers to feature at your event
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Speaker
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {speakers?.map((speaker) => (
              <Card key={speaker.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={speaker.photo_url || undefined} alt={speaker.name} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {getInitials(speaker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{speaker.name}</h3>
                        {speaker.title && (
                          <p className="text-sm text-muted-foreground">{speaker.title}</p>
                        )}
                        {speaker.company && (
                          <p className="text-sm text-muted-foreground">{speaker.company}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(speaker)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(speaker)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {speaker.bio && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
                      {speaker.bio}
                    </p>
                  )}

                  {speaker.social_links && (
                    <div className="flex items-center gap-2 mt-4">
                      {speaker.social_links.linkedin && (
                        <a
                          href={speaker.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {speaker.social_links.twitter && (
                        <a
                          href={speaker.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                      {speaker.social_links.website && (
                        <a
                          href={speaker.social_links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Globe className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Speaker Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpeaker ? 'Edit Speaker' : 'Add New Speaker'}
            </DialogTitle>
          </DialogHeader>
          <SpeakerForm
            eventId={eventId!}
            speaker={editingSpeaker}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
