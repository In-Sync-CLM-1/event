import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  GripVertical,
  ArrowLeft
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useSessions, useDeleteSession, useReorderSessions } from '@/hooks/useSessions';
import { useSpeakers } from '@/hooks/useSpeakers';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';
import { SessionForm } from './SessionForm';
import type { SessionWithSpeakers } from '@/types/database';

export default function AdminSessions() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(eventId);
  const { data: speakers } = useSpeakers(eventId);
  const deleteSession = useDeleteSession();
  const reorderSessions = useReorderSessions();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionWithSpeakers | null>(null);

  const handleDelete = async (session: SessionWithSpeakers) => {
    if (!confirm(`Are you sure you want to delete "${session.title}"?`)) return;

    try {
      await deleteSession.mutateAsync({ id: session.id, eventId: eventId! });
      toast({
        title: 'Session deleted',
        description: 'The session has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: 'There was an error deleting the session.',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !sessions || !eventId) return;

    const items = Array.from(sessions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));

    try {
      await reorderSessions.mutateAsync({ sessions: updates, eventId });
    } catch (error) {
      toast({
        title: 'Failed to reorder',
        description: 'There was an error reordering sessions.',
        variant: 'destructive',
      });
    }
  };

  const openEditForm = (session: SessionWithSpeakers) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSession(null);
  };

  // Group sessions by track
  const groupedSessions = sessions?.reduce((acc, session) => {
    const track = session.track || 'Main Track';
    if (!acc[track]) acc[track] = [];
    acc[track].push(session);
    return acc;
  }, {} as Record<string, SessionWithSpeakers[]>) || {};

  const isLoading = eventLoading || sessionsLoading;

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
            <h1 className="text-2xl md:text-3xl font-bold">Sessions</h1>
            <p className="text-muted-foreground mt-1">
              {event?.title} - Manage agenda and sessions
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
              <p className="text-muted-foreground mb-6">
                Add sessions to build your event agenda
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            {Object.entries(groupedSessions).map(([track, trackSessions]) => (
              <Card key={track} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">{track}</Badge>
                    <span className="text-sm text-muted-foreground font-normal">
                      {trackSessions.length} session{trackSessions.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={track}>
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {trackSessions.map((session, index) => (
                          <Draggable key={session.id} draggableId={session.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-muted/50 rounded-lg p-4 border ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h3 className="font-semibold">{session.title}</h3>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => openEditForm(session)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => handleDelete(session)}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    
                                    {session.description && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {session.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(session.start_time), 'MMM d, h:mm a')} - 
                                        {format(new Date(session.end_time), 'h:mm a')}
                                      </div>
                                      
                                      {session.location && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <MapPin className="h-4 w-4" />
                                          {session.location}
                                        </div>
                                      )}
                                      
                                      {session.max_capacity && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Users className="h-4 w-4" />
                                          {session.max_capacity} seats
                                        </div>
                                      )}
                                    </div>
                                    
                                    {session.speakers && session.speakers.length > 0 && (
                                      <div className="flex items-center gap-2 mt-3">
                                        <span className="text-sm text-muted-foreground">Speakers:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {session.speakers.map((speaker) => (
                                            <Badge key={speaker.id} variant="secondary" className="text-xs">
                                              {speaker.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </DragDropContext>
        )}
      </div>

      {/* Session Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit Session' : 'Add New Session'}
            </DialogTitle>
          </DialogHeader>
          <SessionForm
            eventId={eventId!}
            eventMode={(event as any)?.mode ?? 'in_person'}
            session={editingSession}
            speakers={speakers || []}
            onSuccess={closeForm}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
