import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, ClipboardList, CheckSquare, TrendingUp, Radio } from 'lucide-react';
import type { PlatformSummary } from '@/hooks/usePlatformDashboard';

interface Props {
  summary: PlatformSummary;
}

export function PlatformSummaryStats({ summary }: Props) {
  const cards = [
    {
      title: 'Total Events',
      value: summary.totalEvents,
      icon: Calendar,
      color: 'text-primary',
      sub: `${summary.publishedEvents} published`,
    },
    {
      title: 'Registrations',
      value: summary.totalRegistrations,
      icon: ClipboardList,
      color: 'text-blue-500',
      sub: `${summary.recentRegistrations} last 7 days`,
    },
    {
      title: 'Unique Attendees',
      value: summary.totalUsers,
      icon: Users,
      color: 'text-violet-500',
      sub: 'across all events',
    },
    {
      title: 'Total Check-Ins',
      value: summary.totalCheckIns,
      icon: CheckSquare,
      color: 'text-green-500',
      sub: `${summary.todayCheckIns} today`,
    },
    {
      title: 'Avg Attendance',
      value: `${summary.avgAttendanceRate}%`,
      icon: TrendingUp,
      color: summary.avgAttendanceRate >= 70 ? 'text-green-500' : summary.avgAttendanceRate >= 40 ? 'text-yellow-500' : 'text-red-500',
      sub: 'check-in rate',
    },
    {
      title: 'Live Events',
      value: summary.publishedEvents,
      icon: Radio,
      color: 'text-primary',
      sub: 'currently published',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{card.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
