// TRACE Application Types

export type AppRole = 'engineer' | 'maintenance' | 'quality' | 'manufacturing' | 'safety';

export type ChangeStatus = 'draft' | 'in_progress' | 'pending_review' | 'completed';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'no_change_needed';

export type NotificationType = 'task_assigned' | 'task_completed' | 'change_completed' | 'comment_added';

export type FileType = 'old_part' | 'new_part' | 'document';

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface PartChange {
  id: string;
  created_by: string;
  part_name: string;
  part_id: string | null;
  description: string;
  status: ChangeStatus;
  geometry_changed: boolean;
  material_changed: boolean;
  tolerances_changed: boolean;
  weight_changed: boolean;
  surface_finish_changed: boolean;
  supplier_changed: boolean;
  process_changed: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: Profile;
  dependencies?: Dependency[];
  files?: PartChangeFile[];
}

export interface Dependency {
  id: string;
  part_change_id: string;
  document_type: string;
  affected_area: string;
  owner_role: AppRole;
  reason: string;
  created_at: string;
  // Joined data
  task?: Task;
}

export interface Task {
  id: string;
  dependency_id: string;
  assigned_to: string | null;
  status: TaskStatus;
  comments: string | null;
  updated_document_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  dependency?: Dependency;
  assignee?: Profile;
  part_change?: PartChange;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_task_id: string | null;
  related_change_id: string | null;
  read_at: string | null;
  email_sent: boolean;
  created_at: string;
}

export interface PartChangeFile {
  id: string;
  part_change_id: string;
  file_path: string;
  file_name: string;
  file_type: FileType;
  uploaded_by: string | null;
  uploaded_at: string;
}

// Dependency mapping configuration
export interface DependencyConfig {
  documentType: string;
  affectedArea: string;
  ownerRole: AppRole;
  triggers: Array<keyof ChangeClassification>;
  reason: string;
}

export interface ChangeClassification {
  geometry_changed: boolean;
  material_changed: boolean;
  tolerances_changed: boolean;
  weight_changed: boolean;
  surface_finish_changed: boolean;
  supplier_changed: boolean;
  process_changed: boolean;
}

// Change Wizard Step Data
export interface WizardStepData {
  step: number;
  partInfo?: {
    part_name: string;
    part_id?: string;
    description: string;
  };
  files?: {
    oldPart?: File;
    newPart?: File;
    documents?: File[];
  };
  classification?: ChangeClassification;
  dependencies?: DependencyConfig[];
}
