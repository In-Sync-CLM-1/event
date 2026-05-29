import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, QrCode, Award, BarChart3, Trophy,
  ArrowRight, Play, Pause, RotateCcw, Sparkles,
  CheckCircle, TrendingUp, Star, Gift, Target,
  MapPin, Clock, UserCheck, Download, Shield,
  Share2, ChevronRight, Zap, Mail, IndianRupee,
  LayoutDashboard, Settings, FileText, Bell,
} from "lucide-react";

/* ── Timing ──────────────────────────────────────────────────────────────── */

const SCENES = [
  { id: "intro",        label: "Intro",        duration: 4000 },
  { id: "dashboard",   label: "Dashboard",    duration: 11000 },
  { id: "event-setup", label: "Event Setup",  duration: 11000 },
  { id: "checkin",     label: "Check-In",     duration: 11000 },
  { id: "gamification",label: "Gamification", duration: 12000 },
  { id: "certificates",label: "Certificates", duration: 10000 },
  { id: "analytics",   label: "Analytics",    duration: 10000 },
  { id: "outro",       label: "Summary",      duration: 5000 },
] as const;

const TOTAL = SCENES.reduce((s, sc) => s + sc.duration, 0);
type SceneId = (typeof SCENES)[number]["id"];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 },
};

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, delay } },
});

const slideLeft = (delay = 0) => ({
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, delay } },
});

const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, delay } },
});

/* ── Typewriter ──────────────────────────────────────────────────────────── */

function TypewriterText({ text, delay = 0, speed = 35 }: { text: string; delay?: number; speed?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) { setShown(text.slice(0, i)); i++; }
        else clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [text, delay, speed]);
  return (
    <>
      {shown}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-middle"
      />
    </>
  );
}

/* ── Animated Value ──────────────────────────────────────────────────────── */

function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);
  return <p className="mt-1 text-2xl font-bold text-foreground">{show ? value : "—"}</p>;
}

/* ── KPI Card ────────────────────────────────────────────────────────────── */

function KpiCard({ label, value, change, color, icon: Icon, delay }: {
  label: string; value: string; change: string; color: string; icon: any; delay: number;
}) {
  return (
    <motion.div {...slideUp(delay)} className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <AnimatedValue value={value} delay={delay + 0.3} />
        </div>
        <div className="rounded-lg bg-muted/50 p-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: delay + 0.8 } }}
        className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600"
      >
        <TrendingUp className="h-3 w-3" /> {change}
      </motion.div>
    </motion.div>
  );
}

/* ── Mini Bar Chart ──────────────────────────────────────────────────────── */

function MiniBarChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = [42, 68, 55, 80, 95, 72, 88];
  const max = 95;
  return (
    <motion.div {...slideUp(0.5)} className="overflow-hidden rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Registrations This Week</p>
        <span className="text-[10px] text-emerald-600 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> +24% vs last week
        </span>
      </div>
      <div className="flex items-end gap-2" style={{ height: 80 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
              initial={{ height: 0 }}
              animate={{ height: `${(d / max) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.8 + i * 0.08, ease: "easeOut" }}
              style={{ minHeight: 4 }}
            />
            <span className="text-[9px] text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Mock Sidebar ────────────────────────────────────────────────────────── */

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Calendar,        label: "Events" },
  { icon: Users,           label: "Attendees" },
  { icon: QrCode,          label: "Check-In" },
  { icon: Trophy,          label: "Gamification" },
  { icon: Award,           label: "Certificates" },
  { icon: BarChart3,       label: "Analytics" },
  { icon: Share2,          label: "Content" },
  { icon: Settings,        label: "Settings" },
];

function MockSidebar({ active }: { active: string }) {
  return (
    <motion.div
      {...slideRight()}
      className="flex w-48 shrink-0 flex-col border-r border-border/60 bg-[hsl(var(--sidebar-background,var(--background)))]"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border/40 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Calendar className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">Event-Sync</span>
      </div>
      <div className="border-b border-border/40 px-3 py-2">
        <div className="rounded-md bg-muted/50 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
          TechSummit Org
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const isActive = item.label === active;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-border/40 px-4 py-3">
        <p className="truncate text-[10px] text-muted-foreground">admin@techsummit.in</p>
      </div>
    </motion.div>
  );
}

/* ── Scene: Intro ────────────────────────────────────────────────────────── */

function SceneIntro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-teal-500/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/30"
      >
        <Calendar className="h-12 w-12 text-primary-foreground" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative text-5xl font-extrabold tracking-tight text-foreground"
      >
        Event-Sync
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative mt-3 text-lg text-muted-foreground"
      >
        The complete event management platform
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="relative mt-8 flex items-center gap-3 flex-wrap justify-center"
      >
        {[
          { icon: QrCode,     label: "QR Check-In" },
          { icon: Trophy,     label: "Gamification" },
          { icon: Award,      label: "Certificates" },
          { icon: BarChart3,  label: "Analytics" },
        ].map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.15 }}
            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <p.icon className="h-3 w-3" /> {p.label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Scene: Dashboard ────────────────────────────────────────────────────── */

function SceneDashboard() {
  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
            <p className="text-xs text-muted-foreground">Your event command centre</p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-semibold text-emerald-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> TechSummit 2025 — Live
          </motion.div>
        </motion.div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <KpiCard label="Total Registered"   value="1,240"  change="+86 this week"        color="from-blue-500 to-blue-600"    icon={Users}       delay={0.15} />
          <KpiCard label="Checked In"         value="847"    change="68% attendance rate"   color="from-emerald-500 to-green-600" icon={UserCheck}   delay={0.25} />
          <KpiCard label="Sessions Running"   value="6"      change="3 tracks active"       color="from-violet-500 to-purple-600" icon={Calendar}    delay={0.35} />
          <KpiCard label="Engagement Score"   value="82/100" change="+12 vs last event"     color="from-amber-500 to-orange-600"  icon={Trophy}      delay={0.45} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <MiniBarChart />
          </div>
          {/* Recent activity feed */}
          <motion.div {...slideLeft(0.6)} className="overflow-hidden rounded-xl border border-border/60 bg-card p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Live Activity</p>
            <div className="space-y-2.5">
              {[
                { icon: UserCheck, label: "Priya N. checked in",        time: "just now",  color: "text-emerald-500" },
                { icon: Trophy,    label: "Rahul M. earned 50 pts",      time: "1 min ago", color: "text-amber-500" },
                { icon: Award,     label: "Badge 'Early Bird' awarded",  time: "3 min ago", color: "text-blue-500" },
                { icon: Star,      label: "Sneha K. joined Session 3",   time: "5 min ago", color: "text-violet-500" },
                { icon: Gift,      label: "Amit J. redeemed a reward",   time: "8 min ago", color: "text-rose-500" },
              ].map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.7 + i * 0.1 } }}
                  className="flex items-center gap-2"
                >
                  <a.icon className={`h-3.5 w-3.5 flex-shrink-0 ${a.color}`} />
                  <span className="flex-1 text-[10px] text-foreground truncate">{a.label}</span>
                  <span className="text-[9px] text-muted-foreground flex-shrink-0">{a.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Event Setup ──────────────────────────────────────────────────── */

function SceneEventSetup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 5500),
      setTimeout(() => setStep(4), 7500),
      setTimeout(() => setStep(5), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Events" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)}>
          <h2 className="text-xl font-bold text-foreground">Create Event</h2>
          <p className="text-xs text-muted-foreground">Set up your event in minutes</p>
        </motion.div>

        {/* Progress steps */}
        <motion.div {...slideUp(0.15)} className="mt-4 flex items-center gap-2">
          {["Details", "Registration", "Sessions", "Publish"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <span>{i + 1}</span> {s}
              </div>
              {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </motion.div>

        <div className="mt-4 flex gap-4">
          <div className="flex-1 space-y-3">
            {/* Event name */}
            <motion.div {...slideUp(0.2)} className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Event Name</p>
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <TypewriterText text="TechSummit India 2025" delay={0.4} speed={45} />
              </div>
            </motion.div>

            {/* Date & Venue */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">Mar 15–16, 2025</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Venue</p>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">HICC, Hyderabad</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Capacity */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Capacity</p>
                  <div className="flex gap-3">
                    {[
                      { label: "Max Attendees", value: "2,000" },
                      { label: "Registration Deadline", value: "Mar 12, 2025" },
                    ].map((f) => (
                      <div key={f.label} className="flex-1 rounded-lg border border-border bg-background px-3 py-2">
                        <div className="text-[9px] text-muted-foreground mb-0.5">{f.label}</div>
                        <div className="text-sm font-medium text-foreground">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom fields */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registration Fields</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Full Name", type: "text", required: true },
                      { label: "Company", type: "text", required: false },
                      { label: "Job Title", type: "text", required: false },
                      { label: "T-Shirt Size", type: "select", required: true },
                    ].map((f, i) => (
                      <motion.div
                        key={f.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.1 } }}
                        className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="flex-1 text-[10px] font-medium text-foreground">{f.label}</span>
                        <span className="text-[9px] text-muted-foreground rounded bg-background px-1.5 py-0.5">{f.type}</span>
                        {f.required && <span className="text-[8px] text-red-500 font-medium">required</span>}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Live preview card */}
          <motion.div {...slideLeft(0.3)} className="w-44 shrink-0">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
              <div className="h-20 rounded-lg bg-gradient-to-br from-primary/20 to-teal-500/20 mb-3" />
              <p className="text-xs font-bold text-foreground leading-tight">TechSummit India 2025</p>
              <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" /> Mar 15–16, 2025
              </div>
              <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" /> HICC, Hyderabad
              </div>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 w-full rounded-lg bg-primary px-2 py-1.5 text-center text-[10px] font-semibold text-primary-foreground">
                  Register Now
                </motion.div>
              )}
            </div>

            {/* Publish success */}
            <AnimatePresence>
              {step >= 5 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] font-medium text-emerald-700">Event published!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: QR Check-In ──────────────────────────────────────────────────── */

function SceneCheckIn() {
  const [step, setStep] = useState(0);
  const [checkedIn, setCheckedIn] = useState(847);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 7000),
      setTimeout(() => setStep(5), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Simulate live check-ins
  useEffect(() => {
    if (step < 2) return;
    const interval = setInterval(() => {
      setCheckedIn((c) => c + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [step]);

  const attendees = [
    { name: "Priya Nair",    company: "TechCorp",   status: step >= 2 ? "checked-in" : "registered" },
    { name: "Rahul Mehta",   company: "StartupX",   status: step >= 3 ? "checked-in" : "registered" },
    { name: "Sneha Kapoor",  company: "EduCon",     status: step >= 4 ? "checked-in" : "registered" },
    { name: "Amit Joshi",    company: "FinFest",    status: "registered" },
    { name: "Kavya Reddy",   company: "MedConf",    status: "registered" },
  ];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Check-In" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Check-In</h2>
            <p className="text-xs text-muted-foreground">TechSummit India 2025 — Scan or search</p>
          </div>
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
              <span className="text-2xl font-extrabold text-emerald-700">{checkedIn.toLocaleString()}</span>
              <div>
                <div className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wide">Checked In</div>
                <div className="text-[9px] text-emerald-600">of 1,240 registered</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="mt-4 grid grid-cols-3 gap-4 h-[calc(100%-60px)]">
          {/* QR Scanner */}
          <div className="col-span-1 flex flex-col gap-3">
            <motion.div {...slideUp(0.2)} className="rounded-xl border border-border/60 bg-card p-4 flex-1">
              <p className="mb-3 text-xs font-semibold text-foreground">QR Scanner</p>
              {/* Scanner viewport */}
              <div className="relative rounded-xl bg-slate-900 overflow-hidden" style={{ aspectRatio: "1" }}>
                {/* Scan frame corners */}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />

                {/* Scan line */}
                <AnimatePresence>
                  {step < 2 && (
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 bg-emerald-400/80 shadow-lg shadow-emerald-400/50"
                      animate={{ top: ["20%", "80%", "20%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </AnimatePresence>

                {/* Scan success flash */}
                <AnimatePresence>
                  {step >= 2 && step < 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-10 w-10 text-emerald-400" />
                        <span className="text-emerald-300 text-xs font-semibold">Scan OK</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mock QR code pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-0.5 opacity-20">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? "bg-white" : "bg-transparent"}`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Check-in result card */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                        PN
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">Priya Nair</p>
                        <p className="text-[9px] text-emerald-600">TechCorp · Reg #TEC-001</p>
                      </div>
                      <CheckCircle className="ml-auto h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="mt-1.5 text-[9px] text-emerald-600 font-medium">✓ Checked in at 10:24 AM</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Attendee list */}
          <div className="col-span-2">
            <motion.div {...slideLeft(0.2)} className="rounded-xl border border-border/60 bg-card overflow-hidden h-full">
              <div className="flex items-center border-b border-border/40 bg-muted/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="flex-[2]">Attendee</div>
                <div className="flex-[2]">Company</div>
                <div className="flex-1">Status</div>
                <div className="flex-1">Time</div>
              </div>
              <div className="divide-y divide-border/30">
                {attendees.map((a, i) => (
                  <motion.div
                    key={a.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.08 } }}
                    className="flex items-center px-4 py-2.5"
                  >
                    <div className="flex flex-[2] items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                        {a.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-xs font-medium text-foreground">{a.name}</span>
                    </div>
                    <span className="flex-[2] text-xs text-muted-foreground">{a.company}</span>
                    <div className="flex-1">
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${
                        a.status === "checked-in"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {a.status === "checked-in" ? "✓ In" : "Pending"}
                      </span>
                    </div>
                    <span className="flex-1 text-[9px] text-muted-foreground">
                      {a.status === "checked-in" ? "10:2" + (i + 2) + " AM" : "—"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Gamification ─────────────────────────────────────────────────── */

function SceneGamification() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5500),
      setTimeout(() => setStep(4), 7500),
      setTimeout(() => setStep(5), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const leaderboard = [
    { rank: 1, name: "Priya Nair",   pts: 520, change: "+50", medal: "🥇", bar: "100%" },
    { rank: 2, name: "Rahul Mehta",  pts: 480, change: "+30", medal: "🥈", bar: "92%"  },
    { rank: 3, name: "Sneha K.",     pts: 395, change: "+20", medal: "🥉", bar: "76%"  },
    { rank: 4, name: "Amit Joshi",   pts: 310, change: "+10", medal: "4",  bar: "60%"  },
    { rank: 5, name: "Kavya R.",     pts: 260, change: "+10", medal: "5",  bar: "50%"  },
  ];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Gamification" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Gamification</h2>
            <p className="text-xs text-muted-foreground">Live engagement — TechSummit India 2025</p>
          </div>
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary">
              <Zap className="h-3 w-3" /> Engagement Score: 82/100
            </motion.div>
          )}
        </motion.div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          {/* Leaderboard */}
          <div className="col-span-2">
            <motion.div {...slideUp(0.2)} className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2">
                <span className="text-xs font-semibold text-foreground">Live Leaderboard</span>
                <span className="text-[9px] text-emerald-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>
              <div className="p-3 space-y-2">
                {leaderboard.map((r, i) => (
                  <motion.div
                    key={r.name}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.1 } }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-base w-6 text-center flex-shrink-0">{r.medal}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{r.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {step >= 2 && (
                            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                              className="text-[9px] text-emerald-600 font-semibold">{r.change}</motion.span>
                          )}
                          <span className="text-[10px] font-bold text-primary">{r.pts} pts</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: r.bar }}
                          transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Points award */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl border border-border/60 bg-card p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">Award Points</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">
                      Priya Nair — Session Check-In
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                      +50 pts
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground cursor-pointer"
                    >
                      Award
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Badges & Rewards */}
          <div className="space-y-3">
            {/* Badges */}
            <motion.div {...slideLeft(0.25)} className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Badges</p>
              <div className="space-y-1.5">
                {[
                  { name: "Early Bird",    icon: "🐦", pts: 50,  earned: step >= 1 },
                  { name: "Session Pro",   icon: "🎯", pts: 100, earned: step >= 2 },
                  { name: "Networker",     icon: "🤝", pts: 75,  earned: step >= 3 },
                  { name: "Top Scorer",    icon: "🏆", pts: 200, earned: step >= 4 },
                ].map((b, i) => (
                  <motion.div key={b.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.1 } }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                      b.earned ? "bg-amber-50 border border-amber-200" : "bg-muted/30"
                    }`}
                  >
                    <span className="text-sm">{b.icon}</span>
                    <span className={`flex-1 text-[10px] font-medium ${b.earned ? "text-amber-800" : "text-muted-foreground"}`}>{b.name}</span>
                    <span className={`text-[9px] font-semibold ${b.earned ? "text-amber-600" : "text-muted-foreground"}`}>{b.pts}pts</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Rewards */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">Rewards</p>
                  {[
                    { name: "Coffee Voucher", pts: 200, left: 14 },
                    { name: "Event T-Shirt",  pts: 500, left: 6  },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-2 mb-1.5">
                      <Gift className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                      <span className="flex-1 text-[10px] text-foreground">{r.name}</span>
                      <span className="text-[9px] text-primary font-medium">{r.pts} pts</span>
                      <span className="text-[8px] text-muted-foreground">{r.left} left</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Float notification */}
            <AnimatePresence>
              {step >= 5 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center"
                >
                  <p className="text-[10px] font-semibold text-blue-800">🎉 New badge unlocked!</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Top Scorer — Priya Nair</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Certificates ─────────────────────────────────────────────────── */

function SceneCertificates() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 5500),
      setTimeout(() => setStep(4), 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Certificates" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)}>
          <h2 className="text-xl font-bold text-foreground">Certificates</h2>
          <p className="text-xs text-muted-foreground">Issue branded certificates to attendees</p>
        </motion.div>

        <div className="mt-4 flex gap-4">
          {/* Template selector */}
          <div className="flex-1 space-y-3">
            <motion.div {...slideUp(0.2)} className="rounded-xl border border-border/60 bg-card p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Choose Template</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Professional Blue", active: true },
                  { name: "Minimal Dark",      active: false },
                ].map((t, i) => (
                  <div key={t.name} className={`rounded-lg border-2 p-3 cursor-pointer ${
                    t.active ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}>
                    <div className={`rounded mb-2 h-14 ${t.active ? "bg-gradient-to-br from-blue-100 to-teal-100" : "bg-muted"}`} />
                    <p className="text-[10px] font-medium text-foreground text-center">{t.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Eligible attendees */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Eligible Attendees</p>
                    <span className="text-[10px] font-bold text-primary">847 checked-in</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: "Priya Nair",   reg: "TEC-001", issued: step >= 3 },
                      { name: "Rahul Mehta",  reg: "TEC-002", issued: step >= 3 },
                      { name: "Sneha Kapoor", reg: "TEC-003", issued: step >= 3 },
                    ].map((a, i) => (
                      <motion.div key={a.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.1 } }}
                        className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5"
                      >
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="flex-1 text-[10px] font-medium text-foreground">{a.name}</span>
                        <span className="text-[9px] text-muted-foreground">{a.reg}</span>
                        {a.issued && (
                          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-[8px] bg-emerald-100 text-emerald-700 font-medium px-1.5 py-0.5 rounded">
                            Issued
                          </motion.span>
                        )}
                      </motion.div>
                    ))}
                    <div className="text-[9px] text-muted-foreground px-3">+ 844 more...</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk issue button */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">Bulk Issue to All Checked-In</p>
                    <p className="text-[10px] text-muted-foreground">847 certificates will be generated</p>
                  </div>
                  <div className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">
                    Issue All
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Certificate preview */}
          <motion.div {...slideLeft(0.3)} className="w-52 shrink-0">
            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-teal-50 p-4">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Certificate of Participation</div>
                <div className="font-bold text-sm text-foreground mb-1">This certifies that</div>
                <div className="text-base font-extrabold text-primary mb-1">Priya Nair</div>
                <div className="text-[10px] text-muted-foreground mb-3">has successfully participated in</div>
                <div className="font-bold text-xs text-foreground mb-3">TechSummit India 2025</div>
                <div className="border-t border-border/40 pt-2">
                  <div className="text-[9px] text-muted-foreground">Issued Mar 16, 2025</div>
                  <div className="text-[8px] text-primary mt-0.5">Cert #TEC-001-2025</div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-emerald-800">✓ 847 certificates issued</p>
                  <p className="text-[9px] text-emerald-600 mt-0.5">Attendees notified by email</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Scene: Analytics ────────────────────────────────────────────────────── */

function SceneAnalytics() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 4000),
      setTimeout(() => setStep(3), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Analytics" />
      <div className="flex-1 overflow-hidden p-5">
        <motion.div {...slideUp(0)} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Analytics</h2>
            <p className="text-xs text-muted-foreground">TechSummit India 2025 — Post-event report</p>
          </div>
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] text-muted-foreground">
              <Download className="h-3 w-3" /> Export Excel
            </motion.div>
          )}
        </motion.div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <KpiCard label="Total Registered"  value="1,240" change="100% of target"    color="from-blue-500 to-blue-600"    icon={Users}      delay={0.1} />
          <KpiCard label="Attendance Rate"   value="68.3%" change="+8% vs last event" color="from-emerald-500 to-green-600" icon={UserCheck}  delay={0.2} />
          <KpiCard label="Avg Engagement"    value="82/100" change="Top quartile"     color="from-violet-500 to-purple-600" icon={Trophy}     delay={0.3} />
          <KpiCard label="Certificates"      value="847"   change="All issued"        color="from-amber-500 to-orange-600"  icon={Award}      delay={0.4} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <MiniBarChart />
          </div>

          {/* Session attendance */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-border/60 bg-card p-4">
                <p className="mb-3 text-xs font-semibold text-foreground">Top Sessions</p>
                <div className="space-y-2.5">
                  {[
                    { name: "AI in Products",   attendees: 320, pct: 100 },
                    { name: "Scaling Startups", attendees: 285, pct: 89  },
                    { name: "Design Systems",   attendees: 210, pct: 66  },
                    { name: "Cloud Native",     attendees: 195, pct: 61  },
                  ].map((s, i) => (
                    <motion.div key={s.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: i * 0.1 } }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-foreground font-medium truncate flex-1 mr-2">{s.name}</span>
                        <span className="text-[9px] text-muted-foreground flex-shrink-0">{s.attendees}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export row */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Attendee List",     icon: Users,     desc: "Full registration data + custom fields" },
                { label: "Check-In Report",   icon: UserCheck, desc: "Timestamps, session attendance" },
                { label: "Engagement Report", icon: Trophy,    desc: "Points, badges, leaderboard" },
              ].map((e) => (
                <motion.div key={e.label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 hover:bg-muted/30 cursor-pointer transition-colors">
                  <e.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-foreground">{e.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{e.desc}</p>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Scene: Outro ────────────────────────────────────────────────────────── */

function SceneOutro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative text-4xl font-extrabold tracking-tight text-foreground text-center"
      >
        Everything you need. One platform.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative mt-8 grid grid-cols-4 gap-3 max-w-2xl"
      >
        {[
          { icon: Calendar,  title: "Event Setup",     desc: "Create events with custom fields in minutes" },
          { icon: QrCode,    title: "QR Check-In",     desc: "Instant scanning, zero queues, live dashboard" },
          { icon: Trophy,    title: "Gamification",    desc: "Points, badges, leaderboards, rewards catalog" },
          { icon: Award,     title: "Certificates",    desc: "Bulk issue with custom templates & verify URLs" },
          { icon: BarChart3, title: "Analytics",       desc: "Real-time dashboards and Excel export" },
          { icon: Target,    title: "Networking",      desc: "1:1 meeting slots and discussion topics" },
          { icon: Share2,    title: "Content Library", desc: "Share recordings and slides post-event" },
          { icon: Shield,    title: "Secure & Reliable",desc: "Row-level security, encrypted at rest" },
        ].map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            className="relative rounded-xl border border-border/60 bg-card p-4 text-center"
          >
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <p.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{p.title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{p.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="relative mt-8 flex items-center gap-4"
      >
        <Button size="lg" className="text-base px-8 shadow-xl shadow-primary/25" asChild>
          <Link to="/register">
            Start Free — 2 Events <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IndianRupee className="h-4 w-4" />
          <span>₹199/user/month after trial</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Demo Page ───────────────────────────────────────────────────────── */

export default function Demo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const currentScene = SCENES[sceneIndex];

  // Auto-advance scenes
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) {
        setSceneIndex((i) => i + 1);
      } else {
        setPlaying(false);
      }
    }, currentScene.duration);
    return () => clearTimeout(timer);
  }, [sceneIndex, playing, currentScene.duration]);

  // Progress ticker
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => { setElapsed((e) => e + 100); }, 100);
    return () => clearInterval(interval);
  }, [playing]);

  // Reset elapsed on scene change
  useEffect(() => { setElapsed(0); }, [sceneIndex]);

  const totalElapsed = SCENES.slice(0, sceneIndex).reduce((s, sc) => s + sc.duration, 0) + elapsed;
  const progress = Math.min((totalElapsed / TOTAL) * 100, 100);

  const restart = useCallback(() => {
    setSceneIndex(0);
    setElapsed(0);
    setPlaying(true);
  }, []);

  const renderScene = () => {
    switch (currentScene.id) {
      case "intro":         return <SceneIntro />;
      case "dashboard":     return <SceneDashboard />;
      case "event-setup":   return <SceneEventSetup />;
      case "checkin":       return <SceneCheckIn />;
      case "gamification":  return <SceneGamification />;
      case "certificates":  return <SceneCertificates />;
      case "analytics":     return <SceneAnalytics />;
      case "outro":         return <SceneOutro />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-2">
        <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Event-Sync Demo</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Scene pills */}
          <div className="mr-4 hidden items-center gap-1 sm:flex">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setSceneIndex(i); setElapsed(0); setPlaying(true); }}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  i === sceneIndex
                    ? "bg-primary text-primary-foreground"
                    : i < sceneIndex
                    ? "bg-white/20 text-white/60"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPlaying(!playing)}
            className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={restart}
            className="rounded-lg bg-white/10 p-1.5 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Scene viewport */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div key={currentScene.id} className="h-full">
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
