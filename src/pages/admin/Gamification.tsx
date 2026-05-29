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
import { useLeaderboard, useAwardPoints, usePointsLog } from '@/hooks/usePoints';
import { useBadges, useCreateBadge, useDeleteBadge, useAwardBadge } from '@/hooks/useBadges';
import { useRewards, useCreateReward, useDeleteReward } from '@/hooks/useRewards';
import { useRegistrations } from '@/hooks/useRegistrations';
import { Trophy, Award, Gift, Plus, Trash2, UserPlus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function Gamification() {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'rewards' | 'points'>('leaderboard');
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);

  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(eventId || '', 50);
  const { data: badges, isLoading: badgesLoading } = useBadges(eventId || '');
  const { data: rewards, isLoading: rewardsLoading } = useRewards(eventId || '');
  const { data: pointsLog } = usePointsLog(eventId || '');
  const { data: registrations } = useRegistrations(eventId || '');

  const createBadge = useCreateBadge();
  const deleteBadge = useDeleteBadge();
  const createReward = useCreateReward();
  const deleteReward = useDeleteReward();
  const awardPoints = useAwardPoints();
  const awardBadge = useAwardBadge();

  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    points_value: 0,
  });

  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    points_required: 0,
    quantity: null as number | null,
  });

  const [pointsAward, setPointsAward] = useState({
    registration_id: '',
    points: 0,
    activity_type: 'manual',
    description: '',
  });

  const handleCreateBadge = async () => {
    if (!eventId || !newBadge.name) return;
    await createBadge.mutateAsync({
      event_id: eventId,
      name: newBadge.name,
      description: newBadge.description || null,
      points_value: newBadge.points_value,
      sort_order: (badges?.length || 0) + 1,
    });
    setNewBadge({ name: '', description: '', points_value: 0 });
    setShowBadgeDialog(false);
  };

  const handleCreateReward = async () => {
    if (!eventId || !newReward.name) return;
    await createReward.mutateAsync({
      event_id: eventId,
      name: newReward.name,
      description: newReward.description || null,
      image_url: null,
      points_required: newReward.points_required,
      quantity: newReward.quantity,
      is_active: true,
      sort_order: (rewards?.length || 0) + 1,
    });
    setNewReward({ name: '', description: '', points_required: 0, quantity: null });
    setShowRewardDialog(false);
  };

  const handleAwardPoints = async () => {
    if (!eventId || !pointsAward.registration_id || pointsAward.points <= 0) return;
    await awardPoints.mutateAsync({
      event_id: eventId,
      registration_id: pointsAward.registration_id,
      points: pointsAward.points,
      activity_type: pointsAward.activity_type,
      description: pointsAward.description,
    });
    setPointsAward({ registration_id: '', points: 0, activity_type: 'manual', description: '' });
    setShowPointsDialog(false);
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
              <h1 className="text-2xl font-bold">Gamification</h1>
              <p className="text-muted-foreground">Manage points, badges, and rewards</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
          <Button
            variant={activeTab === 'badges' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('badges')}
          >
            <Award className="mr-2 h-4 w-4" />
            Badges
          </Button>
          <Button
            variant={activeTab === 'rewards' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('rewards')}
          >
            <Gift className="mr-2 h-4 w-4" />
            Rewards
          </Button>
          <Button
            variant={activeTab === 'points' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('points')}
          >
            Points Log
          </Button>
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leaderboard</CardTitle>
              <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Award Points
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Award Points</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Attendee</Label>
                      <Select
                        value={pointsAward.registration_id}
                        onValueChange={(v) => setPointsAward({ ...pointsAward, registration_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select attendee" />
                        </SelectTrigger>
                        <SelectContent>
                          {registrations?.filter(r => r.status !== 'cancelled').map((reg) => (
                            <SelectItem key={reg.id} value={reg.id}>
                              {reg.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Points</Label>
                      <Input
                        type="number"
                        value={pointsAward.points}
                        onChange={(e) => setPointsAward({ ...pointsAward, points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Activity Type</Label>
                      <Select
                        value={pointsAward.activity_type}
                        onValueChange={(v) => setPointsAward({ ...pointsAward, activity_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Award</SelectItem>
                          <SelectItem value="check_in">Check-in</SelectItem>
                          <SelectItem value="session_attendance">Session Attendance</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={pointsAward.description}
                        onChange={(e) => setPointsAward({ ...pointsAward, description: e.target.value })}
                        placeholder="Reason for award"
                      />
                    </div>
                    <Button onClick={handleAwardPoints} className="w-full">
                      Award Points
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <p>Loading...</p>
              ) : leaderboard?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No points awarded yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard?.map((entry) => (
                      <TableRow key={entry.registration_id}>
                        <TableCell>
                          {entry.rank <= 3 ? (
                            <span className={`font-bold ${
                              entry.rank === 1 ? 'text-yellow-500' :
                              entry.rank === 2 ? 'text-gray-400' :
                              'text-amber-600'
                            }`}>
                              #{entry.rank}
                            </span>
                          ) : (
                            `#${entry.rank}`
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{entry.full_name}</TableCell>
                        <TableCell>{entry.company || '-'}</TableCell>
                        <TableCell className="text-right font-bold">{entry.total_points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Badges</CardTitle>
              <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Badge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Badge</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newBadge.name}
                        onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                        placeholder="e.g., Early Bird"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newBadge.description}
                        onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                        placeholder="Badge description"
                      />
                    </div>
                    <div>
                      <Label>Points Value</Label>
                      <Input
                        type="number"
                        value={newBadge.points_value}
                        onChange={(e) => setNewBadge({ ...newBadge, points_value: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={handleCreateBadge} className="w-full">
                      Create Badge
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {badgesLoading ? (
                <p>Loading...</p>
              ) : badges?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No badges created yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {badges?.map((badge) => (
                    <Card key={badge.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{badge.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                            <Badge variant="secondary" className="mt-2">
                              {badge.points_value} points
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBadge.mutate({ id: badge.id, eventId: eventId! })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rewards</CardTitle>
              <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Reward
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Reward</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newReward.name}
                        onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                        placeholder="e.g., Event T-Shirt"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newReward.description}
                        onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                        placeholder="Reward description"
                      />
                    </div>
                    <div>
                      <Label>Points Required</Label>
                      <Input
                        type="number"
                        value={newReward.points_required}
                        onChange={(e) => setNewReward({ ...newReward, points_required: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Quantity (leave empty for unlimited)</Label>
                      <Input
                        type="number"
                        value={newReward.quantity || ''}
                        onChange={(e) => setNewReward({ 
                          ...newReward, 
                          quantity: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        placeholder="Unlimited"
                      />
                    </div>
                    <Button onClick={handleCreateReward} className="w-full">
                      Create Reward
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {rewardsLoading ? (
                <p>Loading...</p>
              ) : rewards?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No rewards created yet</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rewards?.map((reward) => (
                    <Card key={reward.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Gift className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{reward.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">{reward.points_required} points</Badge>
                              <Badge variant="outline">
                                {reward.quantity 
                                  ? `${reward.claimed_count}/${reward.quantity} claimed`
                                  : `${reward.claimed_count} claimed`
                                }
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReward.mutate({ id: reward.id, eventId: eventId! })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Points Log Tab */}
        {activeTab === 'points' && (
          <Card>
            <CardHeader>
              <CardTitle>Points Log</CardTitle>
            </CardHeader>
            <CardContent>
              {pointsLog?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No points awarded yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointsLog?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.awarded_at), 'MMM d, h:mm a')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.activity_type}</Badge>
                        </TableCell>
                        <TableCell>{log.description || '-'}</TableCell>
                        <TableCell className="text-right font-medium">+{log.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
