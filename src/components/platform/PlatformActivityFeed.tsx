import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, ClipboardList, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityItem } from '@/hooks/usePlatformDashboard';

interface Props {
  feed: ActivityItem[];
}

const iconMap = {
  event_created: { icon: Calendar, color: 'text-primary bg-primary/10' },
  registration: { icon: ClipboardList, color: 'text-blue-500 bg-blue-500/10' },
  check_in: { icon: CheckSquare, color: 'text-green-500 bg-green-500/10' },
};

export function PlatformActivityFeed({ feed }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {feed.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No activity yet</p>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {feed.map(item => {
                const config = iconMap[item.type];
                const Icon = config.icon;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{item.detail}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
