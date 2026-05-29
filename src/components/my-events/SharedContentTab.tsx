import { format } from 'date-fns';
import { FileText, Video, Image, Eye, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  image: Image,
  document: FileText,
};

export function SharedContentTab() {
  const { user } = useAuth();

  const { data: sharedContent, isLoading } = useQuery({
    queryKey: ['my-shared-content', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('content_shares')
        .select(`
          *,
          content_library:content_id (
            id,
            title,
            type,
            url,
            thumbnail_url,
            description,
            event_id,
            events:event_id (title)
          )
        `)
        .eq('recipient_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!sharedContent || sharedContent.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No shared content</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Content shared with you by event organizers will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sharedContent.map((share: any) => {
        const content = share.content_library;
        if (!content) return null;
        const Icon = typeIcons[content.type] || FileText;

        return (
          <Card key={share.id} className="overflow-hidden">
            {content.thumbnail_url && (
              <div className="aspect-video bg-muted overflow-hidden">
                <img src={content.thumbnail_url} alt={content.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium line-clamp-2">{content.title}</h4>
                  {content.events?.title && (
                    <p className="text-xs text-muted-foreground mt-0.5">{content.events.title}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{content.type}</Badge>
              </div>
              {content.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{content.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Shared {format(new Date(share.created_at), 'MMM d, yyyy')}</span>
                {share.view_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {share.view_count}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={content.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  View Content
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
