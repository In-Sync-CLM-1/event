import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePublicContent, useTrackContentView } from '@/hooks/useContent';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { Video, FileText, Image, ExternalLink, Lock, Play } from 'lucide-react';

export default function ContentLibrary() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();

  const { data: content, isLoading } = usePublicContent(eventId || '');
  const { data: registrations } = useRegistrations(eventId || '');
  const trackView = useTrackContentView();

  // Find user's registration
  const userRegistration = registrations?.find(
    r => r.user_id === user?.id || r.email === user?.email
  );

  const isRegistered = !!userRegistration && ['confirmed', 'checked_in'].includes(userRegistration.status);

  const videos = content?.filter(c => c.type === 'video') || [];
  const documents = content?.filter(c => c.type === 'pdf' || c.type === 'slides') || [];
  const links = content?.filter(c => c.type === 'link') || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'slides': return <Image className="h-5 w-5" />;
      default: return <ExternalLink className="h-5 w-5" />;
    }
  };

  const handleAccessContent = (item: typeof content[0]) => {
    if (userRegistration) {
      trackView.mutate({
        contentId: item.id,
        registrationId: userRegistration.id,
      });
    }
    window.open(item.url, '_blank');
  };

  const canAccess = (item: typeof content[0]) => {
    return !item.is_gated || isRegistered;
  };

  const ContentCard = ({ item }: { item: typeof content[0] }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            {getTypeIcon(item.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                {item.session && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Session: {item.session.title}
                  </p>
                )}
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                )}
              </div>
              {item.is_gated && (
                <Badge variant="secondary">
                  <Lock className="mr-1 h-3 w-3" />
                  Gated
                </Badge>
              )}
            </div>
            <div className="mt-4">
              {canAccess(item) ? (
                <Button onClick={() => handleAccessContent(item)} variant="outline" size="sm">
                  {item.type === 'video' ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Watch
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled variant="secondary" size="sm">
                  <Lock className="mr-2 h-4 w-4" />
                  Register to Access
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <Video className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold">Content Library</h1>
            <p className="text-muted-foreground mt-2">
              Access session recordings, presentations, and resources
            </p>
          </div>

          {isLoading ? (
            <p className="text-center py-8">Loading content...</p>
          ) : content?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No content available yet. Check back after the event!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">All ({content?.length || 0})</TabsTrigger>
                <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
                <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
                <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {content?.map((item) => (
                  <ContentCard key={item.id} item={item} />
                ))}
              </TabsContent>

              <TabsContent value="videos" className="space-y-4 mt-4">
                {videos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No videos available</p>
                ) : (
                  videos.map((item) => <ContentCard key={item.id} item={item} />)
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No documents available</p>
                ) : (
                  documents.map((item) => <ContentCard key={item.id} item={item} />)
                )}
              </TabsContent>

              <TabsContent value="links" className="space-y-4 mt-4">
                {links.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No links available</p>
                ) : (
                  links.map((item) => <ContentCard key={item.id} item={item} />)
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
