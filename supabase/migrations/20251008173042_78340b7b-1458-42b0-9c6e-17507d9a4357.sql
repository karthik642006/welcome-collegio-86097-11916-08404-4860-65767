-- Create colleges table
CREATE TABLE public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- RLS policies for colleges
CREATE POLICY "Everyone can view colleges" 
ON public.colleges 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage colleges" 
ON public.colleges 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add college_id to departments table
ALTER TABLE public.departments 
ADD COLUMN college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE;

-- Add gender to students table
ALTER TABLE public.students 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));

-- Create index for better performance
CREATE INDEX idx_departments_college_id ON public.departments(college_id);
CREATE INDEX idx_students_gender ON public.students(gender);