import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RoleBadge } from '@/components/ui/role-badge';
import { supabase } from '@/integrations/supabase/client';
import { ChangeClassification, DependencyConfig, FileType } from '@/lib/types';
import { getTriggeredDependencies, ROLE_LABELS } from '@/lib/dependency-rules';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  FileImage, 
  FileText,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Part Info', description: 'Basic change details' },
  { id: 2, title: 'Upload Files', description: 'Old vs new comparison' },
  { id: 3, title: 'Classification', description: 'What changed?' },
  { id: 4, title: 'Dependencies', description: 'Review impact' },
  { id: 5, title: 'Confirm', description: 'Submit change' },
];

const CLASSIFICATION_OPTIONS: { key: keyof ChangeClassification; label: string; description: string }[] = [
  { key: 'geometry_changed', label: 'Geometry / Dimensions', description: 'Physical shape or size changed' },
  { key: 'material_changed', label: 'Material', description: 'Different material specification' },
  { key: 'tolerances_changed', label: 'Tolerances', description: 'Tolerance requirements changed' },
  { key: 'weight_changed', label: 'Weight', description: 'Part weight is different' },
  { key: 'surface_finish_changed', label: 'Surface Finish', description: 'Surface treatment changed' },
  { key: 'supplier_changed', label: 'Supplier', description: 'Different supplier for part' },
  { key: 'process_changed', label: 'Process Assumption', description: 'Manufacturing process changed' },
];

export default function NewChange() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [partName, setPartName] = useState('');
  const [partId, setPartId] = useState('');
  const [description, setDescription] = useState('');
  const [oldPartFile, setOldPartFile] = useState<File | null>(null);
  const [newPartFile, setNewPartFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [classification, setClassification] = useState<ChangeClassification>({
    geometry_changed: false,
    material_changed: false,
    tolerances_changed: false,
    weight_changed: false,
    surface_finish_changed: false,
    supplier_changed: false,
    process_changed: false,
  });

  const triggeredDependencies = getTriggeredDependencies(classification);
  const hasAnyClassification = Object.values(classification).some(v => v);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return partName.trim() && description.trim();
      case 2:
        return true; // Files are optional
      case 3:
        return hasAnyClassification;
      case 4:
        return triggeredDependencies.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'old' | 'new' | 'doc') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'old') {
      setOldPartFile(files[0]);
    } else if (type === 'new') {
      setNewPartFile(files[0]);
    } else {
      setDocumentFiles([...documentFiles, ...Array.from(files)]);
    }
  };

  const removeFile = (type: 'old' | 'new' | 'doc', index?: number) => {
    if (type === 'old') setOldPartFile(null);
    else if (type === 'new') setNewPartFile(null);
    else if (index !== undefined) {
      setDocumentFiles(documentFiles.filter((_, i) => i !== index));
    }
  };

  const uploadFile = async (file: File, partChangeId: string, fileType: FileType) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.id}/${partChangeId}/${fileType}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('part-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('part_change_files')
      .insert({
        part_change_id: partChangeId,
        file_path: filePath,
        file_name: file.name,
        file_type: fileType,
        uploaded_by: user?.id,
      });

    if (dbError) throw dbError;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // 1. Create part change
      const { data: changeData, error: changeError } = await supabase
        .from('part_changes')
        .insert({
          created_by: user.id,
          part_name: partName,
          part_id: partId || null,
          description,
          status: 'in_progress',
          ...classification,
        })
        .select()
        .single();

      if (changeError) throw changeError;

      const partChangeId = changeData.id;

      // 2. Upload files
      if (oldPartFile) {
        await uploadFile(oldPartFile, partChangeId, 'old_part');
      }
      if (newPartFile) {
        await uploadFile(newPartFile, partChangeId, 'new_part');
      }
      for (const docFile of documentFiles) {
        await uploadFile(docFile, partChangeId, 'document');
      }

      // 3. Create dependencies and tasks
      for (const dep of triggeredDependencies) {
        // Find a user with the matching role
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', dep.ownerRole)
          .limit(1);

        const assignedTo = roleUsers?.[0]?.user_id || null;

        // Create dependency
        const { data: depData, error: depError } = await supabase
          .from('dependencies')
          .insert({
            part_change_id: partChangeId,
            document_type: dep.documentType,
            affected_area: dep.affectedArea,
            owner_role: dep.ownerRole,
            reason: dep.reason,
          })
          .select()
          .single();

        if (depError) throw depError;

        // Create task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .insert({
            dependency_id: depData.id,
            assigned_to: assignedTo,
            status: 'pending',
          })
          .select()
          .single();

        if (taskError) throw taskError;

        // Create notification for assigned user
        if (assignedTo) {
          await supabase
            .from('notifications')
            .insert({
              recipient_id: assignedTo,
              title: 'New Task Assigned',
              message: `Review ${dep.affectedArea} for part change: ${partName}`,
              type: 'task_assigned',
              related_task_id: taskData.id,
              related_change_id: partChangeId,
            });
        }
      }

      toast.success('Part change created successfully!');
      navigate(`/change/${partChangeId}`);
    } catch (error) {
      console.error('Error creating change:', error);
      toast.error('Failed to create part change');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">New Part Change</h1>
          <p className="text-muted-foreground mt-1">Track what changed and who needs to know</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors',
                      currentStep > step.id
                        ? 'bg-success text-success-foreground border-success'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className="text-xs mt-2 font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-1 w-8 sm:w-16 lg:w-24 mx-2',
                      currentStep > step.id ? 'bg-success' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Part Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="partName">Part Name *</Label>
                  <Input
                    id="partName"
                    placeholder="e.g., Front Bumper Assembly"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partId">Part ID / Number (optional)</Label>
                  <Input
                    id="partId"
                    placeholder="e.g., FB-2024-001"
                    value={partId}
                    onChange={(e) => setPartId(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Change Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what changed and why..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* Step 2: Upload Files */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Old Part */}
                <div className="space-y-3">
                  <Label>Old Part Image/Drawing</Label>
                  {oldPartFile ? (
                    <div className="flex items-center gap-3 p-4 border-2 rounded-lg bg-muted/50">
                      <FileImage className="w-8 h-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{oldPartFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(oldPartFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile('old')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.step,.stp,.stl"
                        onChange={(e) => handleFileUpload(e, 'old')}
                      />
                    </label>
                  )}
                </div>

                {/* New Part */}
                <div className="space-y-3">
                  <Label>New Part Image/Drawing</Label>
                  {newPartFile ? (
                    <div className="flex items-center gap-3 p-4 border-2 rounded-lg bg-muted/50">
                      <FileImage className="w-8 h-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{newPartFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(newPartFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile('new')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.step,.stp,.stl"
                        onChange={(e) => handleFileUpload(e, 'new')}
                      />
                    </label>
                  )}
                </div>

                {/* Additional Documents */}
                <div className="md:col-span-2 space-y-3">
                  <Label>Additional Documents (optional)</Label>
                  <div className="space-y-2">
                    {documentFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <span className="flex-1 truncate text-sm">{file.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFile('doc', index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Add documents</span>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'doc')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Classification */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Important:</strong> Select all applicable changes. This determines who needs to review what.
                  </p>
                </div>
                <div className="grid gap-3">
                  {CLASSIFICATION_OPTIONS.map((option) => (
                    <label
                      key={option.key}
                      className={cn(
                        'flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                        classification[option.key]
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={classification[option.key]}
                        onCheckedChange={(checked) =>
                          setClassification({ ...classification, [option.key]: !!checked })
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Dependencies */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Based on your selections, the following documents and teams will need to review this change:
                </p>
                <div className="grid gap-3">
                  {triggeredDependencies.map((dep, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border-2 rounded-lg bg-card"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{dep.affectedArea}</p>
                          <RoleBadge role={dep.ownerRole} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{dep.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {triggeredDependencies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No dependencies detected. Go back and select what changed.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Confirm */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Part Name</p>
                    <p className="font-medium">{partName}</p>
                  </div>
                  {partId && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Part ID</p>
                      <p className="font-medium font-mono">{partId}</p>
                    </div>
                  )}
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{description}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">What Changed</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CLASSIFICATION_OPTIONS.filter((opt) => classification[opt.key]).map((opt) => (
                        <span
                          key={opt.key}
                          className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-md font-medium"
                        >
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Tasks to be created: {triggeredDependencies.length}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.from(new Set(triggeredDependencies.map((d) => d.ownerRole))).map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep < 5 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Change
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
