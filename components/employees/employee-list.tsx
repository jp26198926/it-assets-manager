"use client";

import { useState, useTransition, useEffect } from "react";
import type { EmployeeWithDepartmentSerialized } from "@/lib/models/types";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getEmployees, deleteEmployee } from "@/lib/actions/employees";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { AddEmployeeDialog } from "./add-employee-dialog";
import { format } from "date-fns";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/models/User";

export function EmployeeList({
  initialEmployees,
  userRole,
}: {
  initialEmployees: EmployeeWithDepartmentSerialized[];
  userRole: string | null;
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editEmployee, setEditEmployee] =
    useState<EmployeeWithDepartmentSerialized | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local state when initialEmployees prop changes
  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    startTransition(async () => {
      const filtered = await getEmployees(value || undefined);
      setEmployees(filtered);
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const result = await deleteEmployee(deleteId);
    if (result.success) {
      setDeleteId(null);
      router.refresh();
      const filtered = await getEmployees(search || undefined);
      setEmployees(filtered);
    }
    setIsDeleting(false);
  };

  const handleEditSuccess = async () => {
    // Refresh the employee list after successful update
    const filtered = await getEmployees(search || undefined);
    setEmployees(filtered);
    setEditEmployee(null);
  };

  const handleAddSuccess = async () => {
    // Refresh the employee list after successful creation
    const filtered = await getEmployees(search || undefined);
    setEmployees(filtered);
  };

  const canUpdate =
    userRole && hasPermission(userRole as any, "employees", "update");
  const canDelete =
    userRole && hasPermission(userRole as any, "employees", "delete");

  const columns = [
    {
      key: "employeeId",
      header: "Employee ID",
      cell: (employee: EmployeeWithDepartmentSerialized) => (
        <span className="font-mono text-sm">{employee.employeeId}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (employee: EmployeeWithDepartmentSerialized) => {
        const fullName = [
          employee.lastName,
          employee.firstName,
          employee.middleName,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <div>
            <p className="font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">{employee.email}</p>
          </div>
        );
      },
    },
    {
      key: "department",
      header: "Department",
      cell: (employee: EmployeeWithDepartmentSerialized) => (
        <div>
          {employee.department ? (
            <Badge variant="secondary" className="neo-flat">
              {employee.department.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">No department</span>
          )}
        </div>
      ),
    },
    {
      key: "position",
      header: "Position",
      cell: (employee: EmployeeWithDepartmentSerialized) =>
        employee.position || "-",
      className: "hidden md:table-cell",
    },
    {
      key: "phone",
      header: "Phone",
      cell: (employee: EmployeeWithDepartmentSerialized) =>
        employee.phone || "-",
      className: "hidden lg:table-cell",
    },
    {
      key: "createdAt",
      header: "Added",
      cell: (employee: EmployeeWithDepartmentSerialized) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(employee.createdAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    ...(canUpdate || canDelete
      ? [
          {
            key: "actions",
            header: "Actions",
            cell: (employee: EmployeeWithDepartmentSerialized) => (
              <div className="flex items-center gap-2">
                {canUpdate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditEmployee(employee)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDeleteId(employee._id?.toString() || null)
                    }
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        data={employees}
        columns={columns}
        searchPlaceholder="Search by name, ID, or email..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        emptyMessage={isPending ? "Loading..." : "No employees found"}
      />

      {editEmployee && (
        <EditEmployeeDialog
          employee={editEmployee}
          open={!!editEmployee}
          onOpenChange={(open) => {
            if (!open) setEditEmployee(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
