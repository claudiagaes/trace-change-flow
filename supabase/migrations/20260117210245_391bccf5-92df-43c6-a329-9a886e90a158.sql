-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate permissive policies with proper checks

-- Fix tasks INSERT policy - only allow inserting when user is engineer creating for their own change
DROP POLICY IF EXISTS "System can create tasks" ON public.tasks;
CREATE POLICY "Engineers can create tasks for their changes"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dependencies d
    JOIN public.part_changes pc ON d.part_change_id = pc.id
    WHERE d.id = dependency_id AND pc.created_by = auth.uid()
  )
);

-- Fix notifications INSERT policy - only recipients can have notifications created by change owners
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications for their changes"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  -- User is creating notification for a change they own
  (related_change_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.part_changes 
    WHERE id = related_change_id AND created_by = auth.uid()
  ))
  OR
  -- User is creating notification for a task they own
  (related_task_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.dependencies d ON t.dependency_id = d.id
    JOIN public.part_changes pc ON d.part_change_id = pc.id
    WHERE t.id = related_task_id AND (t.assigned_to = auth.uid() OR pc.created_by = auth.uid())
  ))
);