import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEngagementScores, useCalculateEngagement, useEngagementTierDistribution } from '@/hooks/useEngagement';
import { ArrowLeft, RefreshCw, Flame, Sun, Zap, Moon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

export default function Engagement() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: scores, isLoading } = useEngagementScores(eventId || '');
  const { data: distribution } = useEngagementTierDistribution(eventId || '');
  const calculateEngagement = useCalculateEngagement();

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'hot': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'warm': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'engaged': return <Zap className="h-4 w-4 text-blue-500" />;
      default: return <Moon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'hot': return 'bg-orange-500';
      case 'warm': return 'bg-yellow-500';
      case 'engaged': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const totalScores = scores?.length || 0;

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
              <h1 className="text-2xl font-bold">Engagement Scoring</h1>
              <p className="text-muted-foreground">Track and analyze attendee engagement</p>
            </div>
          </div>
          <Button
            onClick={() => calculateEngagement.mutate(eventId!)}
            disabled={calculateEngagement.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${calculateEngagement.isPending ? 'animate-spin' : ''}`} />
            Recalculate Scores
          </Button>
        </div>

        {/* Tier Distribution */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { tier: 'hot', label: 'Hot', icon: Flame, color: 'text-orange-500' },
            { tier: 'warm', label: 'Warm', icon: Sun, color: 'text-yellow-500' },
            { tier: 'engaged', label: 'Engaged', icon: Zap, color: 'text-blue-500' },
            { tier: 'passive', label: 'Passive', icon: Moon, color: 'text-gray-400' },
          ].map(({ tier, label, icon: Icon, color }) => (
            <Card key={tier}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">
                      {distribution?.[tier as keyof typeof distribution] || 0}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
                <Progress
                  value={totalScores > 0 ? ((distribution?.[tier as keyof typeof distribution] || 0) / totalScores) * 100 : 0}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Scores Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : scores?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No engagement scores calculated yet</p>
                <Button onClick={() => calculateEngagement.mutate(eventId!)}>
                  Calculate Scores
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores?.map((score) => {
                    const breakdown = score.breakdown as {
                      points?: number;
                      sessions_attended?: number;
                      badges_earned?: number;
                    };
                    return (
                      <TableRow key={score.id}>
                        <TableCell className="font-medium">
                          {score.registration?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{score.registration?.company || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {getTierIcon(score.tier)}
                            {score.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{score.score}</TableCell>
                        <TableCell>{breakdown.points || 0}</TableCell>
                        <TableCell>{breakdown.sessions_attended || 0}</TableCell>
                        <TableCell>{breakdown.badges_earned || 0}</TableCell>
                        <TableCell>
                          {format(new Date(score.calculated_at), 'MMM d, h:mm a')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
