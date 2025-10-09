import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

type Department = {
  id: string;
  name: string;
  code: string;
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
    fetchDepartments();
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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      toast.error("Failed to load departments");
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

  const handleDepartmentClick = (deptId: string) => {
    navigate(`/department/${deptId}`);
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Departments</h2>
          <p className="text-muted-foreground">Select a department to view attendance</p>
        </div>

        {departments.length === 0 ? (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>No Departments Found</CardTitle>
              <CardDescription>
                Please contact your administrator to set up departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/admin")}>Go to Admin Panel</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {departments.map((dept, index) => (
              <Card
                key={dept.id}
                className="cursor-pointer hover:shadow-[var(--shadow-strong)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                onClick={() => handleDepartmentClick(dept.id)}
              >
                <div className={`h-32 bg-gradient-to-br ${DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  <div className="relative z-10 text-center">
                    <GraduationCap className="h-12 w-12 text-white mx-auto mb-2" />
                    <p className="text-white/90 text-sm font-medium">{dept.code}</p>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                  <CardDescription>Click to view years and sections</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
