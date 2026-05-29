import { Link } from 'react-router-dom';
import { Calendar, Users, QrCode, TrendingUp, Plus, ArrowUpRight, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';

export default function AdminDashboard() {
  const { data: events, isLoading } = useEvents();

  // Calculate stats
  const totalEvents = events?.length || 0;
  const publishedEvents = events?.filter((e) => e.status === 'published').length || 0;
  const upcomingEvents = events?.filter(
    (e) => new Date(e.start_date) > new Date() && e.status === 'published'
  ).length || 0;

  const stats = [
    {
      title: 'Total Events',
      value: totalEvents,
      icon: Calendar,
      description: `${publishedEvents} published`,
      href: '/admin/events',
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents,
      icon: TrendingUp,
      description: 'Next 30 days',
      href: '/admin/events',
    },
    {
      title: 'Total Registrations',
      value: '—',
      icon: Users,
      description: 'Across all events',
      href: '/admin/registrations',
    },
    {
      title: 'Check-ins Today',
      value: '—',
      icon: QrCode,
      description: 'Real-time tracking',
      href: '/admin/check-in',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your events.
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/events/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  <Link
                    to={stat.href}
                    className="text-xs text-primary hover:underline flex items-center"
                  >
                    View
                    <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/events">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : events?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No events yet</p>
                <Button asChild>
                  <Link to="/admin/events/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first event
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events?.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          event.status === 'published'
                            ? 'bg-success/10 text-success'
                            : event.status === 'draft'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {event.status}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/events/${event.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/events/new">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up a new event with registration
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/check-in">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">QR Check-In</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan attendee QR codes
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/registrations">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Registrations</h3>
                  <p className="text-sm text-muted-foreground">
                    View and export attendee data
                  </p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
