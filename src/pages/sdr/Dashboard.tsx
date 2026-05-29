import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Share2, 
  Eye, 
  UserCheck, 
  Link as LinkIcon,
  FileText,
  Gift,
  ArrowRight
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useInvitations } from '@/hooks/useInvitations';
import { useContentShares } from '@/hooks/useContentShares';
import { MainLayout } from '@/components/layout/MainLayout';

export default function SDRDashboard() {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const eventsQuery = useEvents();
  const events = eventsQuery.data || [];
  
  const eventFilter = selectedEventId === 'all' ? undefined : selectedEventId;
  const { invitations, stats: invitationStats, isLoading: invitationsLoading } = useInvitations(eventFilter);
  const { shares, stats: shareStats, isLoading: sharesLoading } = useContentShares(eventFilter);

  const isLoading = eventsQuery.isLoading || invitationsLoading || sharesLoading;

  const recentInvitations = invitations.slice(0, 5);
  const recentShares = shares.slice(0, 5);

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">SDR Dashboard</h1>
            <p className="text-muted-foreground">Track your event engagement and referrals</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select event" />
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
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invitationStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {invitationStats?.registered || 0} registered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invitationStats?.checked_in || 0}</div>
              <p className="text-xs text-muted-foreground">
                {invitationStats?.total && invitationStats.total > 0
                  ? `${Math.round((invitationStats.checked_in / invitationStats.total) * 100)}% conversion`
                  : '0% conversion'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Shared</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shareStats?.totalShares || 0}</div>
              <p className="text-xs text-muted-foreground">
                {shareStats?.viewedCount || 0} viewed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shareStats?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">
                {shareStats?.viewRate || 0}% view rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/sdr/invite')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <LinkIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Create Invitation</h3>
                <p className="text-sm text-muted-foreground">Generate referral links</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/sdr/share')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Share Content</h3>
                <p className="text-sm text-muted-foreground">Send gated content</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/rewards')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">View Rewards</h3>
                <p className="text-sm text-muted-foreground">Check available rewards</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Tabs defaultValue="invitations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invitations">Recent Invitations</TabsTrigger>
            <TabsTrigger value="shares">Recent Shares</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invitations</CardTitle>
                <CardDescription>Your latest referral invitations</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : recentInvitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No invitations yet. Create your first referral link!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {invitation.invitee_name || invitation.invitee_email || 'Open Invitation'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {invitation.events?.title} • Code: {invitation.referral_code}
                          </p>
                        </div>
                        <Badge variant={
                          invitation.status === 'checked_in' ? 'default' :
                          invitation.status === 'registered' ? 'secondary' :
                          'outline'
                        }>
                          {invitation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                {recentInvitations.length > 0 && (
                  <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/sdr/invite')}>
                    View All Invitations
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shares">
            <Card>
              <CardHeader>
                <CardTitle>Recent Content Shares</CardTitle>
                <CardDescription>Content you've shared with contacts</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : recentShares.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No content shared yet. Start sharing to engage contacts!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentShares.map((share) => (
                      <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{share.content_library?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent to: {share.recipient_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={share.viewed_at ? 'default' : 'outline'}>
                            {share.viewed_at ? 'Viewed' : 'Not viewed'}
                          </Badge>
                          {share.view_count > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {share.view_count} views
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {recentShares.length > 0 && (
                  <Button variant="ghost" className="w-full mt-4" onClick={() => navigate('/sdr/share')}>
                    View All Shares
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
