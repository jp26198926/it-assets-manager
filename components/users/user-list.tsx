"use client";

import { useState, useTransition } from "react";
import { UserSerialized } from "@/lib/models/types";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, UserCheck, UserX, Plus } from "lucide-react";
import { deleteUser, toggleUserStatus, getUsers } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";
import { EditUserDialog } from "./edit-user-dialog";
import { AddUserDialog } from "./add-user-dialog";
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
import { format } from "date-fns";

const roleVariants: Record<
  string,
  "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  admin: "destructive",
  manager: "info",
  technician: "warning",
  employee: "secondary",
};

const statusVariants: Record<string, "success" | "secondary"> = {
  active: "success",
  inactive: "secondary",
};

interface UserListProps {
  initialUsers: UserSerialized[];
}

export function UserList({ initialUsers }: UserListProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserSerialized[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<UserSerialized | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (
    newSearch: string,
    newRole: string,
    newStatus: string,
  ) => {
    startTransition(async () => {
      const result = await getUsers();
      if (result.success && result.data) {
        let filtered = result.data;

        // Apply search filter
        if (newSearch) {
          filtered = filtered.filter(
            (user) =>
              user.name.toLowerCase().includes(newSearch.toLowerCase()) ||
              user.username.toLowerCase().includes(newSearch.toLowerCase()) ||
              user.email.toLowerCase().includes(newSearch.toLowerCase()),
          );
        }

        // Apply role filter
        if (newRole !== "all") {
          filtered = filtered.filter((user) => user.role === newRole);
        }

        // Apply status filter
        if (newStatus !== "all") {
          const isActive = newStatus === "active";
          filtered = filtered.filter((user) => user.isActive === isActive);
        }

        setUsers(filtered);
      }
    });
  };

  const handleRefresh = async () => {
    handleFilterChange(search, roleFilter, statusFilter);
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;

    setLoading(true);
    try {
      const result = await deleteUser(deletingUserId);
      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        handleRefresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
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
      setDeletingUserId(null);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    setLoading(true);
    try {
      const result = await toggleUserStatus(userId);
      if (result.success) {
        toast({
          title: "Success",
          description: "User status updated successfully",
        });
        handleRefresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user status",
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

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (user: UserSerialized) => (
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (user: UserSerialized) => (
        <span className="text-sm">{user.email}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "role",
      header: "Role",
      cell: (user: UserSerialized) => (
        <StatusBadge variant={roleVariants[user.role] || "secondary"}>
          {user.role}
        </StatusBadge>
      ),
    },
    {
      key: "employeeId",
      header: "Employee ID",
      cell: (user: UserSerialized) => (
        <span className="text-sm text-muted-foreground">
          {user.employeeId || "-"}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (user: UserSerialized) => (
        <StatusBadge variant={user.isActive ? "success" : "secondary"}>
          {user.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (user: UserSerialized) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(user.createdAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "",
      cell: (user: UserSerialized) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(user._id)}
            disabled={loading}
            title={user.isActive ? "Deactivate" : "Activate"}
          >
            {user.isActive ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingUser(user)}
            disabled={loading}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingUserId(user._id)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-[150px]",
    },
  ];

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                handleFilterChange(search, value, statusFilter);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                handleFilterChange(search, roleFilter, value);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search by name, username, or email..."
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            handleFilterChange(value, roleFilter, statusFilter);
          }}
          emptyMessage={isPending ? "Loading..." : "No users found"}
        />
      </div>

      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          setAddDialogOpen(false);
          handleRefresh();
        }}
      />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            handleRefresh();
          }}
        />
      )}

      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account.
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
