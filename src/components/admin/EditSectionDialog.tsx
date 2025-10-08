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

interface EditSectionDialogProps {
  section: any;
  colleges: any[];
  departments: any[];
  years: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditSectionDialog = ({
  section,
  colleges,
  departments,
  years,
  open,
  onOpenChange,
  onSuccess,
}: EditSectionDialogProps) => {
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [yearId, setYearId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredDepartments = departments.filter(d => d.college_id === collegeId);
  const filteredYears = years.filter(y => y.department_id === departmentId);

  useEffect(() => {
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
      setName(section.name || "");
    }
  }, [section, years, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("sections")
        .update({
          year_id: yearId,
          name,
        })
        .eq("id", section.id);

      if (error) throw error;

      toast.success("Section updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>Update section information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-section-college">College</Label>
            <Select value={collegeId} onValueChange={setCollegeId} required>
              <SelectTrigger id="edit-section-college">
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
            <Label htmlFor="edit-section-dept">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} required disabled={!collegeId}>
              <SelectTrigger id="edit-section-dept">
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
            <Label htmlFor="edit-section-year">Year</Label>
            <Select value={yearId} onValueChange={setYearId} required disabled={!departmentId}>
              <SelectTrigger id="edit-section-year">
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
            <Label htmlFor="edit-section-name">Section Name</Label>
            <Input
              id="edit-section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
