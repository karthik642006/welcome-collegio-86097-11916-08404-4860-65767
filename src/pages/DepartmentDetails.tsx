import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";

type Year = {
  id: string;
  year_number: number;
};

type Section = {
  id: string;
  name: string;
  year_id: string;
};

const DepartmentDetails = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<any>(null);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentData();
  }, [departmentId]);

  useEffect(() => {
    if (selectedYear) {
      fetchSections(selectedYear);
    }
  }, [selectedYear]);

  const fetchDepartmentData = async () => {
    try {
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("*")
        .eq("id", departmentId)
        .single();

      if (deptError) throw deptError;
      setDepartment(deptData);

      const { data: yearsData, error: yearsError } = await supabase
        .from("years")
        .select("*")
        .eq("department_id", departmentId)
        .order("year_number");

      if (yearsError) throw yearsError;
      setYears(yearsData || []);
    } catch (error: any) {
      toast.error("Failed to load department data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (yearId: string) => {
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
    }
  };

  const handleSectionClick = (sectionId: string) => {
    navigate(`/attendance/${sectionId}`);
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
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Departments
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {department && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{department.name}</h1>
            <p className="text-muted-foreground text-lg">{department.code}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Year Selection */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Select Year</h2>
            {years.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No years configured for this department</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {years.map((year) => (
                  <Card
                    key={year.id}
                    className={`cursor-pointer hover:shadow-[var(--shadow-medium)] transition-all ${
                      selectedYear === year.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedYear(year.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-lg">Year {year.year_number}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section Selection */}
          {selectedYear && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Select Section</h2>
              {sections.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No sections configured for this year</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sections.map((section) => (
                    <Card
                      key={section.id}
                      className="cursor-pointer hover:shadow-[var(--shadow-medium)] transition-all hover:-translate-y-1"
                      onClick={() => handleSectionClick(section.id)}
                    >
                      <CardContent className="p-6 text-center">
                        <p className="font-bold text-2xl text-primary">Section {section.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DepartmentDetails;
