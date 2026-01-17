import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { supabase } from '@/integrations/supabase/client';
import { PartChange, Dependency, Task, PartChangeFile, Profile } from '@/lib/types';
import { ArrowLeft, FileImage, FileText, ExternalLink, Loader2, User, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ChangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [change, setChange] = useState<PartChange | null>(null);
  const [dependencies, setDependencies] = useState<(Dependency & { task?: Task })[]>([]);
  const [files, setFiles] = useState<PartChangeFile[]>([]);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchChangeDetails();
    }
  }, [id]);

  async function fetchChangeDetails() {
    setLoading(true);
    try {
      // Fetch change
      const { data: changeData } = await supabase
        .from('part_changes')
        .select('*')
        .eq('id', id)
        .single();

      if (changeData) {
        setChange(changeData as PartChange);

        // Fetch creator profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', changeData.created_by)
          .single();

        if (profileData) {
          setCreator(profileData as Profile);
        }
      }

      // Fetch dependencies with tasks
      const { data: depsData } = await supabase
        .from('dependencies')
        .select('*')
        .eq('part_change_id', id);

      if (depsData) {
        const depsWithTasks = await Promise.all(
          depsData.map(async (dep) => {
            const { data: taskData } = await supabase
              .from('tasks')
              .select('*')
              .eq('dependency_id', dep.id)
              .single();
            return { ...dep, task: taskData } as Dependency & { task?: Task };
          })
        );
        setDependencies(depsWithTasks);
      }

      // Fetch files
      const { data: filesData } = await supabase
        .from('part_change_files')
        .select('*')
        .eq('part_change_id', id);

      if (filesData) {
        setFiles(filesData as PartChangeFile[]);
      }
    } catch (error) {
      console.error('Error fetching change details:', error);
    } finally {
      setLoading(false);
    }
  }

  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('part-files').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const completedTasks = dependencies.filter(d => d.task?.status === 'completed' || d.task?.status === 'no_change_needed').length;
  const totalTasks = dependencies.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!change) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 text-center">
          <p className="text-muted-foreground">Change not found</p>
          <Button variant="link" onClick={() => navigate('/dashboard')}>
            Go back to dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{change.part_name}</h1>
                <StatusBadge status={change.status} />
              </div>
              {change.part_id && (
                <p className="text-muted-foreground font-mono">{change.part_id}</p>
              )}
            </div>
            <Link to={`/impact-map?change=${change.id}`}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                View Impact Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completedTasks} of {totalTasks} tasks complete</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{change.description}</p>
              </CardContent>
            </Card>

            {/* What Changed */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>What Changed</CardTitle>
                <CardDescription>Classification of this part change</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {change.geometry_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Geometry</span>}
                  {change.material_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Material</span>}
                  {change.tolerances_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Tolerances</span>}
                  {change.weight_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Weight</span>}
                  {change.surface_finish_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Surface Finish</span>}
                  {change.supplier_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Supplier</span>}
                  {change.process_changed && <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">Process</span>}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Impacted Areas & Tasks</CardTitle>
                <CardDescription>Teams responsible for reviewing this change</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium">{dep.affected_area}</p>
                          <RoleBadge role={dep.owner_role} />
                        </div>
                        <p className="text-sm text-muted-foreground">{dep.reason}</p>
                      </div>
                      <StatusBadge status={dep.task?.status || 'pending'} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meta Info */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <p className="font-medium">{creator?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(change.created_at), 'PPP')}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Files */}
            {files.length > 0 && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => getFileUrl(file.file_path)}
                        className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {file.file_type === 'document' ? (
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <FileImage className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {file.file_type.replace('_', ' ')}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
