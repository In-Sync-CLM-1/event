import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, BellRing, MessageCircle, PhoneCall, Loader2, Send, CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useEvent } from '@/hooks/useEvents';
import { useToast } from '@/hooks/use-toast';

interface ReminderSettings {
  whatsapp_enabled: boolean;
  calls_enabled: boolean;
  remind_day_before: boolean;
  remind_event_morning: boolean;
  bolna_agent_id: string | null;
}

const DEFAULTS: ReminderSettings = {
  whatsapp_enabled: true,
  calls_enabled: false,
  remind_day_before: true,
  remind_event_morning: true,
  bolna_agent_id: null,
};

const KIND_LABELS: Record<string, string> = {
  day_before: 'Day before',
  event_morning: 'Event morning',
  manual: 'Manual',
};

export default function Reminders() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: event } = useEvent(eventId || '');
  const [form, setForm] = useState<ReminderSettings>(DEFAULTS);

  const { data: settings } = useQuery({
    queryKey: ['reminder-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_reminder_settings')
        .select('*')
        .eq('event_id', eventId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        whatsapp_enabled: settings.whatsapp_enabled,
        calls_enabled: settings.calls_enabled,
        remind_day_before: settings.remind_day_before,
        remind_event_morning: settings.remind_event_morning,
        bolna_agent_id: settings.bolna_agent_id,
      });
    }
  }, [settings]);

  const { data: log, isLoading: logLoading } = useQuery({
    queryKey: ['event-reminders', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_reminders')
        .select('*, registration:registrations(full_name, company)')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
    refetchInterval: 30000,
  });

  const saveSettings = useMutation({
    mutationFn: async (next: ReminderSettings) => {
      const { error } = await supabase.from('event_reminder_settings').upsert({
        event_id: eventId!,
        whatsapp_enabled: next.whatsapp_enabled,
        calls_enabled: next.calls_enabled,
        remind_day_before: next.remind_day_before,
        remind_event_morning: next.remind_event_morning,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'event_id' });
      if (error) throw error;
      // Provision the voice agent the first time calls are switched on
      if (next.calls_enabled && !next.bolna_agent_id) {
        const { data, error: fnErr } = await supabase.functions.invoke('provision-reminder-agent', {
          body: { event_id: eventId },
        });
        if (fnErr) throw fnErr;
        if (!data?.success) throw new Error(data?.error || 'Agent provisioning failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings', eventId] });
      toast({ title: 'Reminder settings saved' });
    },
    onError: (e: Error) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  const sendNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-event-reminders', {
        body: { event_id: eventId, kind: 'manual' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event-reminders', eventId] });
      const r = data?.results?.[0];
      toast({
        title: 'Reminders dispatched',
        description: r ? `${r.whatsapp || 0} WhatsApp · ${r.ai_call || 0} calls · ${r.skipped || 0} already reminded` : undefined,
      });
    },
    onError: (e: Error) => toast({ title: 'Dispatch failed', description: e.message, variant: 'destructive' }),
  });

  const waCount = log?.filter((l) => l.channel === 'whatsapp' && l.status !== 'failed').length || 0;
  const callCount = log?.filter((l) => l.channel === 'ai_call').length || 0;
  const confirmedCount = log?.filter((l) => l.outcome?.toLowerCase().startsWith('confirmed')).length || 0;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'completed':
        return <Badge className="bg-success/10 text-success">{status}</Badge>;
      case 'queued':
        return <Badge variant="secondary">queued</Badge>;
      case 'no_answer':
        return <Badge className="bg-warning/10 text-warning">no answer</Badge>;
      case 'failed':
        return <Badge variant="destructive">failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to={`/admin/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground mt-1">
            {event?.title} — close the loop between registration and check-in
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp Reminders</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{waCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Delivered to confirmed attendees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI Reminder Calls</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Voice agent, outcome logged</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed on Call</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Said yes to the AI agent</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Reminder Loop</CardTitle>
            <CardDescription>
              Runs automatically — the day before the event and again on event morning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Template message with date, venue and registration number
                  </p>
                </div>
                <Switch
                  checked={form.whatsapp_enabled}
                  onCheckedChange={(v) => setForm({ ...form, whatsapp_enabled: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" /> AI reminder calls
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Voice agent confirms attendance and logs the outcome
                  </p>
                </div>
                <Switch
                  checked={form.calls_enabled}
                  onCheckedChange={(v) => setForm({ ...form, calls_enabled: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Day before the event</Label>
                  <p className="text-sm text-muted-foreground">5:00 PM, all confirmed attendees</p>
                </div>
                <Switch
                  checked={form.remind_day_before}
                  onCheckedChange={(v) => setForm({ ...form, remind_day_before: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Event morning</Label>
                  <p className="text-sm text-muted-foreground">9:00 AM, anyone not yet checked in</p>
                </div>
                <Switch
                  checked={form.remind_event_morning}
                  onCheckedChange={(v) => setForm({ ...form, remind_event_morning: v })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveSettings.mutate(form)} disabled={saveSettings.isPending}>
                {saveSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
              <Button variant="outline" onClick={() => sendNow.mutate()} disabled={sendNow.isPending}>
                {sendNow.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Reminders Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log */}
        <Card>
          <CardHeader>
            <CardTitle>Reminder Log</CardTitle>
            <CardDescription>Every reminder sent, every call outcome</CardDescription>
          </CardHeader>
          <CardContent>
            {logLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !log?.length ? (
              <div className="flex flex-col items-center justify-center py-10">
                <BellRing className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No reminders sent yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Wave</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.registration?.full_name || '—'}
                        {row.registration?.company && (
                          <span className="text-muted-foreground text-sm ml-2">{row.registration.company}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.channel === 'whatsapp' ? (
                          <Badge variant="outline" className="gap-1">
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <PhoneCall className="h-3 w-3" /> AI Call
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{KIND_LABELS[row.kind] || row.kind}</TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{row.outcome || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(row.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
