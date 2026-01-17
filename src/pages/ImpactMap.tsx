import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import { PartChange, Dependency, Task, AppRole } from '@/lib/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/dependency-rules';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Box, 
  Wrench, 
  Factory, 
  ClipboardCheck, 
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface DependencyWithTask extends Dependency {
  task?: Task;
}

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  engineer: <Box className="w-6 h-6" />,
  maintenance: <Wrench className="w-6 h-6" />,
  manufacturing: <Factory className="w-6 h-6" />,
  quality: <ClipboardCheck className="w-6 h-6" />,
  safety: <Shield className="w-6 h-6" />,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  in_progress: <AlertCircle className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  no_change_needed: <CheckCircle2 className="w-4 h-4" />,
  blocked: <XCircle className="w-4 h-4" />,
};

export default function ImpactMap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [changes, setChanges] = useState<PartChange[]>([]);
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(searchParams.get('change'));
  const [dependencies, setDependencies] = useState<DependencyWithTask[]>([]);
  const [selectedChange, setSelectedChange] = useState<PartChange | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChanges();
  }, []);

  useEffect(() => {
    if (selectedChangeId) {
      fetchDependencies(selectedChangeId);
    }
  }, [selectedChangeId]);

  async function fetchChanges() {
    const { data } = await supabase
      .from('part_changes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setChanges(data as PartChange[]);
      if (data.length > 0 && !selectedChangeId) {
        setSelectedChangeId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function fetchDependencies(changeId: string) {
    // Fetch change details
    const { data: changeData } = await supabase
      .from('part_changes')
      .select('*')
      .eq('id', changeId)
      .single();

    if (changeData) {
      setSelectedChange(changeData as PartChange);
    }

    // Fetch dependencies with tasks
    const { data: depsData } = await supabase
      .from('dependencies')
      .select('*')
      .eq('part_change_id', changeId);

    if (depsData) {
      const depsWithTasks = await Promise.all(
        depsData.map(async (dep) => {
          const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('dependency_id', dep.id)
            .single();
          return { ...dep, task: taskData } as DependencyWithTask;
        })
      );
      setDependencies(depsWithTasks);
    }
  }

  // Group dependencies by role
  const depsByRole = dependencies.reduce((acc, dep) => {
    if (!acc[dep.owner_role]) {
      acc[dep.owner_role] = [];
    }
    acc[dep.owner_role].push(dep);
    return acc;
  }, {} as Record<AppRole, DependencyWithTask[]>);

  const roles = Object.keys(depsByRole) as AppRole[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'no_change_needed':
        return 'bg-success text-success-foreground border-success';
      case 'in_progress':
        return 'bg-info text-info-foreground border-info';
      case 'pending':
        return 'bg-warning text-warning-foreground border-warning';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getNodeStatus = (deps: DependencyWithTask[]) => {
    const statuses = deps.map(d => d.task?.status || 'pending');
    if (statuses.every(s => s === 'completed' || s === 'no_change_needed')) return 'completed';
    if (statuses.some(s => s === 'in_progress')) return 'in_progress';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Change Impact Map</h1>
            <p className="text-muted-foreground mt-1">Visual overview of change dependencies</p>
          </div>
          <div className="w-full lg:w-80">
            <Select value={selectedChangeId || ''} onValueChange={setSelectedChangeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a change..." />
              </SelectTrigger>
              <SelectContent>
                {changes.map((change) => (
                  <SelectItem key={change.id} value={change.id}>
                    {change.part_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {changes.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Changes Yet</h3>
              <p className="text-muted-foreground mb-4">Create a part change to see its impact map</p>
              <Link to="/change/new">
                <Button>Create Part Change</Button>
              </Link>
            </CardContent>
          </Card>
        ) : selectedChange && (
          <>
            {/* Hub and Spoke Visualization */}
            <Card className="border-2 overflow-hidden">
              <CardContent className="p-8 lg:p-12">
                <div className="relative min-h-[500px] flex items-center justify-center">
                  {/* Center Hub - Part Change */}
                  <div className="absolute z-10">
                    <Link to={`/change/${selectedChange.id}`}>
                      <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-primary flex flex-col items-center justify-center text-primary-foreground shadow-lg hover:scale-105 transition-transform cursor-pointer">
                        <Box className="w-8 h-8 lg:w-10 lg:h-10 mb-2" />
                        <span className="text-xs lg:text-sm font-semibold text-center px-2 line-clamp-2">
                          {selectedChange.part_name}
                        </span>
                        <StatusBadge status={selectedChange.status} className="mt-2 scale-90" />
                      </div>
                    </Link>
                  </div>

                  {/* Spokes - Role Nodes */}
                  {roles.map((role, index) => {
                    const angle = (index * 360) / roles.length - 90; // Start from top
                    const radius = 180; // Distance from center
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    const deps = depsByRole[role];
                    const nodeStatus = getNodeStatus(deps);
                    const colors = ROLE_COLORS[role];

                    return (
                      <div
                        key={role}
                        className="absolute"
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                        }}
                      >
                        {/* Connection Line */}
                        <svg
                          className="absolute pointer-events-none"
                          style={{
                            width: radius,
                            height: 4,
                            left: x < 0 ? 0 : -radius + 64,
                            top: '50%',
                            transform: `rotate(${angle}deg)`,
                            transformOrigin: x < 0 ? 'right center' : 'left center',
                          }}
                        >
                          <line
                            x1="0"
                            y1="2"
                            x2={radius - 64}
                            y2="2"
                            className={cn(
                              'stroke-2',
                              nodeStatus === 'completed' ? 'stroke-success' :
                              nodeStatus === 'in_progress' ? 'stroke-info' : 'stroke-warning'
                            )}
                            strokeDasharray={nodeStatus === 'pending' ? '8,4' : 'none'}
                          />
                        </svg>

                        {/* Role Node */}
                        <div
                          className={cn(
                            'w-24 h-24 lg:w-28 lg:h-28 rounded-2xl flex flex-col items-center justify-center border-2 shadow-md transition-all hover:scale-105 cursor-pointer',
                            colors.bg,
                            colors.border
                          )}
                          onClick={() => {
                            // Navigate to first task of this role
                            const firstTask = deps[0]?.task;
                            if (firstTask) {
                              navigate(`/tasks/${firstTask.id}`);
                            }
                          }}
                        >
                          <div className={cn('mb-1', colors.text)}>
                            {ROLE_ICONS[role]}
                          </div>
                          <span className={cn('text-xs font-semibold', colors.text)}>
                            {ROLE_LABELS[role]}
                          </span>
                          <div className={cn(
                            'flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(nodeStatus)
                          )}>
                            {STATUS_ICONS[nodeStatus]}
                            <span>{deps.filter(d => d.task?.status === 'completed' || d.task?.status === 'no_change_needed').length}/{deps.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Legend and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Legend */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-success" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-info" />
                    <span className="text-sm">In Progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-warning" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-destructive" />
                    <span className="text-sm">Blocked</span>
                  </div>
                </CardContent>
              </Card>

              {/* Task List */}
              <Card className="border-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle>All Tasks</CardTitle>
                  <CardDescription>Click on a task to view details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dependencies.map((dep) => (
                      <Link
                        key={dep.id}
                        to={dep.task ? `/tasks/${dep.task.id}` : '#'}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          ROLE_COLORS[dep.owner_role].bg
                        )}>
                          <span className={ROLE_COLORS[dep.owner_role].text}>
                            {ROLE_ICONS[dep.owner_role]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{dep.affected_area}</p>
                          <p className="text-sm text-muted-foreground truncate">{dep.reason}</p>
                        </div>
                        <StatusBadge status={dep.task?.status || 'pending'} />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  }
