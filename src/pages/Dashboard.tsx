import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { supabase } from '@/integrations/supabase/client';
import { PartChange, Task } from '@/lib/types';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user, profile, role } = useAuth();
  const [recentChanges, setRecentChanges] = useState<PartChange[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    activeChanges: 0,
    pendingTasks: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch recent part changes
      const { data: changesData } = await supabase
        .from('part_changes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (changesData) {
        setRecentChanges(changesData as PartChange[]);
      }

      // Fetch my tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          dependency:dependencies(
            *,
            part_change:part_changes(*)
          )
        `)
        .eq('assigned_to', user?.id)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasksData) {
        setMyTasks(tasksData as unknown as Task[]);
      }

      // Fetch stats
      const { count: activeCount } = await supabase
        .from('part_changes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['draft', 'in_progress', 'pending_review']);

      const { count: pendingCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .eq('status', 'pending');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      setStats({
        activeChanges: activeCount || 0,
        pendingTasks: pendingCount || 0,
        completedToday: completedCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const isEngineer = role === 'engineer';

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your part changes
            </p>
          </div>
          {isEngineer && (
            <Link to="/change/new">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                New Part Change
              </Button>
            </Link>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeChanges}</p>
                  <p className="text-sm text-muted-foreground">Active Changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Tasks */}
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    My Tasks
                  </CardTitle>
                  <CardDescription>Tasks assigned to you</CardDescription>
                </div>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {myTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/tasks/${task.id}`}
                        className="block p-4 rounded-lg border-2 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {(task.dependency as any)?.document_type?.replace(/_/g, ' ') || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {(task.dependency as any)?.part_change?.part_name || 'Unknown Part'}
                            </p>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Changes */}
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Changes
                  </CardTitle>
                  <CardDescription>Latest part change requests</CardDescription>
                </div>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentChanges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No changes yet</p>
                    {isEngineer && (
                      <Link to="/change/new">
                        <Button variant="link" className="mt-2">
                          Create your first change
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentChanges.map((change) => (
                      <Link
                        key={change.id}
                        to={`/change/${change.id}`}
                        className="block p-4 rounded-lg border-2 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{change.part_name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {change.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <StatusBadge status={change.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
