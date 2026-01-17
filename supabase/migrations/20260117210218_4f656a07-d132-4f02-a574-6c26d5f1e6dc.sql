-- Create enums for roles and statuses
CREATE TYPE public.app_role AS ENUM ('engineer', 'maintenance', 'quality', 'manufacturing', 'safety');
CREATE TYPE public.change_status AS ENUM ('draft', 'in_progress', 'pending_review', 'completed');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'no_change_needed');
CREATE TYPE public.notification_type AS ENUM ('task_assigned', 'task_completed', 'change_completed', 'comment_added');
CREATE TYPE public.file_type AS ENUM ('old_part', 'new_part', 'document');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create part_changes table
CREATE TABLE public.part_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  part_name TEXT NOT NULL,
  part_id TEXT,
  description TEXT NOT NULL,
  status change_status NOT NULL DEFAULT 'draft',
  -- Change classification checkboxes
  geometry_changed BOOLEAN DEFAULT FALSE,
  material_changed BOOLEAN DEFAULT FALSE,
  tolerances_changed BOOLEAN DEFAULT FALSE,
  weight_changed BOOLEAN DEFAULT FALSE,
  surface_finish_changed BOOLEAN DEFAULT FALSE,
  supplier_changed BOOLEAN DEFAULT FALSE,
  process_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dependencies table (what documents/areas are impacted)
CREATE TABLE public.dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_change_id UUID REFERENCES public.part_changes(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- e.g., 'maintenance_tasks', 'work_instructions', etc.
  affected_area TEXT NOT NULL, -- e.g., 'Maintenance', 'Quality', etc.
  owner_role app_role NOT NULL, -- which role is responsible
  reason TEXT NOT NULL, -- why it's impacted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table (assigned to area owners)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependency_id UUID REFERENCES public.dependencies(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  updated_document_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  related_change_id UUID REFERENCES public.part_changes(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create part_change_files table for file metadata
CREATE TABLE public.part_change_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_change_id UUID REFERENCES public.part_changes(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type file_type NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_change_files ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = $1 LIMIT 1;
$$;

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Helper function to check if user is engineer
CREATE OR REPLACE FUNCTION public.is_engineer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'engineer'
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for part_changes
CREATE POLICY "Authenticated users can view all changes"
ON public.part_changes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Engineers can create changes"
ON public.part_changes FOR INSERT
TO authenticated
WITH CHECK (public.is_engineer(auth.uid()));

CREATE POLICY "Engineers can update their own changes"
ON public.part_changes FOR UPDATE
TO authenticated
USING (created_by = auth.uid() AND public.is_engineer(auth.uid()));

-- RLS Policies for dependencies
CREATE POLICY "Authenticated users can view dependencies"
ON public.dependencies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Engineers can create dependencies"
ON public.dependencies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.part_changes 
    WHERE id = part_change_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Engineers can update dependencies"
ON public.dependencies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.part_changes 
    WHERE id = part_change_id AND created_by = auth.uid()
  )
);

-- RLS Policies for tasks
CREATE POLICY "Authenticated users can view relevant tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.dependencies d
    JOIN public.part_changes pc ON d.part_change_id = pc.id
    WHERE d.id = dependency_id AND pc.created_by = auth.uid()
  )
);

CREATE POLICY "System can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Assigned users can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid());

-- RLS Policies for part_change_files
CREATE POLICY "Authenticated users can view files"
ON public.part_change_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Change owners can upload files"
ON public.part_change_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.part_changes 
    WHERE id = part_change_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Change owners can delete files"
ON public.part_change_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.part_changes 
    WHERE id = part_change_id AND created_by = auth.uid()
  )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_part_changes_updated_at
BEFORE UPDATE ON public.part_changes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for part files
INSERT INTO storage.buckets (id, name, public) VALUES ('part-files', 'part-files', false);

-- Storage policies for part-files bucket
CREATE POLICY "Authenticated users can view part files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'part-files');

CREATE POLICY "Authenticated users can upload part files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'part-files');

CREATE POLICY "File owners can delete part files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'part-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.part_changes;