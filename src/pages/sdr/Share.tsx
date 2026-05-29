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
  Share2, 
  Copy, 
  Eye,
  FileText,
  Video,
  Image,
  File,
  Search,
  ExternalLink
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useContentShares } from '@/hooks/useContentShares';
import { useAllContent } from '@/hooks/useAllContent';
import { MainLayout } from '@/components/layout/MainLayout';
import { format } from 'date-fns';
import { PRODUCTION_URL } from '@/lib/constants';

const shareSchema = z.object({
  content_id: z.string().min(1, 'Please select content'),
  recipient_email: z.string().email('Invalid email'),
});

type ShareFormData = z.infer<typeof shareSchema>;

export default function SDRShare() {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const eventsQuery = useEvents();
  const events = eventsQuery.data || [];
  const eventFilter = selectedEventId === 'all' ? undefined : selectedEventId;
  const contentQuery = useAllContent(eventFilter);
  const allContent = contentQuery.data || [];
  const { shares, stats, isLoading: sharesLoading, createShare } = useContentShares(eventFilter);

  const form = useForm<ShareFormData>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      content_id: '',
      recipient_email: '',
    },
  });

  const filteredShares = shares.filter((share) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      share.recipient_email.toLowerCase().includes(query) ||
      share.content_library?.title?.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (data: ShareFormData) => {
    try {
      await createShare.mutateAsync({
        content_id: data.content_id,
        recipient_email: data.recipient_email,
      });
      toast.success('Content shared successfully!');
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to share content');
    }
  };

  const copyShareLink = (token: string) => {
    const link = `${PRODUCTION_URL}/content/shared/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard!');
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Content Sharing</h1>
            <p className="text-muted-foreground">Share event content with your contacts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Content</DialogTitle>
                <DialogDescription>
                  Send gated content to a contact via email.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content to share" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allContent?.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center gap-2">
                                  {getContentIcon(item.type)}
                                  <span>{item.title}</span>
                                </div>
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
                    name="recipient_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createShare.isPending}>
                    {createShare.isPending ? 'Sharing...' : 'Share Content'}
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
              <Share2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalShares || 0}</p>
                <p className="text-sm text-muted-foreground">Total Shares</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.viewedCount || 0}</p>
                <p className="text-sm text-muted-foreground">Viewed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <ExternalLink className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.viewRate || 0}%</p>
                <p className="text-sm text-muted-foreground">View Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or content title..."
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

        {/* Shares Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shared Content</CardTitle>
            <CardDescription>Track engagement with your shared content</CardDescription>
          </CardHeader>
          <CardContent>
            {sharesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredShares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No shares match your search' : 'No content shared yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Shared</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContentIcon(share.content_library?.type || '')}
                          <span className="font-medium">{share.content_library?.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{share.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant={share.viewed_at ? 'default' : 'outline'}>
                          {share.viewed_at ? 'Viewed' : 'Not viewed'}
                        </Badge>
                      </TableCell>
                      <TableCell>{share.view_count}</TableCell>
                      <TableCell>
                        {format(new Date(share.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyShareLink(share.share_token)}
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
