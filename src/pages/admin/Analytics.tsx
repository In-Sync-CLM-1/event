import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRegistrationStats, useAttendanceTrends, useSessionPopularity, useEngagementDistribution, usePointsDistribution } from '@/hooks/useAnalytics';
import { ArrowLeft, Users, UserCheck, Clock, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Analytics() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: regStats } = useRegistrationStats(eventId || '');
  const { data: attendanceTrends } = useAttendanceTrends(eventId || '');
  const { data: sessionPopularity } = useSessionPopularity(eventId || '');
  const { data: engagementDist } = useEngagementDistribution(eventId || '');
  const { data: pointsDist } = usePointsDistribution(eventId || '');

  const COLORS = ['#f97316', '#eab308', '#3b82f6', '#9ca3af'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to={`/admin/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Event performance insights</p>
          </div>
        </div>

        {/* Registration Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                  <p className="text-2xl font-bold">{regStats?.total || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">{regStats?.confirmed || 0}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
              {regStats && regStats.total > 0 && (
                <Progress
                  value={(regStats.confirmed / regStats.total) * 100}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Checked In</p>
                  <p className="text-2xl font-bold">{regStats?.checkedIn || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              {regStats && regStats.confirmed > 0 && (
                <Progress
                  value={(regStats.checkedIn / regStats.confirmed) * 100}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{regStats?.pending || 0}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Attendance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Check-in Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceTrends && attendanceTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={attendanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="checkIns" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No check-in data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Engagement Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              {engagementDist && engagementDist.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={engagementDist}
                      dataKey="count"
                      nameKey="tier"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ tier, percentage }) => `${tier}: ${percentage}%`}
                    >
                      {engagementDist.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No engagement data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Session Popularity */}
          <Card>
            <CardHeader>
              <CardTitle>Session Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionPopularity && sessionPopularity.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sessionPopularity.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="title" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="attendees" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No session attendance data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Points by Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Points by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {pointsDist && pointsDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pointsDist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="activity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="points" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No points data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
