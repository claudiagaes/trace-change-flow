import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Plus, 
  ClipboardList, 
  Map, 
  History, 
  Bell, 
  LogOut,
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/dependency-rules';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface AppLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/change/new', label: 'New Change', icon: Plus },
  { path: '/tasks', label: 'My Tasks', icon: ClipboardList },
  { path: '/impact-map', label: 'Impact Map', icon: Map },
  { path: '/history', label: 'History', icon: History },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, role, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-xl font-bold text-sidebar-primary-foreground">T</span>
            </div>
            <span className="text-xl font-bold text-sidebar-foreground tracking-tight">TRACE</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path === '/change/new' && location.pathname.startsWith('/change/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              {role && (
                <Badge variant="outline" className="text-xs border-sidebar-border text-sidebar-foreground/70">
                  {ROLE_LABELS[role]}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-lg font-bold text-sidebar-primary-foreground">T</span>
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">TRACE</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-sidebar z-40">
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
