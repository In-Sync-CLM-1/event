import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePerformance, PerformancePeriod } from '@/hooks/usePerformance';
import { Calendar, Users, UserCheck, Flame, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PERIODS: { value: PerformancePeriod; label: string }[] = [
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'last_quarter', label: 'Last quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

const shortName = (title: string) => (title.length > 18 ? title.slice(0, 17).trimEnd() + '…' : title);

export default function Performance() {
  const [period, setPeriod] = useState<PerformancePeriod>('this_year');
  const { data, isLoading } = usePerformance(period);

  const kpis = [
    { title: 'Events Run', value: data?.totalEvents ?? '—', icon: Calendar, sub: data?.periodLabel },
    { title: 'Total Registrations', value: data?.totalRegistrations.toLocaleString() ?? '—', icon: Users, sub: 'Across all events' },
    { title: 'Attendance Rate', value: data ? `${data.attendanceRate}%` : '—', icon: UserCheck, sub: data ? `${data.totalAttended.toLocaleString()} walked in` : undefined },
    { title: 'Sales-Ready Leads', value: data?.salesReadyLeads.toLocaleString() ?? '—', icon: Flame, sub: 'Hot + Warm tiers' },
  ];

  const chartData = (data?.events ?? []).map((e) => ({
    name: shortName(e.title),
    Registered: e.registered,
    Attended: e.attended,
    Hot: e.hot,
    Warm: e.warm,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Performance</h1>
            <p className="text-muted-foreground mt-1">
              How your events added up — ready for the leadership review.
            </p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as PerformancePeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{k.title}</CardTitle>
                <k.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : k.value}
                </div>
                {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Registered vs Attended</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Registered" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Attended" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No events in this period</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales-Ready Leads by Event</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Hot" stackId="leads" fill="#f97316" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Warm" stackId="leads" fill="#eab308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No events in this period</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Registered</TableHead>
                  <TableHead className="text-right">Attended</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Hot</TableHead>
                  <TableHead className="text-right">Warm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.events ?? []).map((e) => (
                  <TableRow key={e.eventId}>
                    <TableCell>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.city || (e.mode === 'virtual' ? 'Virtual' : '')}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">{e.registered.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{e.attended.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={e.attendanceRate >= 70 ? 'default' : 'secondary'}>{e.attendanceRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-orange-600">{e.hot}</TableCell>
                    <TableCell className="text-right font-medium text-yellow-600">{e.warm}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
