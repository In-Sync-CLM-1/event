import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { usePlatformDashboard } from '@/hooks/usePlatformDashboard';
import { PlatformSummaryStats } from '@/components/platform/PlatformSummaryStats';
import { PlatformEventsTable } from '@/components/platform/PlatformEventsTable';
import { PlatformActivityFeed } from '@/components/platform/PlatformActivityFeed';

function SectionSkeleton({ height = 'h-48' }: { height?: string }) {
  return <Skeleton className={`w-full rounded-lg ${height}`} />;
}

export default function PlatformDashboard() {
  const { data, loading, refresh } = usePlatformDashboard();

  return (
    <PlatformLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="mt-1 text-muted-foreground">Platform-wide overview across all events</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {/* Summary Stats */}
        {loading ? <SectionSkeleton height="h-32" /> : <PlatformSummaryStats summary={data.summary} />}

        {/* Events Table + Activity Feed */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? <SectionSkeleton height="h-[400px]" /> : <PlatformEventsTable events={data.events} />}
          </div>
          <div>
            {loading ? <SectionSkeleton height="h-[400px]" /> : <PlatformActivityFeed feed={data.activityFeed} />}
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
