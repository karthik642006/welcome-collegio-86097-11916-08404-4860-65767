import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, LogOut, Settings, Building2, BookOpen, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { HierarchyBreadcrumb } from "@/components/navigation/HierarchyBreadcrumb";

type College = {
  id: string;
  name: string;
  code: string;
};

type Department = {
  id: string;
  name: string;
  code: string;
  college_id: string;
};

type Year = {
  id: string;
  year_number: number;
  department_id: string;
};

type Section = {
  id: string;
  name: string;
  year_id: string;
};

const DEPARTMENT_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-green-500 to-green-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-red-500 to-red-600",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [breadcrumb, setBreadcrumb] = useState<Array<{id: string; name: string; level: "college" | "department" | "year" | "section"}>>([]);

  useEffect(() => {
    checkUser();
    fetchColleges();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);
      
      // Check if user is admin
      const { data: isAdminResp } = await supabase.rpc('is_admin', { user_id: user.id });
      setIsAdmin(!!isAdminResp);
    }
  };

  const fetchColleges = async () => {
    try {
      const { data, error } = await supabase
        .from("colleges")
        .select("*")
        .order("name");

      if (error) throw error;
      setColleges(data || []);
    } catch (error: any) {
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (collegeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("college_id", collegeId)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async (departmentId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("years")
        .select("*")
        .eq("department_id", departmentId)
        .order("year_number");

      if (error) throw error;
      setYears(data || []);
    } catch (error: any) {
      toast.error("Failed to load years");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (yearId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("year_id", yearId)
        .order("name");

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const handleCollegeClick = (college: College) => {
    setBreadcrumb([{ id: college.id, name: college.name, level: "college" }]);
    setDepartments([]);
    setYears([]);
    setSections([]);
    fetchDepartments(college.id);
  };

  const handleDepartmentClick = (dept: Department) => {
    const newBreadcrumb = [...breadcrumb.filter(b => b.level === "college"), { id: dept.id, name: dept.name, level: "department" as const }];
    setBreadcrumb(newBreadcrumb);
    setYears([]);
    setSections([]);
    fetchYears(dept.id);
  };

  const handleYearClick = (year: Year) => {
    const newBreadcrumb = [...breadcrumb.filter(b => b.level !== "year" && b.level !== "section"), { id: year.id, name: `Year ${year.year_number}`, level: "year" as const }];
    setBreadcrumb(newBreadcrumb);
    setSections([]);
    fetchSections(year.id);
  };

  const handleSectionClick = (section: Section) => {
    navigate(`/attendance/${section.id}`);
  };

  const handleBreadcrumbNavigate = (index: number) => {
    if (index === -1) {
      // Navigate to home (colleges)
      setBreadcrumb([]);
      setDepartments([]);
      setYears([]);
      setSections([]);
      fetchColleges();
    } else {
      const item = breadcrumb[index];
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);

      if (item.level === "college") {
        setYears([]);
        setSections([]);
        fetchDepartments(item.id);
      } else if (item.level === "department") {
        setSections([]);
        fetchYears(item.id);
      } else if (item.level === "year") {
        fetchSections(item.id);
      }
    }
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
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome Attendance</h1>
              <p className="text-sm text-muted-foreground">College Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <HierarchyBreadcrumb items={breadcrumb} onNavigate={handleBreadcrumbNavigate} />

        {/* Show Colleges */}
        {breadcrumb.length === 0 && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Colleges</h2>
              <p className="text-muted-foreground">Select a college to continue</p>
            </div>
            {colleges.length === 0 ? (
              <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                  <CardTitle>No Colleges Found</CardTitle>
                  <CardDescription>Please contact your administrator to set up colleges</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {colleges.map((college) => (
                  <Button
                    key={college.id}
                    onClick={() => handleCollegeClick(college)}
                    variant="outline"
                    className="h-auto py-8 flex flex-col items-center gap-3 hover:shadow-[var(--shadow-medium)] transition-all"
                  >
                    <Building2 className="h-10 w-10 text-primary" />
                    <div className="text-center">
                      <div className="font-semibold">{college.name}</div>
                      <div className="text-sm text-muted-foreground">{college.code}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show Departments */}
        {breadcrumb.length > 0 && breadcrumb[breadcrumb.length - 1].level === "college" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Departments</h2>
              <p className="text-muted-foreground">Select a department to continue</p>
            </div>
            {departments.length === 0 ? (
              <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                  <CardTitle>No Departments Found</CardTitle>
                  <CardDescription>No departments configured for this college</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {departments.map((dept) => (
                  <Button
                    key={dept.id}
                    onClick={() => handleDepartmentClick(dept)}
                    variant="outline"
                    className="h-auto py-8 flex flex-col items-center gap-3 hover:shadow-[var(--shadow-medium)] transition-all"
                  >
                    <BookOpen className="h-10 w-10 text-primary" />
                    <div className="text-center">
                      <div className="font-semibold">{dept.name}</div>
                      <div className="text-sm text-muted-foreground">{dept.code}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show Years */}
        {breadcrumb.length > 0 && breadcrumb[breadcrumb.length - 1].level === "department" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Years</h2>
              <p className="text-muted-foreground">Select a year to continue</p>
            </div>
            {years.length === 0 ? (
              <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                  <CardTitle>No Years Found</CardTitle>
                  <CardDescription>No years configured for this department</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {years.map((year) => (
                  <Button
                    key={year.id}
                    onClick={() => handleYearClick(year)}
                    variant="outline"
                    className="h-auto py-8 flex flex-col items-center gap-3 hover:shadow-[var(--shadow-medium)] transition-all"
                  >
                    <Calendar className="h-10 w-10 text-primary" />
                    <div className="font-semibold text-lg">Year {year.year_number}</div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show Sections */}
        {breadcrumb.length > 0 && breadcrumb[breadcrumb.length - 1].level === "year" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Sections</h2>
              <p className="text-muted-foreground">Select a section to mark attendance</p>
            </div>
            {sections.length === 0 ? (
              <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                  <CardTitle>No Sections Found</CardTitle>
                  <CardDescription>No sections configured for this year</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    onClick={() => handleSectionClick(section)}
                    variant="outline"
                    className="h-auto py-8 flex flex-col items-center gap-3 hover:shadow-[var(--shadow-medium)] transition-all hover:scale-105"
                  >
                    <Users className="h-10 w-10 text-primary" />
                    <div className="font-semibold text-lg">Section {section.name}</div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
