import { AppRole, ChangeClassification, DependencyConfig } from './types';

// Dependency mapping rules based on what changed
export const DEPENDENCY_RULES: DependencyConfig[] = [
  // Maintenance impacts
  {
    documentType: 'maintenance_tasks',
    affectedArea: 'Maintenance Task Definitions',
    ownerRole: 'maintenance',
    triggers: ['geometry_changed', 'material_changed', 'weight_changed'],
    reason: 'Part geometry, material, or weight changes may affect maintenance procedures and intervals.',
  },
  {
    documentType: 'preventive_maintenance',
    affectedArea: 'Preventive Maintenance Schedule',
    ownerRole: 'maintenance',
    triggers: ['material_changed', 'surface_finish_changed'],
    reason: 'Material or surface finish changes may require updated lubrication or inspection schedules.',
  },
  // Manufacturing impacts
  {
    documentType: 'work_instructions',
    affectedArea: 'Operator Work Instructions',
    ownerRole: 'manufacturing',
    triggers: ['geometry_changed', 'tolerances_changed', 'process_changed'],
    reason: 'Changes to geometry, tolerances, or process require updated operator procedures.',
  },
  {
    documentType: 'machine_setup',
    affectedArea: 'Machine Setup Sheets',
    ownerRole: 'manufacturing',
    triggers: ['geometry_changed', 'tolerances_changed', 'material_changed'],
    reason: 'Machine parameters may need adjustment for new geometry, tolerances, or materials.',
  },
  {
    documentType: 'tooling_requirements',
    affectedArea: 'Tooling Requirements',
    ownerRole: 'manufacturing',
    triggers: ['geometry_changed', 'material_changed'],
    reason: 'New geometry or material may require different tooling or fixtures.',
  },
  // Quality impacts
  {
    documentType: 'inspection_checklist',
    affectedArea: 'Quality Inspection Checklist',
    ownerRole: 'quality',
    triggers: ['geometry_changed', 'tolerances_changed', 'surface_finish_changed'],
    reason: 'Dimensional or surface requirements need updated inspection criteria.',
  },
  {
    documentType: 'control_plan',
    affectedArea: 'Control Plan',
    ownerRole: 'quality',
    triggers: ['tolerances_changed', 'process_changed', 'supplier_changed'],
    reason: 'Process or supplier changes require control plan updates.',
  },
  {
    documentType: 'measurement_procedures',
    affectedArea: 'Measurement Procedures',
    ownerRole: 'quality',
    triggers: ['geometry_changed', 'tolerances_changed'],
    reason: 'New measurement techniques may be required for changed geometry.',
  },
  // Safety impacts
  {
    documentType: 'safety_documentation',
    affectedArea: 'Safety Documentation',
    ownerRole: 'safety',
    triggers: ['material_changed', 'weight_changed', 'process_changed'],
    reason: 'Material, weight, or process changes may affect safety procedures.',
  },
  {
    documentType: 'ppe_requirements',
    affectedArea: 'PPE Requirements',
    ownerRole: 'safety',
    triggers: ['material_changed', 'surface_finish_changed'],
    reason: 'New materials or finishes may require different personal protective equipment.',
  },
];

// Get triggered dependencies based on classification
export function getTriggeredDependencies(classification: ChangeClassification): DependencyConfig[] {
  return DEPENDENCY_RULES.filter(rule => {
    return rule.triggers.some(trigger => classification[trigger]);
  });
}

// Role display names
export const ROLE_LABELS: Record<AppRole, string> = {
  engineer: 'Engineer',
  maintenance: 'Maintenance',
  quality: 'Quality',
  manufacturing: 'Manufacturing',
  safety: 'Safety',
};

// Role colors for visualization
export const ROLE_COLORS: Record<AppRole, { bg: string; border: string; text: string }> = {
  engineer: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' },
  maintenance: { bg: 'bg-info/10', border: 'border-info/30', text: 'text-info' },
  quality: { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' },
  manufacturing: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' },
  safety: { bg: 'bg-destructive/10', border: 'border-destructive/30', text: 'text-destructive' },
};

// Status display config
export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-pending' },
  in_progress: { label: 'In Progress', className: 'status-in-progress' },
  pending_review: { label: 'Pending Review', className: 'status-pending' },
  completed: { label: 'Completed', className: 'status-completed' },
  pending: { label: 'Pending', className: 'status-pending' },
  no_change_needed: { label: 'No Change Needed', className: 'status-completed' },
};
