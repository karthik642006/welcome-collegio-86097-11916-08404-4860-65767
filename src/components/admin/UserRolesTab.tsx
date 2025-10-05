import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, UserPlus, UserMinus } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface UserRolesTabProps {
  userRoles: UserRole[];
  onRefresh: () => void;
}

export const UserRolesTab = ({ userRoles, onRefresh }: UserRolesTabProps) => {
  const [email, setEmail] = useState("");
  const [roleType, setRoleType] = useState<"admin" | "staff">("staff");
  const [removeEmail, setRemoveEmail] = useState("");
  const [removeRole, setRemoveRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const functionName = roleType === "admin" ? "add_admin_role" : "add_staff_role";
      const { error } = await supabase.rpc(functionName, { user_email: email });

      if (error) throw error;

      toast.success(`${roleType} role added successfully!`);
      setEmail("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || `Failed to add ${roleType} role`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.rpc("remove_user_role", {
        user_email: removeEmail,
        role_name: removeRole,
      });

      if (error) throw error;

      toast.success("Role removed successfully!");
      setRemoveEmail("");
      setRemoveRole("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Grant Access
          </CardTitle>
          <CardDescription>
            Add admin or staff access to users by their email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">User Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-type">Role Type</Label>
              <Select value={roleType} onValueChange={(value: "admin" | "staff") => setRoleType(value)}>
                <SelectTrigger id="role-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="staff">Staff (Limited Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Grant Access"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Revoke Access
          </CardTitle>
          <CardDescription>Remove admin or staff access from users</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRemoveRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remove-email">User Email</Label>
              <Input
                id="remove-email"
                type="email"
                placeholder="user@example.com"
                value={removeEmail}
                onChange={(e) => setRemoveEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remove-role">Role to Remove</Label>
              <Select value={removeRole} onValueChange={setRemoveRole} required>
                <SelectTrigger id="remove-role">
                  <SelectValue placeholder="Select role to remove" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Removing..." : "Revoke Access"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current User Roles
          </CardTitle>
          <CardDescription>Users with admin or staff access</CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length > 0 ? (
            <div className="space-y-2">
              {userRoles.map((role) => (
                <div
                  key={role.id}
                  className="p-3 bg-muted rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium capitalize">{role.role}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(role.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No user roles assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
