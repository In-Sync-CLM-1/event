import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import NotFound from "./pages/NotFound";
import MyEvents from "./pages/MyEvents";
import MySchedule from "./pages/MySchedule";
import CertificateVerify from "./pages/CertificateVerify";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Networking from "./pages/Networking";
import ContentLibrary from "./pages/ContentLibrary";
import MeetingSpots from "./pages/MeetingSpots";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEvents from "./pages/admin/Events";
import CreateEvent from "./pages/admin/CreateEvent";
import EventEdit from "./pages/admin/EventEdit";
import AdminSessions from "./pages/admin/Sessions";
import AdminSpeakers from "./pages/admin/Speakers";
import CheckIn from "./pages/admin/CheckIn";
import AdminCertificates from "./pages/admin/Certificates";
import Gamification from "./pages/admin/Gamification";
import Content from "./pages/admin/Content";
import Engagement from "./pages/admin/Engagement";
import Analytics from "./pages/admin/Analytics";
import LandingPageAdmin from "./pages/admin/LandingPage";
import Registrations from "./pages/admin/Registrations";
import Settings from "./pages/admin/Settings";
import Billing from "./pages/admin/Billing";
import AdminMeetingSpots from "./pages/admin/MeetingSpots";
// Platform Pages
import PlatformDashboard from "./pages/platform/Dashboard";

// SDR Pages
import SDRDashboard from "./pages/sdr/Dashboard";
import SDRInvite from "./pages/sdr/Invite";
import SDRShare from "./pages/sdr/Share";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

const adminRoles = ['super_admin', 'event_manager', 'staff'] as const;
const sdrRoles = ['sales_rep', 'super_admin'] as const;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/events/:eventSlug/my-schedule" element={<MySchedule />} />
            <Route path="/events/:eventId/leaderboard" element={<Leaderboard />} />
            <Route path="/events/:eventId/rewards" element={<Rewards />} />
            <Route path="/events/:eventId/networking" element={<Networking />} />
            <Route path="/events/:eventId/content" element={<ContentLibrary />} />
            <Route path="/events/:eventId/meeting-spots" element={<MeetingSpots />} />
            <Route path="/verify/:certificateNumber" element={<CertificateVerify />} />
            
            {/* Admin routes - protected */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={[...adminRoles]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allowedRoles={[...adminRoles]}><AdminEvents /></ProtectedRoute>} />
            <Route path="/admin/events/new" element={<ProtectedRoute allowedRoles={[...adminRoles]}><CreateEvent /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId" element={<ProtectedRoute allowedRoles={[...adminRoles]}><EventEdit /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/sessions" element={<ProtectedRoute allowedRoles={[...adminRoles]}><AdminSessions /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/landing" element={<ProtectedRoute allowedRoles={[...adminRoles]}><LandingPageAdmin /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/speakers" element={<ProtectedRoute allowedRoles={[...adminRoles]}><AdminSpeakers /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/certificates" element={<ProtectedRoute allowedRoles={[...adminRoles]}><AdminCertificates /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/gamification" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Gamification /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/content" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Content /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/engagement" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Engagement /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/analytics" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Analytics /></ProtectedRoute>} />
            <Route path="/admin/events/:eventId/meeting-spots" element={<ProtectedRoute allowedRoles={[...adminRoles]}><AdminMeetingSpots /></ProtectedRoute>} />
            <Route path="/admin/check-in" element={<ProtectedRoute allowedRoles={[...adminRoles]}><CheckIn /></ProtectedRoute>} />
            <Route path="/admin/check-in/:eventId" element={<ProtectedRoute allowedRoles={[...adminRoles]}><CheckIn /></ProtectedRoute>} />
            <Route path="/admin/registrations" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Registrations /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Settings /></ProtectedRoute>} />
            <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={[...adminRoles]}><Billing /></ProtectedRoute>} />
            
            {/* Platform Admin Route */}
            <Route path="/platform" element={<PlatformDashboard />} />

            {/* SDR Routes - protected */}
            <Route path="/sdr" element={<ProtectedRoute allowedRoles={[...sdrRoles]}><SDRDashboard /></ProtectedRoute>} />
            <Route path="/sdr/dashboard" element={<ProtectedRoute allowedRoles={[...sdrRoles]}><SDRDashboard /></ProtectedRoute>} />
            <Route path="/sdr/invite" element={<ProtectedRoute allowedRoles={[...sdrRoles]}><SDRInvite /></ProtectedRoute>} />
            <Route path="/sdr/share" element={<ProtectedRoute allowedRoles={[...sdrRoles]}><SDRShare /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
