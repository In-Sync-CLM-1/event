import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  QrCode,
  Settings,
  LayoutDashboard,
  ChevronRight,
  Menu,
  LogOut,
  UserPlus,
  Share2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import logoColor from '@/assets/logo-color.png';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Registrations', href: '/admin/registrations', icon: Users },
  { name: 'Check-In', href: '/admin/check-in', icon: QrCode },
  { name: 'Billing', href: '/admin/billing', icon: Wallet },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const sdrNavigation = [
  { name: 'SDR Dashboard', href: '/sdr', icon: TrendingUp },
  { name: 'Invite Contacts', href: '/sdr/invite', icon: UserPlus },
  { name: 'Share Content', href: '/sdr/share', icon: Share2 },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'A';

  const NavLinks = () => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </Link>
      ))}
      
      {/* SDR Section */}
      <div className="mt-6 pt-4 border-t">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          SDR Tools
        </p>
        {sdrNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center px-4 mb-8">
            <img src={logoColor} alt="Event-Sync" className="h-8 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            <NavLinks />
          </nav>

          {/* User Profile */}
          <div className="px-3 mt-auto pt-4 border-t">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Admin'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start mt-2"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-x-4 bg-card border-b px-4 py-3 shadow-sm safe-area-top">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full bg-card pt-5 pb-4">
              {/* Logo */}
              <Link to="/" className="flex items-center px-4 mb-8">
                <img src={logoColor} alt="Event-Sync" className="h-8 w-auto" />
              </Link>

              {/* Navigation */}
              <nav className="flex-1 px-3 space-y-1">
                <NavLinks />
              </nav>

              {/* User Profile */}
              <div className="px-3 mt-auto pt-4 border-t">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Admin'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.full_name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start mt-2"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            Admin
          </Link>
          {location.pathname !== '/admin' && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {navigation.find((n) => isActive(n.href))?.name || 'Page'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
