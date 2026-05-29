import { ReactNode, useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  LogOut,
  Menu,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import logoColor from '@/assets/logo-color.png';

interface PlatformLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Command Center', href: '/platform', icon: LayoutDashboard },
  { name: 'All Events', href: '/admin/events', icon: Calendar },
  { name: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
  { name: 'Users', href: '/admin/settings', icon: Users },
];

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, isPlatformAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isPlatformAdmin) return <Navigate to="/" replace />;

  const isActive = (href: string) => {
    if (href === '/platform') return location.pathname === '/platform';
    return location.pathname.startsWith(href);
  };

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase()
    || user?.email?.[0].toUpperCase() || 'P';

  const NavLinks = () => (
    <>
      {navigation.map(item => (
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
    </>
  );

  const UserProfile = () => (
    <div className="px-3 mt-auto pt-4 border-t">
      <div className="flex items-center gap-3 p-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile?.full_name || 'Platform Admin'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Button variant="ghost" className="w-full justify-start mt-2" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </Button>
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card pt-5 pb-4">
      <div className="px-4 mb-6">
        <Link to="/" className="flex items-center mb-3">
          <img src={logoColor} alt="Event-Sync" className="h-8 w-auto" />
        </Link>
        <Badge variant="secondary" className="gap-1 text-xs">
          <Shield className="h-3 w-3" />
          Platform Admin
        </Badge>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        <NavLinks />
      </nav>
      <UserProfile />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-x-4 bg-card border-b px-4 py-3 shadow-sm">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="Event-Sync" className="h-6 w-auto" />
          <Badge variant="secondary" className="gap-1 text-xs">
            <Shield className="h-3 w-3" />
            Platform
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-8 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
