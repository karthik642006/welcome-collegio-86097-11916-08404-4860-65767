import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAbsentOnly, setShowAbsentOnly] = useState(false);

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

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("section_id", sectionId)
        .order("roll_number");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

  // Initialize attendance as all present
  const initialAttendance = new Map<string, AttendanceRecord>();
  studentsData?.forEach((student) => {
    initialAttendance.set(student.id, {
      student_id: student.id,
      status: "present",
    });
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
    const mergedMap = new Map(initialAttendance);
    existingAttendance.forEach((record) => {
      mergedMap.set(record.student_id, {
        id: record.id,
        student_id: record.student_id,
        status: (record.status as "present" | "absent") ?? "present",
      });
    });
    setAttendance(mergedMap);
  }
    } catch (error: any) {
      toast.error("Failed to load section data");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(studentId);
      const nextStatus = !current
        ? "present"
        : current.status === "present"
          ? "absent"
          : "present";
      newMap.set(studentId, {
        ...(current ?? { student_id: studentId }),
        status: nextStatus,
      });
      return newMap;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();

      const attendanceRecords = Array.from(attendance.values()).map((record) => ({
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
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const total = students.length;
    const present = Array.from(attendance.values()).filter((a) => a.status === "present").length;
    const absent = total - present;
    return { total, present, absent };
  };

  const filteredStudents = showAbsentOnly
    ? students.filter((s) => attendance.get(s.id)?.status === "absent")
    : students;

  const stats = getStats();

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
            onClick={() => setShowAbsentOnly(!showAbsentOnly)}
            size="lg"
          >
            {showAbsentOnly ? "Show All Students" : "Show Absent Only"}
          </Button>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardContent className="p-0">
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
                      const status = attendance.get(student.id)?.status;
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
                            <div className="flex justify-center">
                              <button
                                onClick={() => toggleAttendance(student.id)}
                                className={cn(
                                  "h-12 w-12 rounded-lg flex items-center justify-center transition-all hover:scale-110",
                                  isPresent
                                    ? "bg-success/20 hover:bg-success/30"
                                    : "bg-destructive/20 hover:bg-destructive/30"
                                )}
                              >
                                {isPresent ? (
                                  <Check className="h-6 w-6 text-success" />
                                ) : (
                                  <X className="h-6 w-6 text-destructive" />
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AttendanceSheet;
