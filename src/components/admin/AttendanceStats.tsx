import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttendanceStatsProps {
  totalRegistrations: number;
  totalCheckIns: number;
  todayCheckIns: number;
  attendanceRate: number;
  isLoading?: boolean;
}

export function AttendanceStats({
  totalRegistrations,
  totalCheckIns,
  todayCheckIns,
  attendanceRate,
  isLoading,
}: AttendanceStatsProps) {
  const stats = [
    {
      title: 'Total Registered',
      value: totalRegistrations,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Checked In',
      value: totalCheckIns,
      icon: UserCheck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: "Today's Check-ins",
      value: todayCheckIns,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
