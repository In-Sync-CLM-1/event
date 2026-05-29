import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard } from '@/hooks/usePoints';
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: leaderboard, isLoading } = useLeaderboard(eventId || '', 50);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-white';
      case 2: return 'bg-gray-400 text-white';
      case 3: return 'bg-amber-600 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-2">
              See who's earning the most points at this event
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Participants</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8">Loading...</p>
              ) : leaderboard?.length === 0 ? (
                <div className="text-center py-8">
                  <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No points have been awarded yet. Participate in sessions and activities to earn points!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard?.map((entry) => (
                    <div
                      key={entry.registration_id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        entry.rank <= 3 ? 'bg-muted/50' : ''
                      }`}
                    >
                      <Badge className={`w-10 h-10 flex items-center justify-center text-lg ${getRankStyle(entry.rank)}`}>
                        {entry.rank}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold">{entry.full_name}</p>
                        {entry.company && (
                          <p className="text-sm text-muted-foreground">{entry.company}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{entry.total_points}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
