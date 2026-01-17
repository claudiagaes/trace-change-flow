import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RoleBadge } from '@/components/ui/role-badge';
import { ChangeClassification } from '@/lib/types';
import { getTriggeredDependencies, CLASSIFICATION_OPTIONS } from '@/lib/dependency-rules';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  FileText,
  AlertTriangle,
  Loader2,
  Sparkles,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Upload Drawings', description: 'Before & after PDF drawings' },
  { id: 2, title: 'AI Analysis', description: 'Detect changes automatically' },
  { id: 3, title: 'Review Changes', description: 'Confirm detected changes' },
  { id: 4, title: 'Task Assignment', description: 'Who needs to review?' },
  { id: 5, title: 'Submit ECN', description: 'Finalize and create' },
];

interface DetectedChange {
  type: string;
  description: string;
  confidence: number;
}

export default function NewChange() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [partName, setPartName] = useState('');
  const [partId, setPartId] = useState('');
  const [description, setDescription] = useState('');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  
  // AI Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const [aiSummary, setAiSummary] = useState('');
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
        return beforeFile && afterFile && partName.trim();
      case 2:
        return !analyzing && hasAnyClassification;
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview for images/PDFs
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'before') {
        setBeforeFile(file);
        setBeforePreview(result);
      } else {
        setAfterFile(file);
        setAfterPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeFile(null);
      setBeforePreview(null);
    } else {
      setAfterFile(null);
      setAfterPreview(null);
    }
  };

  const analyzeChanges = async () => {
    if (!beforePreview || !afterPreview) {
      toast.error('Please upload both before and after drawings');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-cad-changes', {
        body: {
          beforeImage: beforePreview,
          afterImage: afterPreview,
        },
      });

      if (error) throw error;

      setDetectedChanges(data.changes || []);
      setAiSummary(data.summary || '');
      setClassification(data.classification || classification);
      
      toast.success('Analysis complete! Review the detected changes.');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze drawings. Please try again or classify manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    toast.success('ECN created successfully!');
    navigate('/dashboard');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.5) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Steps */}
      <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col shrink-0">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-bold tracking-tight">New ECN</h1>
          <p className="text-xs text-muted-foreground mt-1">Engineering Change Notice</p>
        </div>

        <nav className="space-y-1 flex-1">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                // Only allow going back or to completed steps
                if (step.id < currentStep) setCurrentStep(step.id);
              }}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.id
                  ? 'bg-success/10 text-success hover:bg-success/20 cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2',
                  currentStep === step.id
                    ? 'bg-primary-foreground text-primary border-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-success text-success-foreground border-success'
                    : 'bg-muted border-border'
                )}
              >
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{step.title}</p>
                <p className={cn(
                  'text-xs truncate',
                  currentStep === step.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}>
                  {step.description}
                </p>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto min-w-0">
        <div className="max-w-3xl mx-auto">
          {/* Step Content */}
          <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 2 && <Sparkles className="w-5 h-5 text-primary" />}
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Upload Drawings */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Before Drawing */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-bold">1</span>
                    Before Drawing (Old Design)
                  </Label>
                  {beforeFile ? (
                    <div className="relative border-2 border-destructive/30 rounded-lg overflow-hidden bg-destructive/5">
                      <div className="aspect-[4/3] flex items-center justify-center p-4">
                        {beforePreview && beforeFile.type.startsWith('image/') ? (
                          <img src={beforePreview} alt="Before" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <FileText className="w-16 h-16 mb-2" />
                            <p className="font-medium">{beforeFile.name}</p>
                            <p className="text-sm">{(beforeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile('before')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-destructive/30 rounded-lg cursor-pointer hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
                      <Upload className="w-10 h-10 text-destructive/50 mb-2" />
                      <span className="text-sm font-medium text-destructive/70">Upload BEFORE drawing</span>
                      <span className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'before')}
                      />
                    </label>
                  )}
                </div>

                {/* After Drawing */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold">2</span>
                    After Drawing (New Design)
                  </Label>
                  {afterFile ? (
                    <div className="relative border-2 border-success/30 rounded-lg overflow-hidden bg-success/5">
                      <div className="aspect-[4/3] flex items-center justify-center p-4">
                        {afterPreview && afterFile.type.startsWith('image/') ? (
                          <img src={afterPreview} alt="After" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <FileText className="w-16 h-16 mb-2" />
                            <p className="font-medium">{afterFile.name}</p>
                            <p className="text-sm">{(afterFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile('after')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-success/30 rounded-lg cursor-pointer hover:border-success/50 hover:bg-success/5 transition-colors">
                      <Upload className="w-10 h-10 text-success/50 mb-2" />
                      <span className="text-sm font-medium text-success/70">Upload AFTER drawing</span>
                      <span className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'after')}
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {!analyzing && detectedChanges.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Our AI will compare your before and after drawings to automatically detect what changed.
                  </p>
                  <Button size="lg" onClick={analyzeChanges} className="gap-2">
                    <Eye className="w-5 h-5" />
                    Analyze Drawings
                  </Button>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Analyzing Drawings...</h3>
                  <p className="text-muted-foreground">AI is comparing your drawings to detect changes</p>
                </div>
              )}

              {!analyzing && detectedChanges.length > 0 && (
                <>
                  <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-success">Analysis Complete</p>
                      <p className="text-sm text-muted-foreground mt-1">{aiSummary}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Detected Changes</Label>
                    {detectedChanges.map((change, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className={cn('font-mono text-sm', getConfidenceColor(change.confidence))}>
                          {Math.round(change.confidence * 100)}%
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{change.type.replace('_', ' ').replace('changed', '')}</p>
                          <p className="text-sm text-muted-foreground">{change.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={analyzeChanges} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Re-analyze
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Review Changes */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-info/10 border border-info/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-info flex-shrink-0" />
                <p className="text-sm">
                  Review and adjust the detected changes. This determines who needs to review the ECN.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Change Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the change in detail..."
                  value={description || aiSummary}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-3 pt-2">
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
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {detectedChanges.some(c => c.type === option.key) && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        AI Detected
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Task Assignment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Based on the changes, these teams need to review and update their documentation:
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
                  <p>No tasks generated. Go back and select what changed.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Submit */}
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
                  <p className="font-medium">{description || aiSummary}</p>
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
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Attached Files</p>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-destructive" />
                      <span>{beforeFile?.name || 'No before file'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-success" />
                      <span>{afterFile?.name || 'No after file'}</span>
                    </div>
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
              <Button onClick={handleSubmit} disabled={!canProceed()} className="gap-2">
                <Check className="w-4 h-4" />
                Create ECN
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}