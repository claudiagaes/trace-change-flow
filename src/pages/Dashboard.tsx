import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  FileText,
  Wrench,
  Shield,
  Factory
} from 'lucide-react';

// Demo data
const DEMO_CHANGES = [
  { id: '1', part_name: 'Front Brake Caliper Assembly', description: 'Material change from aluminum to steel alloy', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', part_name: 'Engine Mount Bracket', description: 'Geometry update for new engine variant', status: 'pending_review', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', part_name: 'Door Handle Mechanism', description: 'Surface finish specification change', status: 'draft', created_at: new Date(Date.now() - 259200000).toISOString() },
];

const DEMO_TASKS = [
  { id: '1', document_type: 'Work Instructions', part_name: 'Front Brake Caliper Assembly', status: 'pending' },
  { id: '2', document_type: 'Quality Control Plan', part_name: 'Front Brake Caliper Assembly', status: 'in_progress' },
  { id: '3', document_type: 'Safety Data Sheet', part_name: 'Engine Mount Bracket', status: 'pending' },
];

export default function Dashboard() {
  const stats = {
    activeChanges: 7,
    pendingTasks: 12,
    completedToday: 3,
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ECN Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Engineering Change Notice Management System
          </p>
        </div>
        <Link to="/change/new">
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            New ECN
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeChanges}</p>
                <p className="text-sm text-muted-foreground">Active ECNs</p>
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
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Total ECNs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/change/new" className="block">
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold">Create ECN</p>
              <p className="text-xs text-muted-foreground mt-1">Start new change</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tasks" className="block">
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                <Wrench className="w-6 h-6 text-warning" />
              </div>
              <p className="font-semibold">My Tasks</p>
              <p className="text-xs text-muted-foreground mt-1">Review pending</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/impact-map" className="block">
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-info" />
              </div>
              <p className="font-semibold">Impact Map</p>
              <p className="text-xs text-muted-foreground mt-1">View dependencies</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/history" className="block">
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                <Factory className="w-6 h-6 text-success" />
              </div>
              <p className="font-semibold">History</p>
              <p className="text-xs text-muted-foreground mt-1">Past changes</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Pending Tasks
              </CardTitle>
              <CardDescription>Tasks requiring your review</CardDescription>
            </div>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_TASKS.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="block p-4 rounded-lg border-2 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {task.document_type}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.part_name}
                      </p>
                    </div>
                    <StatusBadge status={task.status as any} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Changes */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent ECNs
              </CardTitle>
              <CardDescription>Latest engineering change notices</CardDescription>
            </div>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_CHANGES.map((change) => (
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
                    </div>
                    <StatusBadge status={change.status as any} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
