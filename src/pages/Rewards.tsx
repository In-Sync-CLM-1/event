import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useActiveRewards, useUserClaims, useClaimReward } from '@/hooks/useRewards';
import { useUserPoints } from '@/hooks/usePoints';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Check, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Rewards() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: rewards, isLoading } = useActiveRewards(eventId || '');
  const { data: registrations } = useRegistrations(eventId || '');
  
  // Find user's registration
  const userRegistration = registrations?.find(
    r => r.user_id === user?.id || r.email === user?.email
  );

  const { data: userPoints } = useUserPoints(userRegistration?.id || '');
  const { data: userClaims } = useUserClaims(userRegistration?.id || '');
  const claimReward = useClaimReward();

  const handleClaim = async (rewardId: string) => {
    if (!userRegistration || !eventId) {
      toast({
        title: 'Not registered',
        description: 'You must be registered for this event to claim rewards',
        variant: 'destructive',
      });
      return;
    }

    await claimReward.mutateAsync({
      rewardId,
      registrationId: userRegistration.id,
      eventId,
    });
  };

  const hasClaimed = (rewardId: string) => {
    return userClaims?.some(c => c.reward_id === rewardId);
  };

  const canAfford = (pointsRequired: number) => {
    return (userPoints?.totalPoints || 0) >= pointsRequired;
  };

  const isAvailable = (reward: { quantity: number | null; claimed_count: number }) => {
    return reward.quantity === null || reward.claimed_count < reward.quantity;
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <Gift className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold">Rewards</h1>
            <p className="text-muted-foreground mt-2">
              Redeem your points for exclusive rewards
            </p>
            {userPoints && (
              <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <span className="text-sm text-muted-foreground">Your Points:</span>
                <span className="text-xl font-bold text-primary">{userPoints.totalPoints}</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <p className="text-center py-8">Loading rewards...</p>
          ) : rewards?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No rewards available yet. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rewards?.map((reward) => {
                const claimed = hasClaimed(reward.id);
                const affordable = canAfford(reward.points_required);
                const available = isAvailable(reward);

                return (
                  <Card key={reward.id} className={!available ? 'opacity-60' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {reward.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary">
                              {reward.points_required} points
                            </Badge>
                            {reward.quantity && (
                              <Badge variant="outline">
                                {reward.quantity - reward.claimed_count} left
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        {claimed ? (
                          <Button disabled className="w-full">
                            <Check className="mr-2 h-4 w-4" />
                            Claimed
                          </Button>
                        ) : !available ? (
                          <Button disabled className="w-full">
                            Sold Out
                          </Button>
                        ) : !affordable ? (
                          <Button disabled variant="secondary" className="w-full">
                            <Lock className="mr-2 h-4 w-4" />
                            Need {reward.points_required - (userPoints?.totalPoints || 0)} more points
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleClaim(reward.id)}
                            disabled={claimReward.isPending}
                            className="w-full"
                          >
                            Claim Reward
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Claimed Rewards */}
          {userClaims && userClaims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Claimed Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userClaims.map((claim) => (
                    <div key={claim.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-primary" />
                        <span className="font-medium">{claim.reward?.name}</span>
                      </div>
                      <Badge variant={claim.fulfilled ? 'default' : 'secondary'}>
                        {claim.fulfilled ? 'Fulfilled' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
