"use client";

import { useState } from "react";
import { RoleSerialized } from "@/lib/models/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, ShieldCheck, ShieldOff, Plus } from "lucide-react";
import { deleteRole, toggleRoleStatus, getRoles } from "@/lib/actions/roles";
import { useToast } from "@/hooks/use-toast";
import { EditRoleDialog } from "./edit-role-dialog";
import { AddRoleDialog } from "./add-role-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RoleListProps {
  initialRoles: RoleSerialized[];
}

export function RoleList({ initialRoles }: RoleListProps) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleSerialized[]>(initialRoles);
  const [editingRole, setEditingRole] = useState<RoleSerialized | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await getRoles();
      if (result.success && result.data) {
        setRoles(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to refresh roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoleId) return;

    setLoading(true);
    try {
      const result = await deleteRole(deletingRoleId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        handleRefresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeletingRoleId(null);
    }
  };

  const handleToggleStatus = async (roleId: string) => {
    setLoading(true);
    try {
      const result = await toggleRoleStatus(roleId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Role status updated successfully",
        });
        handleRefresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update role status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {role.permissions.length} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.isActive ? (
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!role.isSystem && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(role._id)}
                            disabled={loading}
                            title={role.isActive ? "Deactivate" : "Activate"}
                          >
                            {role.isActive ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRole(role)}
                            disabled={loading}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingRoleId(role._id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {role.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingRole(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AddRoleDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          setAddDialogOpen(false);
          handleRefresh();
        }}
      />

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          onSuccess={() => {
            setEditingRole(null);
            handleRefresh();
          }}
        />
      )}

      <AlertDialog
        open={!!deletingRoleId}
        onOpenChange={(open) => !open && setDeletingRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
