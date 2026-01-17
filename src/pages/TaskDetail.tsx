import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { supabase } from '@/integrations/supabase/client';
import { Task, Dependency, PartChange, PartChangeFile } from '@/lib/types';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Upload,
  FileImage,
  FileText,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [dependency, setDependency] = useState<Dependency | null>(null);
  const [partChange, setPartChange] = useState<PartChange | null>(null);
  const [files, setFiles] = useState<PartChangeFile[]>([]);
  const [comments, setComments] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskDetails();
    }
  }, [id]);

  async function fetchTaskDetails() {
    setLoading(true);
    try {
      // Fetch task
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (taskData) {
        setTask(taskData as Task);
        setComments(taskData.comments || '');

        // Fetch dependency
        const { data: depData } = await supabase
          .from('dependencies')
          .select('*')
          .eq('id', taskData.dependency_id)
          .single();

        if (depData) {
          setDependency(depData as Dependency);

          // Fetch part change
          const { data: changeData } = await supabase
            .from('part_changes')
            .select('*')
            .eq('id', depData.part_change_id)
            .single();

          if (changeData) {
            setPartChange(changeData as PartChange);

            // Fetch files
            const { data: filesData } = await supabase
              .from('part_change_files')
              .select('*')
              .eq('part_change_id', changeData.id);

            if (filesData) {
              setFiles(filesData as PartChangeFile[]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleComplete = async (noChangeNeeded: boolean) => {
    if (!task || !user) return;
    setSubmitting(true);

    try {
      let updatedDocUrl = task.updated_document_url;

      // Upload file if provided
      if (uploadedFile && partChange) {
        const fileExt = uploadedFile.name.split('.').pop();
        const filePath = `${user.id}/${partChange.id}/updated-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('part-files')
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;
        updatedDocUrl = filePath;
      }

      // Update task
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: noChangeNeeded ? 'no_change_needed' : 'completed',
          comments,
          updated_document_url: updatedDocUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Create notification for change owner
      if (partChange) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: partChange.created_by,
            title: 'Task Completed',
            message: `${dependency?.affected_area} review completed for ${partChange.part_name}`,
            type: 'task_completed',
            related_task_id: task.id,
            related_change_id: partChange.id,
          });

        // Check if all tasks are complete
        const { data: allDeps } = await supabase
          .from('dependencies')
          .select('id')
          .eq('part_change_id', partChange.id);

        if (allDeps) {
          const { data: incompleteTasks } = await supabase
            .from('tasks')
            .select('id')
            .in('dependency_id', allDeps.map(d => d.id))
            .in('status', ['pending', 'in_progress']);

          // If no incomplete tasks, update change status
          if (incompleteTasks && incompleteTasks.length === 0) {
            await supabase
              .from('part_changes')
              .update({ status: 'completed' })
              .eq('id', partChange.id);

            await supabase
              .from('notifications')
              .insert({
                recipient_id: partChange.created_by,
                title: 'Change Completed',
                message: `All reviews completed for ${partChange.part_name}`,
                type: 'change_completed',
                related_change_id: partChange.id,
              });
          }
        }
      }

      toast.success(noChangeNeeded ? 'Marked as no change needed' : 'Task completed successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('part-files').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
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

  if (!task || !dependency || !partChange) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button variant="link" onClick={() => navigate('/tasks')}>
            Go back to tasks
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isCompleted = task.status === 'completed' || task.status === 'no_change_needed';

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => navigate('/tasks')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight">{dependency.affected_area}</h1>
                <StatusBadge status={task.status} />
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={dependency.owner_role} />
                <span className="text-muted-foreground">•</span>
                <Link
                  to={`/change/${partChange.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {partChange.part_name}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Box */}
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Action Required</p>
            <p className="text-sm text-muted-foreground mt-1">{dependency.reason}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Summary */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Change Summary</CardTitle>
                <CardDescription>What changed on the part</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Part</p>
                  <p className="font-medium">{partChange.part_name}</p>
                  {partChange.part_id && (
                    <p className="text-sm font-mono text-muted-foreground">{partChange.part_id}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p>{partChange.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">What Changed</p>
                  <div className="flex flex-wrap gap-2">
                    {partChange.geometry_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Geometry</span>}
                    {partChange.material_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Material</span>}
                    {partChange.tolerances_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Tolerances</span>}
                    {partChange.weight_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Weight</span>}
                    {partChange.surface_finish_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Surface Finish</span>}
                    {partChange.supplier_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Supplier</span>}
                    {partChange.process_changed && <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">Process</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Response */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Your Response</CardTitle>
                <CardDescription>
                  {isCompleted ? 'Task has been completed' : 'Review the change and provide your response'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments / Notes</Label>
                  <Textarea
                    id="comments"
                    placeholder="Add any notes about your review..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    disabled={isCompleted}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Updated Document (optional)</Label>
                  {uploadedFile ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{uploadedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        disabled={isCompleted}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors ${isCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload updated document</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isCompleted}
                      />
                    </label>
                  )}
                </div>

                {!isCompleted && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={() => handleComplete(false)}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Mark as Reviewed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleComplete(true)}
                      disabled={submitting}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      No Change Needed
                    </Button>
                  </div>
                )}

                {isCompleted && task.completed_at && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Completed on {format(new Date(task.completed_at), 'PPP')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Reference Files */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Reference Files</CardTitle>
                <CardDescription>Old vs New comparison</CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No files attached
                  </p>
                ) : (
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
                )}
              </CardContent>
            </Card>

            <Link to={`/impact-map?change=${partChange.id}`}>
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                View Impact Map
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
