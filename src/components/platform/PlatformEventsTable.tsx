import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import type { EventRow } from '@/hooks/usePlatformDashboard';

interface Props {
  events: EventRow[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  cancelled: 'destructive',
  completed: 'outline',
};

export function PlatformEventsTable({ events }: Props) {
  const [search, setSearch] = useState('');

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Events</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No events found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 text-left font-medium">Event</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                  <th className="pb-3 text-left font-medium">Date</th>
                  <th className="pb-3 text-left font-medium">City</th>
                  <th className="pb-3 text-right font-medium">Registrations</th>
                  <th className="pb-3 text-right font-medium">Check-Ins</th>
                  <th className="pb-3 text-right font-medium">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(event => (
                  <tr key={event.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-medium">{event.title}</td>
                    <td className="py-3">
                      <Badge variant={statusVariant[event.status] ?? 'secondary'}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {format(new Date(event.start_date), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 text-muted-foreground">{event.city ?? '—'}</td>
                    <td className="py-3 text-right">{event.registrations}</td>
                    <td className="py-3 text-right">{event.checkIns}</td>
                    <td className={`py-3 text-right font-medium ${
                      event.attendanceRate >= 70 ? 'text-green-600' :
                      event.attendanceRate >= 40 ? 'text-yellow-600' :
                      event.registrations > 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {event.registrations > 0 ? `${event.attendanceRate}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
