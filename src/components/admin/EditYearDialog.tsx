import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditYearDialogProps {
  year: any;
  colleges: any[];
  departments: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditYearDialog = ({
  year,
  colleges,
  departments,
  open,
  onOpenChange,
  onSuccess,
}: EditYearDialogProps) => {
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [yearNumber, setYearNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredDepartments = departments.filter(d => d.college_id === collegeId);

  useEffect(() => {
    if (year) {
      const dept = departments.find(d => d.id === year.department_id);
      if (dept) {
        setCollegeId(dept.college_id || "");
      }
      setDepartmentId(year.department_id || "");
      setYearNumber(year.year_number?.toString() || "");
    }
  }, [year, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("years")
        .update({
          department_id: departmentId,
          year_number: parseInt(yearNumber),
        })
        .eq("id", year.id);

      if (error) throw error;

      toast.success("Year updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update year");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Year</DialogTitle>
          <DialogDescription>Update year information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-year-college">College</Label>
            <Select value={collegeId} onValueChange={setCollegeId} required>
              <SelectTrigger id="edit-year-college">
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
            <Label htmlFor="edit-year-dept">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId} required disabled={!collegeId}>
              <SelectTrigger id="edit-year-dept">
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
            <Label htmlFor="edit-year-num">Year Number</Label>
            <Select value={yearNumber} onValueChange={setYearNumber} required>
              <SelectTrigger id="edit-year-num">
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
