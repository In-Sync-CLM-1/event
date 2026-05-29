import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useContentLibrary, useCreateContent, useDeleteContent } from '@/hooks/useContent';
import { useSessions } from '@/hooks/useSessions';
import { FileText, Video, Image, Plus, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function Content() {
  const { eventId } = useParams<{ eventId: string }>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: content, isLoading } = useContentLibrary(eventId || '');
  const { data: sessions } = useSessions(eventId || '');
  const createContent = useCreateContent();
  const deleteContent = useDeleteContent();

  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    type: 'video',
    url: '',
    session_id: null as string | null,
    is_gated: false,
    expires_at: null as string | null,
  });

  const handleCreateContent = async () => {
    if (!eventId || !newContent.title || !newContent.url) return;
    await createContent.mutateAsync({
      event_id: eventId,
      title: newContent.title,
      description: newContent.description || null,
      type: newContent.type,
      url: newContent.url,
      session_id: newContent.session_id,
      is_gated: newContent.is_gated,
      expires_at: newContent.expires_at,
      thumbnail_url: null,
      sort_order: (content?.length || 0) + 1,
    });
    setNewContent({
      title: '',
      description: '',
      type: 'video',
      url: '',
      session_id: null,
      is_gated: false,
      expires_at: null,
    });
    setShowCreateDialog(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'slides': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/admin/events/${eventId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Content Library</h1>
              <p className="text-muted-foreground">Manage session recordings and materials</p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    placeholder="Content title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newContent.description}
                    onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                    placeholder="Content description"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={newContent.type}
                    onValueChange={(v) => setNewContent({ ...newContent, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="slides">Slides</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={newContent.url}
                    onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Related Session (optional)</Label>
                  <Select
                    value={newContent.session_id || 'none'}
                    onValueChange={(v) => setNewContent({ ...newContent, session_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {sessions?.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require Registration (Gated)</Label>
                  <Switch
                    checked={newContent.is_gated}
                    onCheckedChange={(v) => setNewContent({ ...newContent, is_gated: v })}
                  />
                </div>
                <div>
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={newContent.expires_at || ''}
                    onChange={(e) => setNewContent({ ...newContent, expires_at: e.target.value || null })}
                  />
                </div>
                <Button onClick={handleCreateContent} className="w-full">
                  Add Content
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Content</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : content?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No content added yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.session?.title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_gated ? 'secondary' : 'outline'}>
                          {item.is_gated ? 'Gated' : 'Public'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.expires_at 
                          ? format(new Date(item.expires_at), 'MMM d, yyyy')
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteContent.mutate({ id: item.id, eventId: eventId! })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
