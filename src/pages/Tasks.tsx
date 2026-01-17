import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { ClipboardList, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

const DEMO_TASKS = [
  { id: '1', affected_area: 'Work Instructions', part_name: 'Front Brake Caliper', reason: 'Material change requires updated assembly procedures', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', affected_area: 'Quality Control Plan', part_name: 'Front Brake Caliper', reason: 'New inspection criteria for steel alloy', status: 'in_progress', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', affected_area: 'Safety Data Sheet', part_name: 'Engine Mount Bracket', reason: 'Geometry change affects safety documentation', status: 'pending', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '4', affected_area: 'Maintenance Schedule', part_name: 'Door Handle Mechanism', reason: 'Surface finish change impacts maintenance intervals', status: 'completed', created_at: new Date(Date.now() - 345600000).toISOString() },
];

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingTasks = DEMO_TASKS.filter(t => t.status === 'pending');
  const inProgressTasks = DEMO_TASKS.filter(t => t.status === 'in_progress');
  const completedTasks = DEMO_TASKS.filter(t => t.status === 'completed');

  const TaskList = ({ taskList, emptyMessage }: { taskList: typeof DEMO_TASKS; emptyMessage: string }) => {
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
                  <p className="font-semibold truncate">{task.affected_area}</p>
                  <StatusBadge status={task.status as any} />
                </div>
                <p className="text-sm text-muted-foreground truncate">Part: {task.part_name}</p>
                <p className="text-sm text-muted-foreground mt-1">{task.reason}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" />
          My Tasks
        </h1>
        <p className="text-muted-foreground mt-1">Review and complete your assigned tasks</p>
      </div>

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
  );
}
