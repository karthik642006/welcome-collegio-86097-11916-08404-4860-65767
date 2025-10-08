import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditStudentDialogProps {
  student: any;
  colleges: any[];
  departments: any[];
  years: any[];
  sections: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditStudentDialog = ({
  student,
  colleges,
  departments,
  years,
  sections,
  open,
  onOpenChange,
  onSuccess,
}: EditStudentDialogProps) => {
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [yearId, setYearId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredDepartments = departments.filter(d => d.college_id === collegeId);
  const filteredYears = years.filter(y => y.department_id === departmentId);
  const filteredSections = sections.filter(s => s.year_id === yearId);

  useEffect(() => {
    if (student) {
      const section = sections.find(s => s.id === student.section_id);
      if (section) {
        const year = years.find(y => y.id === section.year_id);
        if (year) {
          const dept = departments.find(d => d.id === year.department_id);
          if (dept) {
            setCollegeId(dept.college_id || "");
          }
          setDepartmentId(year.department_id || "");
        }
        setYearId(section.year_id || "");
      }
      setSectionId(student.section_id || "");
      setName(student.name || "");
      setRollNumber(student.roll_number || "");
      setEmail(student.email || "");
      setGender(student.gender || "");
    }
  }, [student, sections, years, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          section_id: sectionId,
          name,
          roll_number: rollNumber,
          email: email || null,
          gender,
        })
        .eq("id", student.id);

      if (error) throw error;

      toast.success("Student updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update student information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-student-college">College</Label>
            <Select value={collegeId} onValueChange={setCollegeId} required>
              <SelectTrigger id="edit-student-college">
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
            <Label htmlFor="edit-student-dept">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} required disabled={!collegeId}>
              <SelectTrigger id="edit-student-dept">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {filteredDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-student-year">Year</Label>
            <Select value={yearId} onValueChange={setYearId} required disabled={!departmentId}>
              <SelectTrigger id="edit-student-year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {filteredYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    Year {year.year_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-student-section">Section</Label>
            <Select value={sectionId} onValueChange={setSectionId} required disabled={!yearId}>
              <SelectTrigger id="edit-student-section">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {filteredSections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-student-roll">Roll Number</Label>
            <Input
              id="edit-student-roll"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-student-name">Student Name</Label>
            <Input
              id="edit-student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-student-email">Email (Optional)</Label>
            <Input
              id="edit-student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-student-gender">Gender</Label>
            <Select value={gender} onValueChange={setGender} required>
              <SelectTrigger id="edit-student-gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
