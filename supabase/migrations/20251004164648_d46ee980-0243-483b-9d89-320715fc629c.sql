-- Drop the overly permissive public SELECT policy on students table
DROP POLICY IF EXISTS "Everyone can view students" ON public.students;

-- Create a new restrictive SELECT policy that only allows authenticated staff and admins to view student data
CREATE POLICY "Only staff and admins can view students" 
ON public.students 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY[
      'hod'::user_role, 
      'assistant_hod'::user_role, 
      'professor'::user_role, 
      'lab_incharge'::user_role, 
      'technical_incharge'::user_role,
      'principal'::user_role
    ])
  ))
);