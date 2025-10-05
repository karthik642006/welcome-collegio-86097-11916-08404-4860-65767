-- Create attendance sheet templates table
CREATE TABLE public.attendance_sheet_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  year_id UUID REFERENCES public.years(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template cells table for storing grid structure
CREATE TABLE public.template_cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.attendance_sheet_templates(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  rowspan INTEGER NOT NULL DEFAULT 1,
  colspan INTEGER NOT NULL DEFAULT 1,
  cell_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'checkbox', 'header', 'static'
  label TEXT,
  config JSONB DEFAULT '{}'::jsonb, -- For storing additional cell configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template instance data table (for storing filled template data)
CREATE TABLE public.template_attendance_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.attendance_sheet_templates(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cell_id UUID NOT NULL REFERENCES public.template_cells(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  value TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_sheet_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_attendance_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Everyone can view templates"
  ON public.attendance_sheet_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.attendance_sheet_templates
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for template cells
CREATE POLICY "Everyone can view template cells"
  ON public.template_cells
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage template cells"
  ON public.template_cells
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for template attendance data
CREATE POLICY "Everyone can view template attendance data"
  ON public.template_attendance_data
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage template attendance data"
  ON public.template_attendance_data
  FOR ALL
  USING (is_admin(auth.uid()) OR (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('hod', 'assistant_hod', 'professor', 'lab_incharge', 'technical_incharge', 'principal')
  )));

-- Create indexes for better performance
CREATE INDEX idx_template_cells_template_id ON public.template_cells(template_id);
CREATE INDEX idx_template_cells_position ON public.template_cells(template_id, row_index, col_index);
CREATE INDEX idx_template_attendance_data_template ON public.template_attendance_data(template_id, section_id, date);

-- Add updated_at trigger
CREATE TRIGGER update_attendance_sheet_templates_updated_at
  BEFORE UPDATE ON public.attendance_sheet_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_template_cells_updated_at
  BEFORE UPDATE ON public.template_cells
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_template_attendance_data_updated_at
  BEFORE UPDATE ON public.template_attendance_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();