import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Calendar, Users, GraduationCap, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import { EditDepartmentDialog } from "@/components/admin/EditDepartmentDialog";
import { EditYearDialog } from "@/components/admin/EditYearDialog";
import { EditSectionDialog } from "@/components/admin/EditSectionDialog";
import { EditStudentDialog } from "@/components/admin/EditStudentDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { UserRolesTab } from "@/components/admin/UserRolesTab";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Department form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Year form
  const [selectedDept, setSelectedDept] = useState("");
  const [yearNumber, setYearNumber] = useState("");

  // Section form
  const [selectedYear, setSelectedYear] = useState("");
  const [sectionName, setSectionName] = useState("");

  // Student form
  const [selectedSection, setSelectedSection] = useState("");
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const [departments, setDepartments] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  // Dialog states
  const [editDeptDialog, setEditDeptDialog] = useState<{ open: boolean; department: any }>({
    open: false,
    department: null,
  });
  const [editYearDialog, setEditYearDialog] = useState<{ open: boolean; year: any }>({
    open: false,
    year: null,
  });
  const [editSectionDialog, setEditSectionDialog] = useState<{ open: boolean; section: any }>({
    open: false,
    section: null,
  });
  const [editStudentDialog, setEditStudentDialog] = useState<{ open: boolean; student: any }>({
    open: false,
    student: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: string;
    id: string;
    name: string;
  }>({
    open: false,
    type: "",
    id: "",
    name: "",
  });

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: isAdminResp, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (error || !isAdminResp) {
        toast.error("You don't have admin access");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .order("name");
    setDepartments(depts || []);

    const { data: yrs } = await supabase
      .from("years")
      .select("*, department:departments(name)")
      .order("year_number");
    setYears(yrs || []);

    const { data: secs } = await supabase
      .from("sections")
      .select(`
        *,
        year:years(
          year_number,
          department:departments(name)
        )
      `)
      .order("name");
    setSections(secs || []);

    const { data: studs } = await supabase
      .from("students")
      .select(`
        *,
        section:sections(
          name,
          year:years(
            year_number,
            department:departments(name)
          )
        )
      `)
      .order("name");
    setStudents(studs || []);

    const { data: tmpls } = await supabase
      .from("attendance_sheet_templates")
      .select(`
        *,
        department:departments(name),
        year:years(year_number),
        section:sections(name)
      `)
      .order("created_at", { ascending: false });
    setTemplates(tmpls || []);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });
    setUserRoles(roles || []);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("departments")
        .insert({ name: deptName, code: deptCode });

      if (error) throw error;

      toast.success("Department created successfully!");
      setDeptName("");
      setDeptCode("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create department");
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("years")
        .insert({
          department_id: selectedDept,
          year_number: parseInt(yearNumber),
        });

      if (error) throw error;

      toast.success("Year created successfully!");
      setSelectedDept("");
      setYearNumber("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create year");
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("sections")
        .insert({
          year_id: selectedYear,
          name: sectionName,
        });

      if (error) throw error;

      toast.success("Section created successfully!");
      setSelectedYear("");
      setSectionName("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create section");
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("students")
        .insert({
          section_id: selectedSection,
          name: studentName,
          roll_number: rollNumber,
          email: studentEmail || null,
        });

      if (error) throw error;

      toast.success("Student added successfully!");
      setSelectedSection("");
      setStudentName("");
      setRollNumber("");
      setStudentEmail("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add student");
    }
  };

  const handleDelete = async () => {
    try {
      const tableName = deleteDialog.type as "departments" | "years" | "sections" | "students";
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", deleteDialog.id);

      if (error) throw error;

      const entityName = deleteDialog.type.slice(0, -1).replace("_", " ");
      toast.success(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully!`);
      setDeleteDialog({ open: false, type: "", id: "", name: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage departments, years, sections, and students</p>
        </div>

        <Tabs defaultValue="departments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="departments">
              <Building2 className="h-4 w-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="years">
              <Calendar className="h-4 w-4 mr-2" />
              Years
            </TabsTrigger>
            <TabsTrigger value="sections">
              <GraduationCap className="h-4 w-4 mr-2" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Users className="h-4 w-4 mr-2" />
              User Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Create Department</CardTitle>
                <CardDescription>Add a new department to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input
                      id="dept-name"
                      placeholder="Computer Science Engineering"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-code">Department Code</Label>
                    <Input
                      id="dept-code"
                      placeholder="CSE"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Create Department</Button>
                </form>

                {departments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Existing Departments</h3>
                    <div className="space-y-2">
                      {departments.map((dept) => (
                        <div key={dept.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-sm text-muted-foreground">{dept.code}</p>
                          </div>
                          <EntityActionsMenu
                            onEdit={() => setEditDeptDialog({ open: true, department: dept })}
                            onDelete={() =>
                              setDeleteDialog({
                                open: true,
                                type: "departments",
                                id: dept.id,
                                name: dept.name,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="years">
            <Card>
              <CardHeader>
                <CardTitle>Create Year</CardTitle>
                <CardDescription>Add years to a department</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateYear} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year-dept">Department</Label>
                    <Select value={selectedDept} onValueChange={setSelectedDept} required>
                      <SelectTrigger id="year-dept">
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
                  <div className="space-y-2">
                    <Label htmlFor="year-num">Year Number</Label>
                    <Select value={yearNumber} onValueChange={setYearNumber} required>
                      <SelectTrigger id="year-num">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit">Create Year</Button>
                </form>

                {years.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Existing Years</h3>
                    <div className="space-y-2">
                      {years.map((year) => (
                        <div key={year.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <p className="font-medium">
                            {year.department?.name} - Year {year.year_number}
                          </p>
                          <EntityActionsMenu
                            onEdit={() => setEditYearDialog({ open: true, year })}
                            onDelete={() =>
                              setDeleteDialog({
                                open: true,
                                type: "years",
                                id: year.id,
                                name: `${year.department?.name} - Year ${year.year_number}`,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections">
            <Card>
              <CardHeader>
                <CardTitle>Create Section</CardTitle>
                <CardDescription>Add sections to a year</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSection} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-year">Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear} required>
                      <SelectTrigger id="section-year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.department?.name} - Year {year.year_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-name">Section Name</Label>
                    <Input
                      id="section-name"
                      placeholder="A"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Create Section</Button>
                </form>

                {sections.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Existing Sections</h3>
                    <div className="space-y-2">
                      {sections.map((section) => (
                        <div key={section.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <p className="font-medium">
                            {section.year?.department?.name} - Year {section.year?.year_number} - Section {section.name}
                          </p>
                          <EntityActionsMenu
                            onEdit={() => setEditSectionDialog({ open: true, section })}
                            onDelete={() =>
                              setDeleteDialog({
                                open: true,
                                type: "sections",
                                id: section.id,
                                name: `${section.year?.department?.name} - Year ${section.year?.year_number} - Section ${section.name}`,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Add Student</CardTitle>
                <CardDescription>Add a student to a section</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-section">Section</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection} required>
                      <SelectTrigger id="student-section">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.year?.department?.name} - Year {section.year?.year_number} - Section {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-roll">Roll Number</Label>
                    <Input
                      id="student-roll"
                      placeholder="2023CSE001"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Student Name</Label>
                    <Input
                      id="student-name"
                      placeholder="John Doe"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email (Optional)</Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="john.doe@college.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Add Student</Button>
                </form>

                {students.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Existing Students</h3>
                    <div className="space-y-2">
                      {students.map((student) => (
                        <div key={student.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Roll: {student.roll_number} | {student.section?.year?.department?.name} - Year {student.section?.year?.year_number} - Section {student.section?.name}
                            </p>
                          </div>
                          <EntityActionsMenu
                            onEdit={() => setEditStudentDialog({ open: true, student })}
                            onDelete={() =>
                              setDeleteDialog({
                                open: true,
                                type: "students",
                                id: student.id,
                                name: student.name,
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Sheet Templates</CardTitle>
                <CardDescription>Create and manage custom attendance sheet templates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/template/new")} className="mb-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>

                {templates.length > 0 ? (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 bg-muted rounded-lg flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{template.name}</p>
                          <div className="text-sm text-muted-foreground mt-1">
                            {template.department && <span>Department: {template.department.name}</span>}
                            {template.year && <span className="ml-3">Year: {template.year.year_number}</span>}
                            {template.section && <span className="ml-3">Section: {template.section.name}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {new Date(template.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/template/${template.id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "attendance_sheet_templates",
                                id: template.id,
                                name: template.name,
                              })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No templates created yet. Create your first template to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <UserRolesTab userRoles={userRoles} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialogs */}
        <EditDepartmentDialog
          department={editDeptDialog.department}
          open={editDeptDialog.open}
          onOpenChange={(open) => setEditDeptDialog({ ...editDeptDialog, open })}
          onSuccess={fetchData}
        />
        <EditYearDialog
          year={editYearDialog.year}
          departments={departments}
          open={editYearDialog.open}
          onOpenChange={(open) => setEditYearDialog({ ...editYearDialog, open })}
          onSuccess={fetchData}
        />
        <EditSectionDialog
          section={editSectionDialog.section}
          years={years}
          open={editSectionDialog.open}
          onOpenChange={(open) => setEditSectionDialog({ ...editSectionDialog, open })}
          onSuccess={fetchData}
        />
        <EditStudentDialog
          student={editStudentDialog.student}
          sections={sections}
          open={editStudentDialog.open}
          onOpenChange={(open) => setEditStudentDialog({ ...editStudentDialog, open })}
          onSuccess={fetchData}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
          onConfirm={handleDelete}
          title={`Delete ${deleteDialog.type.slice(0, -1).replace("_", " ")}?`}
          description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        />
      </main>
    </div>
  );
};

export default Admin;
