import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Grid3x3 } from "lucide-react";
import { TemplateGrid } from "@/components/template/TemplateGrid";

export default function TemplateBuilder() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [cells, setCells] = useState<any[]>([]);
  const [maxRow, setMaxRow] = useState(10);
  const [maxCol, setMaxCol] = useState(10);

  useEffect(() => {
    fetchColleges();
    if (templateId && templateId !== "new") {
      fetchTemplate();
    } else {
      // Initialize with default cells
      initializeDefaultTemplate();
    }
  }, [templateId]);

  const initializeDefaultTemplate = () => {
    const defaultCells = [
      { row_index: 0, col_index: 0, colspan: 2, rowspan: 1, cell_type: "static", label: "Department:" },
      { row_index: 0, col_index: 2, colspan: 4, rowspan: 1, cell_type: "text", label: "" },
      { row_index: 0, col_index: 6, colspan: 1, rowspan: 1, cell_type: "static", label: "Date:" },
      { row_index: 0, col_index: 7, colspan: 2, rowspan: 1, cell_type: "text", label: "" },
      { row_index: 1, col_index: 0, colspan: 1, rowspan: 1, cell_type: "static", label: "Year:" },
      { row_index: 1, col_index: 1, colspan: 2, rowspan: 1, cell_type: "text", label: "" },
      { row_index: 1, col_index: 6, colspan: 3, rowspan: 1, cell_type: "static", label: "Submit" },
      { row_index: 2, col_index: 0, colspan: 1, rowspan: 1, cell_type: "static", label: "Sem:" },
      { row_index: 2, col_index: 1, colspan: 2, rowspan: 1, cell_type: "text", label: "" },
      { row_index: 3, col_index: 0, colspan: 1, rowspan: 1, cell_type: "header", label: "Register Number" },
      { row_index: 3, col_index: 1, colspan: 1, rowspan: 1, cell_type: "header", label: "Student Name" },
      { row_index: 3, col_index: 2, colspan: 1, rowspan: 1, cell_type: "header", label: "S1 No" },
    ];

    // Add checkbox columns
    for (let i = 0; i < 7; i++) {
      defaultCells.push({
        row_index: 3,
        col_index: 3 + i,
        colspan: 1,
        rowspan: 1,
        cell_type: "header",
        label: String(i + 1)
      });
    }

    setCells(defaultCells);
  };

  const fetchColleges = async () => {
    const { data } = await supabase.from("colleges").select("*");
    if (data) setColleges(data);
  };

  const fetchDepartments = async (collegeId: string) => {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .eq("college_id", collegeId);
    if (data) setDepartments(data);
  };

  const fetchTemplate = async () => {
    if (!templateId || templateId === "new") return;

    setLoading(true);
    const { data: template } = await supabase
      .from("attendance_sheet_templates")
      .select("*, template_cells(*)")
      .eq("id", templateId)
      .single();

    if (template) {
      setTemplateName(template.name);
      setSelectedDept(template.department_id || "");
      setSelectedYear(template.year_id || "");
      setSelectedSection(template.section_id || "");
      setCells(template.template_cells || []);
      
      // Calculate max row and col
      const maxR = Math.max(...template.template_cells.map((c: any) => c.row_index + c.rowspan), 10);
      const maxC = Math.max(...template.template_cells.map((c: any) => c.col_index + c.colspan), 10);
      setMaxRow(maxR);
      setMaxCol(maxC);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCollege) {
      fetchDepartments(selectedCollege);
      setSelectedDept("");
      setSelectedYear("");
      setSelectedSection("");
    }
  }, [selectedCollege]);

  useEffect(() => {
    if (selectedDept) {
      fetchYears(selectedDept);
      setSelectedYear("");
      setSelectedSection("");
    }
  }, [selectedDept]);

  useEffect(() => {
    if (selectedYear) {
      fetchSections(selectedYear);
      setSelectedSection("");
    }
  }, [selectedYear]);

  const fetchYears = async (deptId: string) => {
    const { data } = await supabase
      .from("years")
      .select("*")
      .eq("department_id", deptId);
    if (data) setYears(data);
  };

  const fetchSections = async (yearId: string) => {
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("year_id", yearId);
    if (data) setSections(data);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let currentTemplateId = templateId;

      if (!templateId || templateId === "new") {
        // Create new template
        const { data: newTemplate, error: templateError } = await supabase
          .from("attendance_sheet_templates")
          .insert({
            name: templateName,
            department_id: selectedDept || null,
            year_id: selectedYear || null,
            section_id: selectedSection || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (templateError) throw templateError;
        currentTemplateId = newTemplate.id;
      } else {
        // Update existing template
        const { error: updateError } = await supabase
          .from("attendance_sheet_templates")
          .update({
            name: templateName,
            department_id: selectedDept || null,
            year_id: selectedYear || null,
            section_id: selectedSection || null,
          })
          .eq("id", templateId);

        if (updateError) throw updateError;

        // Delete existing cells
        await supabase.from("template_cells").delete().eq("template_id", templateId);
      }

      // Insert cells
      const cellsToInsert = cells.map(cell => ({
        template_id: currentTemplateId,
        row_index: cell.row_index,
        col_index: cell.col_index,
        rowspan: cell.rowspan || 1,
        colspan: cell.colspan || 1,
        cell_type: cell.cell_type,
        label: cell.label || "",
        config: cell.config || {},
      }));

      const { error: cellsError } = await supabase
        .from("template_cells")
        .insert(cellsToInsert);

      if (cellsError) throw cellsError;

      toast.success("Template saved successfully!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setMaxRow(prev => prev + 1);
  };

  const addColumn = () => {
    setMaxCol(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">
              {templateId === "new" ? "Create" : "Edit"} Attendance Template
            </h1>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label>Template Name</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          <div>
            <Label>College (Optional)</Label>
            <Select value={selectedCollege} onValueChange={setSelectedCollege}>
              <SelectTrigger>
                <SelectValue placeholder="Select college" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.id}>
                    {college.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Department (Optional)</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept} disabled={!selectedCollege}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Year (Optional)</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!selectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    Year {year.year_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Section (Optional)</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={addRow} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button onClick={addColumn} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        </div>

        <TemplateGrid
          cells={cells}
          setCells={setCells}
          maxRow={maxRow}
          maxCol={maxCol}
          setMaxRow={setMaxRow}
          setMaxCol={setMaxCol}
        />
      </div>
    </div>
  );
}
