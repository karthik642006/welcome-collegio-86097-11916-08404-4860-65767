import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Calendar, Users, GraduationCap, FileText, SchoolIcon } from "lucide-react";
import { toast } from "sonner";
import { EntityActionsMenu } from "@/components/admin/EntityActionsMenu";
import { EditCollegeDialog } from "@/components/admin/EditCollegeDialog";
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

  // College form
  const [collegeName, setCollegeName] = useState("");
  const [collegeCode, setCollegeCode] = useState("");

  // Department form
  const [selectedCollege, setSelectedCollege] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Year form
  const [selectedCollegeForYear, setSelectedCollegeForYear] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [yearNumber, setYearNumber] = useState("");

  // Section form
  const [selectedCollegeForSection, setSelectedCollegeForSection] = useState("");
  const [selectedDeptForSection, setSelectedDeptForSection] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sectionName, setSectionName] = useState("");

  // Student form
  const [selectedCollegeForStudent, setSelectedCollegeForStudent] = useState("");
  const [selectedDeptForStudent, setSelectedDeptForStudent] = useState("");
  const [selectedYearForStudent, setSelectedYearForStudent] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentGender, setStudentGender] = useState("");

  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

  // Dialog states
  const [editCollegeDialog, setEditCollegeDialog] = useState<{ open: boolean; college: any }>({
    open: false,
    college: null,
  });
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
    const { data: clgs } = await supabase
      .from("colleges")
      .select("*")
      .order("name");
    setColleges(clgs || []);

    const { data: depts } = await supabase
      .from("departments")
      .select("*, college:colleges(name)")
      .order("name");
    setDepartments(depts || []);

    const { data: yrs } = await supabase
      .from("years")
      .select("*, department:departments(name, college_id, college:colleges(name))")
      .order("year_number");
    setYears(yrs || []);

    const { data: secs } = await supabase
      .from("sections")
      .select(`
        *,
        year:years(
          year_number,
          department:departments(name, college_id, college:colleges(name))
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
            department:departments(name, college_id, college:colleges(name))
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

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("colleges")
        .insert({ name: collegeName, code: collegeCode });

      if (error) throw error;

      toast.success("College created successfully!");
      setCollegeName("");
      setCollegeCode("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create college");
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("departments")
        .insert({ name: deptName, code: deptCode, college_id: selectedCollege });

      if (error) throw error;

      toast.success("Department created successfully!");
      setSelectedCollege("");
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
      setSelectedCollegeForYear("");
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
      setSelectedCollegeForSection("");
      setSelectedDeptForSection("");
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
          gender: studentGender,
        });

      if (error) throw error;

      toast.success("Student added successfully!");
      setSelectedCollegeForStudent("");
      setSelectedDeptForStudent("");
      setSelectedYearForStudent("");
      setSelectedSection("");
      setStudentName("");
      setRollNumber("");
      setStudentEmail("");
      setStudentGender("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add student");
    }
  };

  const handleDelete = async () => {
    try {
      const tableName = deleteDialog.type as "colleges" | "departments" | "years" | "sections" | "students" | "attendance_sheet_templates";
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

  const filteredDeptsForYear = departments.filter(d => d.college_id === selectedCollegeForYear);
  const filteredDeptsForSection = departments.filter(d => d.college_id === selectedCollegeForSection);
  const filteredYearsForSection = years.filter(y => y.department_id === selectedDeptForSection);
  const filteredDeptsForStudent = departments.filter(d => d.college_id === selectedCollegeForStudent);
  const filteredYearsForStudent = years.filter(y => y.department_id === selectedDeptForStudent);
  const filteredSectionsForStudent = sections.filter(s => s.year_id === selectedYearForStudent);

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
          <p className="text-muted-foreground">Manage colleges, departments, years, sections, and students</p>
        </div>

        <Tabs defaultValue="colleges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="colleges">
              <SchoolIcon className="h-4 w-4 mr-2" />
              Colleges
            </TabsTrigger>
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
              Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colleges">
            <Card>
              <CardHeader>
                <CardTitle>Create College</CardTitle>
                <CardDescription>Add a new college to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCollege} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="college-name">College Name</Label>
                    <Input
                      id="college-name"
                      placeholder="ABC Engineering College"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college-code">College Code</Label>
                    <Input
                      id="college-code"
                      placeholder="ABC"
                      value={collegeCode}
                      onChange={(e) => setCollegeCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Create College</Button>
                </form>

                {colleges.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Existing Colleges</h3>
                    <div className="space-y-2">
                      {colleges.map((college) => (
                        <div key={college.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{college.name}</p>
                            <p className="text-sm text-muted-foreground">{college.code}</p>
                          </div>
                          <EntityActionsMenu
                            onEdit={() => setEditCollegeDialog({ open: true, college })}
                            onDelete={() =>
                              setDeleteDialog({
                                open: true,
                                type: "colleges",
                                id: college.id,
                                name: college.name,
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

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Create Department</CardTitle>
                <CardDescription>Add a new department to a college</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-college">College</Label>
                    <Select value={selectedCollege} onValueChange={setSelectedCollege} required>
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
                      {colleges.map((college) => {
                        const collegeDepts = departments.filter(d => d.college_id === college.id);
                        if (collegeDepts.length === 0) return null;
                        return (
                          <div key={college.id} className="mb-4">
                            <h4 className="font-medium text-primary mb-2">{college.name}</h4>
                            <div className="space-y-2 ml-4">
                              {collegeDepts.map((dept) => (
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
                        );
                      })}
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
                <CardDescription>Add a new year to a department</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateYear} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year-college">College</Label>
                    <Select value={selectedCollegeForYear} onValueChange={setSelectedCollegeForYear} required>
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
                  <div className="space-y-2">
                    <Label htmlFor="year-dept">Department</Label>
                    <Select value={selectedDept} onValueChange={setSelectedDept} required disabled={!selectedCollegeForYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDeptsForYear.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year-number">Year Number</Label>
                    <Select value={yearNumber} onValueChange={setYearNumber} required>
                      <SelectTrigger>
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
                      {colleges.map((college) => {
                        const collegeDepts = departments.filter(d => d.college_id === college.id);
                        if (collegeDepts.length === 0) return null;
                        return (
                          <div key={college.id} className="mb-4">
                            <h4 className="font-medium text-primary mb-2">{college.name}</h4>
                            {collegeDepts.map((dept) => {
                              const deptYears = years.filter(y => y.department_id === dept.id);
                              if (deptYears.length === 0) return null;
                              return (
                                <div key={dept.id} className="ml-4 mb-3">
                                  <h5 className="font-medium text-sm mb-2">{dept.name}</h5>
                                  <div className="space-y-2 ml-4">
                                    {deptYears.map((year) => (
                                      <div key={year.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                                        <p className="font-medium">Year {year.year_number}</p>
                                        <EntityActionsMenu
                                          onEdit={() => setEditYearDialog({ open: true, year })}
                                          onDelete={() =>
                                            setDeleteDialog({
                                              open: true,
                                              type: "years",
                                              id: year.id,
                                              name: `Year ${year.year_number}`,
                                            })
                                          }
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
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
                <CardDescription>Add a new section to a year</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSection} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-college">College</Label>
                    <Select value={selectedCollegeForSection} onValueChange={setSelectedCollegeForSection} required>
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
                  <div className="space-y-2">
                    <Label htmlFor="section-dept">Department</Label>
                    <Select value={selectedDeptForSection} onValueChange={setSelectedDeptForSection} required disabled={!selectedCollegeForSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDeptsForSection.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-year">Year</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear} required disabled={!selectedDeptForSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredYearsForSection.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            Year {year.year_number}
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
                          <div>
                            <p className="font-medium">{section.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {section.year?.department?.name} - Year {section.year?.year_number}
                            </p>
                          </div>
                          <EntityActionsMenu
                            onEdit={() => setEditSectionDialog({ open: true, section })}
                            onDelete={() =>
                              setDeleteDialog({
                                open: true,
                                type: "sections",
                                id: section.id,
                                name: section.name,
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
                <CardDescription>Add a new student to a section</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-college">College</Label>
                    <Select value={selectedCollegeForStudent} onValueChange={setSelectedCollegeForStudent} required>
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
                  <div className="space-y-2">
                    <Label htmlFor="student-dept">Department</Label>
                    <Select value={selectedDeptForStudent} onValueChange={setSelectedDeptForStudent} required disabled={!selectedCollegeForStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDeptsForStudent.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-year">Year</Label>
                    <Select value={selectedYearForStudent} onValueChange={setSelectedYearForStudent} required disabled={!selectedDeptForStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredYearsForStudent.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            Year {year.year_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-section">Section</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection} required disabled={!selectedYearForStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSectionsForStudent.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-roll">Roll Number</Label>
                    <Input
                      id="student-roll"
                      placeholder="22CS101"
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
                      placeholder="student@example.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-gender">Gender</Label>
                    <Select value={studentGender} onValueChange={setStudentGender} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
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
                              {student.roll_number} - {student.section?.name} - {student.gender || 'N/A'}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendance Sheet Templates</CardTitle>
                    <CardDescription>Manage attendance sheet templates</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/template/new')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length > 0 ? (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div key={template.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.department?.name || 'All'} - Year {template.year?.year_number || 'All'} - Section {template.section?.name || 'All'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/template/${template.id}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
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
        <EditCollegeDialog
          college={editCollegeDialog.college}
          open={editCollegeDialog.open}
          onOpenChange={(open) => setEditCollegeDialog({ ...editCollegeDialog, open })}
          onSuccess={fetchData}
        />
        <EditDepartmentDialog
          department={editDeptDialog.department}
          colleges={colleges}
          open={editDeptDialog.open}
          onOpenChange={(open) => setEditDeptDialog({ ...editDeptDialog, open })}
          onSuccess={fetchData}
        />
        <EditYearDialog
          year={editYearDialog.year}
          colleges={colleges}
          departments={departments}
          open={editYearDialog.open}
          onOpenChange={(open) => setEditYearDialog({ ...editYearDialog, open })}
          onSuccess={fetchData}
        />
        <EditSectionDialog
          section={editSectionDialog.section}
          colleges={colleges}
          departments={departments}
          years={years}
          open={editSectionDialog.open}
          onOpenChange={(open) => setEditSectionDialog({ ...editSectionDialog, open })}
          onSuccess={fetchData}
        />
        <EditStudentDialog
          student={editStudentDialog.student}
          colleges={colleges}
          departments={departments}
          years={years}
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
