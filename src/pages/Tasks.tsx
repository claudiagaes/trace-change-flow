import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import { Task, Dependency, PartChange } from '@/lib/types';
import { Loader2, ClipboardList, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskWithDetails extends Task {
  dependency?: Dependency & {
    part_change?: PartChange;
  };
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false });

      if (tasksData) {
        // Fetch dependency and change details for each task
        const tasksWithDetails = await Promise.all(
          tasksData.map(async (task) => {
            const { data: depData } = await supabase
              .from('dependencies')
              .select('*')
              .eq('id', task.dependency_id)
              .single();

            let partChange = null;
            if (depData) {
              const { data: changeData } = await supabase
                .from('part_changes')
                .select('*')
                .eq('id', depData.part_change_id)
                .single();
              partChange = changeData;
            }

            return {
              ...task,
              dependency: depData ? { ...depData, part_change: partChange } : undefined,
            } as TaskWithDetails;
          })
        );
        setTasks(tasksWithDetails);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'no_change_needed');

  const TaskList = ({ taskList, emptyMessage }: { taskList: TaskWithDetails[]; emptyMessage: string }) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map((task) => (
          <Link
            key={task.id}
            to={`/tasks/${task.id}`}
            className="block p-4 border-2 rounded-lg hover:border-primary/50 transition-colors bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold truncate">
                    {task.dependency?.affected_area || 'Unknown Area'}
                  </p>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  Part: {task.dependency?.part_change?.part_name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {task.dependency?.reason}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">Review and complete your assigned tasks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-warning">{pendingTasks.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-info">{inProgressTasks.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{completedTasks.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Tabs */}
        <Card className="border-2">
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({pendingTasks.length})
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="gap-2">
                  In Progress ({inProgressTasks.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="pending" className="mt-0">
                <TaskList taskList={pendingTasks} emptyMessage="No pending tasks" />
              </TabsContent>
              <TabsContent value="in_progress" className="mt-0">
                <TaskList taskList={inProgressTasks} emptyMessage="No tasks in progress" />
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                <TaskList taskList={completedTasks} emptyMessage="No completed tasks" />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
}
