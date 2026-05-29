import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Filter, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  designation: string | null;
  registration_number: string;
  status: string;
  registered_at: string;
  checked_in_at: string | null;
  event: {
    id: string;
    title: string;
  };
}

export default function Registrations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  const { data: events } = useQuery({
    queryKey: ['events-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['all-registrations', searchQuery, statusFilter, eventFilter],
    queryFn: async () => {
      let query = supabase
        .from('registrations')
        .select(`
          id,
          full_name,
          email,
          phone,
          company,
          designation,
          registration_number,
          status,
          registered_at,
          checked_in_at,
          event:events(id, title)
        `)
        .order('registered_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'checked_in');
      }

      if (eventFilter !== 'all') {
        query = query.eq('event_id', eventFilter);
      }

      if (searchQuery) {
        query = query.or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,registration_number.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as unknown as Registration[];
    },
  });

  const stats = {
    total: registrations?.length || 0,
    confirmed: registrations?.filter((r) => r.status === 'confirmed').length || 0,
    checkedIn: registrations?.filter((r) => r.status === 'checked_in').length || 0,
    pending: registrations?.filter((r) => r.status === 'pending').length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-success/10 text-success">Checked In</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary/10 text-primary">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'waitlisted':
        return <Badge variant="outline">Waitlisted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleExport = () => {
    if (!registrations) return;
    
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Company', 'Designation', 'Registration #', 'Status', 'Event', 'Registered At'].join(','),
      ...registrations.map((r) =>
        [
          `"${r.full_name}"`,
          r.email,
          r.phone || '',
          `"${r.company || ''}"`,
          `"${r.designation || ''}"`,
          r.registration_number,
          r.status,
          `"${r.event?.title || ''}"`,
          format(new Date(r.registered_at), 'yyyy-MM-dd HH:mm'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Registrations</h1>
            <p className="text-muted-foreground">Manage all event registrations</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkedIn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or registration number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Reg #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading registrations...
                    </TableCell>
                  </TableRow>
                ) : registrations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No registrations found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations?.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.full_name}</TableCell>
                      <TableCell>{registration.email}</TableCell>
                      <TableCell>{registration.company || '-'}</TableCell>
                      <TableCell>
                        <span className="text-sm">{registration.event?.title || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {registration.registration_number}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(registration.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(registration.registered_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
