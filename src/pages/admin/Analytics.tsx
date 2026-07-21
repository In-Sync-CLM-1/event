import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRegistrationStats, useAttendanceTrends, useSessionPopularity, useEngagementDistribution, usePointsDistribution } from '@/hooks/useAnalytics';
import { ArrowLeft, Users, UserCheck, Clock, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { EChart, viz, vizAxisLabel, vizSplitLine, vizTooltip } from '@/components/charts/EChart';

const truncate = (s: string, n = 22) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// Horizontal lollipop — a 2px stem + dot instead of a fat bar
const lollipop = (rows: { name: string; value: number }[], valueLabel: string) => {
  const sorted = [...rows].sort((a, b) => a.value - b.value);
  return {
    grid: { left: 150, right: 40, top: 12, bottom: 30 },
    tooltip: {
      ...vizTooltip,
      trigger: 'item',
      formatter: (p: { name: string; value: number }) =>
        `<b>${p.name}</b><br/>${p.value.toLocaleString('en-IN')} ${valueLabel}`,
    },
    xAxis: {
      type: 'value',
      axisLabel: vizAxisLabel,
      splitLine: vizSplitLine,
    },
    yAxis: {
      type: 'category',
      data: sorted.map((r) => truncate(r.name)),
      axisLabel: { ...vizAxisLabel, fontSize: 12 },
      axisLine: { lineStyle: { color: viz.axis } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((r) => r.value),
        barWidth: 2,
        itemStyle: { color: viz.blueSoft },
        silent: true,
      },
      {
        type: 'scatter',
        data: sorted.map((r) => ({ name: r.name, value: r.value })),
        symbolSize: 11,
        itemStyle: { color: viz.blue, borderColor: viz.surface, borderWidth: 2 },
        label: {
          show: true,
          position: 'right',
          distance: 6,
          color: viz.inkSecondary,
          fontSize: 11,
          formatter: (p: { value: number }) => p.value.toLocaleString('en-IN'),
        },
      },
    ],
  };
};

export default function Analytics() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: regStats } = useRegistrationStats(eventId || '');
  const { data: attendanceTrends } = useAttendanceTrends(eventId || '');
  const { data: sessionPopularity } = useSessionPopularity(eventId || '');
  const { data: engagementDist } = useEngagementDistribution(eventId || '');
  const { data: pointsDist } = usePointsDistribution(eventId || '');

  const trendOption = useMemo(() => {
    if (!attendanceTrends?.length) return null;
    return {
      grid: { left: 44, right: 24, top: 20, bottom: 36 },
      tooltip: {
        ...vizTooltip,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: viz.axis, width: 1 } },
      },
      xAxis: {
        type: 'category',
        data: attendanceTrends.map((t) => new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
        axisLabel: vizAxisLabel,
        axisLine: { lineStyle: { color: viz.axis } },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: { type: 'value', axisLabel: vizAxisLabel, splitLine: vizSplitLine },
      series: [{
        name: 'Check-ins',
        type: 'line',
        data: attendanceTrends.map((t) => t.checkIns),
        lineStyle: { color: viz.blue, width: 2 },
        itemStyle: { color: viz.blue, borderColor: viz.surface, borderWidth: 2 },
        symbol: 'circle',
        symbolSize: 9,
        areaStyle: { color: viz.blue, opacity: 0.06 },
      }],
    };
  }, [attendanceTrends]);

  // Cumulative depth ladder: how far into engagement the audience actually went
  const depthOption = useMemo(() => {
    if (!engagementDist?.some((d) => d.count > 0)) return null;
    const count = (tier: string) => engagementDist.find((d) => d.tier === tier)?.count ?? 0;
    const total = engagementDist.reduce((s, d) => s + d.count, 0);
    const stages = [
      { name: 'All Scored', value: total },
      { name: 'Engaged or Better', value: count('hot') + count('warm') + count('engaged') },
      { name: 'Warm or Better', value: count('hot') + count('warm') },
      { name: 'Hot', value: count('hot') },
    ];
    return {
      tooltip: {
        ...vizTooltip,
        trigger: 'item',
        formatter: (p: { name: string; value: number }) =>
          `<b>${p.name}</b><br/>${p.value.toLocaleString('en-IN')} attendees · ${total ? Math.round((p.value / total) * 100) : 0}%`,
      },
      series: [{
        type: 'funnel',
        sort: 'none',
        left: 10, right: 10, top: 8, bottom: 8,
        minSize: '16%', maxSize: '94%',
        gap: 4,
        itemStyle: { borderColor: viz.surface, borderWidth: 2 },
        label: {
          position: 'inside',
          fontSize: 12,
          formatter: (p: { name: string; value: number }) => `${p.name}  ·  ${p.value.toLocaleString('en-IN')}`,
        },
        data: stages.map((s, i) => ({
          ...s,
          itemStyle: { color: viz.ramp4[i] },
          label: { color: i < 2 ? viz.ink : '#ffffff' },
        })),
      }],
    };
  }, [engagementDist]);

  const sessionOption = useMemo(() => {
    if (!sessionPopularity?.length) return null;
    return lollipop(
      sessionPopularity.slice(0, 5).map((s) => ({ name: s.title, value: s.attendees })),
      'attendees',
    );
  }, [sessionPopularity]);

  const pointsOption = useMemo(() => {
    if (!pointsDist?.length) return null;
    return lollipop(
      pointsDist.map((p) => ({ name: p.activity.replace(/_/g, ' '), value: p.points })),
      'points',
    );
  }, [pointsDist]);

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
              {trendOption ? (
                <EChart option={trendOption} height={250} />
              ) : (
                <p className="text-muted-foreground text-center py-8">No check-in data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Engagement Depth */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Depth</CardTitle>
            </CardHeader>
            <CardContent>
              {depthOption ? (
                <EChart option={depthOption} height={250} />
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
              {sessionOption ? (
                <EChart option={sessionOption} height={250} />
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
              {pointsOption ? (
                <EChart option={pointsOption} height={250} />
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
