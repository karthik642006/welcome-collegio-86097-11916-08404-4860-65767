import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Users, UserCheck, UserX, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TemplateAttendanceView } from "@/components/attendance/TemplateAttendanceView";

type Student = {
  id: string;
  roll_number: string;
  name: string;
  email: string | null;
};

type AttendanceRecord = {
  id?: string;
  student_id: string;
  status: "present" | "absent";
};

const AttendanceSheet = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  // switched to plain object keyed by student id for simpler/reactive updates
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAbsentOnly, setShowAbsentOnly] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "template">("list");

  const isValidUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  useEffect(() => {
    // Guard against invalid or placeholder route params like ":sectionId"
    if (!sectionId || sectionId.startsWith(":") || !isValidUuid(sectionId)) {
      toast.error("Invalid section link");
      setLoading(false);
      navigate(-1);
      return;
    }
    fetchSectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const fetchSectionData = async () => {
    try {
      const { data: sectionData, error: sectionError } = await supabase
        .from("sections")
        .select(`
          *,
          year:years(
            *,
            department:departments(*)
          )
        `)
        .eq("id", sectionId)
        .single();

      if (sectionError) throw sectionError;
      setSection(sectionData);

      // Fetch templates for this section, year, or department
      const yearId = sectionData?.year?.id;
      const deptId = sectionData?.year?.department?.id;

      const { data: templatesData } = await supabase
        .from("attendance_sheet_templates")
        .select("*, template_cells(*)")
        .or(`section_id.eq.${sectionId},year_id.eq.${yearId},department_id.eq.${deptId},and(section_id.is.null,year_id.is.null,department_id.is.null)`)
        .order("created_at", { ascending: false });

      setTemplates(templatesData || []);
      if (templatesData && templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("section_id", sectionId)
        .order("roll_number");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Initialize attendance as all present (object keyed by student id)
      const initialAttendance: Record<string, AttendanceRecord> = {};
      studentsData?.forEach((student: Student) => {
        initialAttendance[student.id] = {
          student_id: student.id,
          status: "present",
        };
      });
      setAttendance(initialAttendance);

      // Try to fetch today's attendance if exists and merge over defaults
      const today = new Date().toISOString().split("T")[0];
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("section_id", sectionId)
        .eq("date", today);

      if (existingAttendance && existingAttendance.length > 0) {
        const merged = { ...initialAttendance };
        existingAttendance.forEach((record: any) => {
          merged[record.student_id] = {
            id: record.id,
            student_id: record.student_id,
            status: (record.status as "present" | "absent") ?? "present",
          };
        });
        setAttendance(merged);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load section data");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => {
      // 1. Create a new object to avoid mutating the original state
      const newAttendanceState = { ...prev };

      // 2. Get the specific student's current record
      const currentStudentRecord = prev[studentId];

      // 3. Determine the new status
      const nextStatus = currentStudentRecord?.status === "present" ? "absent" : "present";

      // 4. Create a new record object for the student being updated
      newAttendanceState[studentId] = {
        ...currentStudentRecord,
        student_id: studentId, // Ensure student_id is present
        status: nextStatus,
      };

      // 5. Return the new state object
      return newAttendanceState;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();

      const attendanceRecords = Object.values(attendance).map((record) => ({
        student_id: record.student_id,
        section_id: sectionId,
        date: today,
        status: record.status,
        marked_by: user?.id,
      }));

      // Delete existing attendance for today
      await supabase
        .from("attendance")
        .delete()
        .eq("section_id", sectionId)
        .eq("date", today);

      // Insert new attendance
      const { error } = await supabase
        .from("attendance")
        .insert(attendanceRecords);

      if (error) throw error;

      toast.success("Attendance saved successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter((a) => a.status === "present").length;
    const absent = total - present;
    return { total, present, absent };
  };

  const filteredStudents = showAbsentOnly
    ? students.filter((s) => attendance[s.id]?.status === "absent")
    : students;

  const stats = getStats();

  const handleDownload = () => {
    const today = new Date().toLocaleDateString();
    const csvContent = [
      ["S.No", "Roll Number", "Student Name", "Attendance Status"],
      ...students.map((student, index) => [
        index + 1,
        student.roll_number,
        student.name,
        attendance[student.id]?.status === "present" ? "Present" : "Absent"
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${section?.name}_${today.replace(/\//g, "-")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Attendance sheet downloaded!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {section && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">
              {section.year?.department?.name} - Year {section.year?.year_number} - Section {section.name}
            </h1>
            <p className="text-muted-foreground">Mark attendance for {new Date().toLocaleDateString()}</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAbsentOnly(!showAbsentOnly)}
            size="lg"
          >
            {showAbsentOnly ? "Show All Students" : "Show Absent Only"}
          </Button>
          {templates.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "list" ? "template" : "list")}
              size="lg"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {viewMode === "list" ? "Template View" : "List View"}
            </Button>
          )}
        </div>

        {/* Attendance Table or Template View */}
        <Card>
          <CardContent className="p-0">
            {viewMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">S.No</th>
                      <th className="text-left p-4 font-semibold">Roll Number</th>
                      <th className="text-left p-4 font-semibold">Student Name</th>
                      <th className="text-center p-4 font-semibold">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center p-8 text-muted-foreground">
                          {showAbsentOnly ? "No absent students" : "No students found"}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => {
                        const status = attendance[student.id]?.status;
                        const isPresent = status === "present";

                        return (
                          <tr
                            key={student.id}
                            className="border-t hover:bg-muted/20 transition-colors"
                          >
                            <td className="p-4">{index + 1}</td>
                            <td className="p-4 font-medium">{student.roll_number}</td>
                            <td className="p-4">{student.name}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => toggleAttendance(student.id)}
                                  className={cn(
                                    "min-h-[60px] min-w-[80px] rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm",
                                    isPresent
                                      ? "bg-green-50 hover:bg-green-100 border-2 border-green-500 dark:bg-green-950 dark:hover:bg-green-900"
                                      : "bg-red-50 hover:bg-red-100 border-2 border-red-500 dark:bg-red-950 dark:hover:bg-red-900"
                                  )}
                                  aria-label={isPresent ? "Mark as absent" : "Mark as present"}
                                >
                                  {isPresent ? (
                                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" strokeWidth={3} />
                                  ) : (
                                    <X className="h-8 w-8 text-red-600 dark:text-red-400" strokeWidth={3} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : selectedTemplate ? (
              <div className="overflow-x-auto p-4">
                <TemplateAttendanceView
                  template={selectedTemplate}
                  students={students}
                  // pass attendance as object; TemplateAttendanceView will need to accept this shape
                  attendance={attendance}
                  onToggle={toggleAttendance}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No template available for this section
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AttendanceSheet;