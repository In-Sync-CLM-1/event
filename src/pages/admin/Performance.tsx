import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePerformance, PerformancePeriod, EventPerformance } from '@/hooks/usePerformance';
import { IndianRupee, Flame, TrendingDown, Target, Loader2 } from 'lucide-react';
import { EChart, viz, vizAxisLabel, vizSplitLine, vizTooltip } from '@/components/charts/EChart';

const PERIODS: { value: PerformancePeriod; label: string }[] = [
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'last_quarter', label: 'Last quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

const shortName = (title: string) => (title.length > 16 ? title.slice(0, 15).trimEnd() + '…' : title);

// Compact INR in Indian units — the notation a leadership review actually reads
export const inr = (n: number): string => {
  const trim = (s: string) => s.replace(/\.0$/, '');
  if (n >= 1e7) return `₹${trim((n / 1e7).toFixed(1))} Cr`;
  if (n >= 1e5) return `₹${trim((n / 1e5).toFixed(1))} L`;
  if (n >= 1e3) return `₹${trim((n / 1e3).toFixed(1))}k`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export default function Performance() {
  const [period, setPeriod] = useState<PerformancePeriod>('this_year');
  const { data, isLoading } = usePerformance(period);

  const kpis = [
    { title: 'Total Invested', value: data ? (data.hasSpend ? inr(data.totalSpend) : '—') : '—', icon: IndianRupee, sub: data?.periodLabel },
    { title: 'Sales-Ready Pipeline', value: data?.salesReadyLeads.toLocaleString('en-IN') ?? '—', icon: Flame, sub: 'Hot + warm leads handed to sales' },
    { title: 'Cost per Sales-Ready Lead', value: data?.costPerSalesReadyLead != null ? inr(data.costPerSalesReadyLead) : '—', icon: TrendingDown, sub: 'Invested ÷ pipeline' },
    { title: 'Reach → Pipeline', value: data ? `${data.pipelineConversion}%` : '—', icon: Target, sub: 'Registrations that became pipeline' },
  ];

  const funnelOption = useMemo(() => {
    if (!data || !data.totalRegistrations) return null;
    const stages = [
      { name: 'Registered', value: data.totalRegistrations },
      { name: 'Attended', value: data.totalAttended },
      { name: 'Engaged On-Site', value: data.totalActive },
      { name: 'Sales-Ready', value: data.salesReadyLeads },
    ];
    return {
      tooltip: {
        ...vizTooltip,
        trigger: 'item',
        formatter: (p: { name: string; value: number }) =>
          `<b>${p.name}</b><br/>${p.value.toLocaleString('en-IN')} people · ${Math.round((p.value / data.totalRegistrations) * 100)}% of registered`,
      },
      series: [{
        type: 'funnel',
        sort: 'none',
        left: 10, right: 10, top: 10, bottom: 10,
        minSize: '24%', maxSize: '94%',
        gap: 4,
        itemStyle: { borderColor: viz.surface, borderWidth: 2 },
        label: {
          position: 'inside',
          fontSize: 12,
          formatter: (p: { name: string; value: number }) =>
            `${p.name}  ·  ${p.value.toLocaleString('en-IN')}`,
        },
        emphasis: { label: { fontSize: 13 } },
        data: stages.map((s, i) => ({
          ...s,
          itemStyle: { color: viz.ramp4[i] },
          label: { color: i < 2 ? viz.ink : '#ffffff' },
        })),
      }],
    };
  }, [data]);

  const costTrend = useMemo(
    () => (data?.events ?? []).filter((e) => e.costPerLead != null),
    [data],
  );

  const costTrendOption = useMemo(() => {
    if (costTrend.length < 2) return null;
    return {
      grid: { left: 56, right: 24, top: 24, bottom: 40 },
      tooltip: {
        ...vizTooltip,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: viz.axis, width: 1 } },
        formatter: (params: Array<{ dataIndex: number }>) => {
          const e = costTrend[params[0].dataIndex];
          return `<b>${e.title}</b><br/>Spend ${inr(e.spend!)} · ${e.salesReady} sales-ready<br/><b>${inr(e.costPerLead!)}</b> per lead`;
        },
      },
      xAxis: {
        type: 'category',
        data: costTrend.map((e) => shortName(e.title)),
        axisLabel: { ...vizAxisLabel, interval: 0, rotate: costTrend.length > 4 ? 18 : 0 },
        axisLine: { lineStyle: { color: viz.axis } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...vizAxisLabel, formatter: (v: number) => inr(v) },
        splitLine: vizSplitLine,
      },
      series: [{
        type: 'line',
        data: costTrend.map((e) => e.costPerLead),
        lineStyle: { color: viz.blue, width: 2 },
        itemStyle: { color: viz.blue, borderColor: viz.surface, borderWidth: 2 },
        symbol: 'circle',
        symbolSize: 10,
        label: {
          show: true,
          color: viz.inkSecondary,
          fontSize: 11,
          formatter: (p: { dataIndex: number; value: number }) =>
            p.dataIndex === costTrend.length - 1 ? inr(p.value) : '',
        },
        areaStyle: { color: viz.blue, opacity: 0.06 },
      }],
    };
  }, [costTrend]);

  const spendVsPipeline = useMemo(
    () => (data?.events ?? []).filter((e) => e.spend != null),
    [data],
  );

  const scatterOption = useMemo(() => {
    if (!spendVsPipeline.length) return null;
    const maxAttended = Math.max(...spendVsPipeline.map((e) => e.attended), 1);
    return {
      grid: { left: 56, right: 40, top: 30, bottom: 44 },
      tooltip: {
        ...vizTooltip,
        trigger: 'item',
        formatter: (p: { dataIndex: number }) => {
          const e = spendVsPipeline[p.dataIndex];
          return `<b>${e.title}</b><br/>Spend ${inr(e.spend!)} → ${e.salesReady} sales-ready leads<br/>${e.attended.toLocaleString('en-IN')} attended${e.costPerLead != null ? ` · ${inr(e.costPerLead)} per lead` : ''}`;
        },
      },
      xAxis: {
        type: 'value',
        name: 'Spend',
        nameTextStyle: { color: viz.muted, fontSize: 11 },
        nameGap: 28,
        nameLocation: 'middle',
        axisLabel: { ...vizAxisLabel, formatter: (v: number) => inr(v) },
        axisLine: { show: false },
        splitLine: vizSplitLine,
      },
      yAxis: {
        type: 'value',
        name: 'Sales-ready leads',
        nameTextStyle: { color: viz.muted, fontSize: 11 },
        axisLabel: vizAxisLabel,
        splitLine: vizSplitLine,
      },
      series: [{
        type: 'scatter',
        data: spendVsPipeline.map((e) => [e.spend, e.salesReady]),
        symbolSize: (_: unknown, p: { dataIndex: number }) =>
          16 + Math.sqrt(spendVsPipeline[p.dataIndex].attended / maxAttended) * 26,
        itemStyle: { color: viz.blue, opacity: 0.85, borderColor: viz.surface, borderWidth: 2 },
        label: {
          show: true,
          position: 'top',
          distance: 8,
          color: viz.inkSecondary,
          fontSize: 11,
          formatter: (p: { dataIndex: number }) => shortName(spendVsPipeline[p.dataIndex].title),
        },
        labelLayout: { moveOverlap: 'shiftY', hideOverlap: false },
      }],
    };
  }, [spendVsPipeline]);

  const empty = (msg: string) => <p className="text-muted-foreground text-center py-10">{msg}</p>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Event ROI</h1>
            <p className="text-muted-foreground mt-1">
              What the events cost, and the sales pipeline they bought.
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
              <CardTitle>Where the Investment Went to Work</CardTitle>
              <p className="text-sm text-muted-foreground">From reach to pipeline, across every event in the period.</p>
            </CardHeader>
            <CardContent>
              {funnelOption ? <EChart option={funnelOption} height={300} /> : empty('No events in this period')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost per Sales-Ready Lead</CardTitle>
              <p className="text-sm text-muted-foreground">Event over event — the efficiency line leadership tracks.</p>
            </CardHeader>
            <CardContent>
              {costTrendOption
                ? <EChart option={costTrendOption} height={300} />
                : empty(data?.hasSpend ? 'Needs at least two events with spend recorded' : 'Add spend on each event to unlock ₹ metrics')}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spend vs Pipeline, by Event</CardTitle>
            <p className="text-sm text-muted-foreground">Up and to the left is winning — more pipeline for less money. Bubble size is attendance.</p>
          </CardHeader>
          <CardContent>
            {scatterOption
              ? <EChart option={scatterOption} height={340} />
              : empty('Add spend on each event to unlock ₹ metrics')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The Ledger Behind the Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Registered</TableHead>
                  <TableHead className="text-right">Attended</TableHead>
                  <TableHead className="text-right">Sales-Ready</TableHead>
                  <TableHead className="text-right">Cost / Lead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.events ?? []).map((e: EventPerformance) => (
                  <TableRow key={e.eventId}>
                    <TableCell>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.city || (e.mode === 'virtual' ? 'Virtual' : '')}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{e.spend != null ? inr(e.spend) : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.registered.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.attended.toLocaleString('en-IN')}
                      <span className="text-xs text-muted-foreground ml-1">({e.attendanceRate}%)</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {e.salesReady}
                      <span className="text-xs text-muted-foreground ml-1 font-normal">({e.hot} hot)</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {e.costPerLead != null ? inr(e.costPerLead) : '—'}
                    </TableCell>
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
