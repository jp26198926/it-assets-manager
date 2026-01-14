"use client";

import { useState, useEffect } from "react";
import type { Department } from "@/lib/models/types";
import { DataTable } from "@/components/ui/data-table";
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
import { EditDepartmentDialog } from "./edit-department-dialog";
import { deleteDepartment } from "@/lib/actions/employees";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

interface DepartmentListProps {
  initialDepartments: Department[];
  onDepartmentChange?: () => void;
}

export function DepartmentList({
  initialDepartments,
  onDepartmentChange,
}: DepartmentListProps) {
  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  const handleEditSuccess = () => {
    onDepartmentChange?.();
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;

    setIsDeleting(true);
    try {
      const result = await deleteDepartment(deletingDepartment._id);

      if (result.success) {
        toast.success("Department deleted successfully");
        setDeletingDepartment(null);
        onDepartmentChange?.();
      } else {
        toast.error(result.error || "Failed to delete department");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the department");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      cell: (dept: Department) => (
        <span className="font-mono text-sm">{dept.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (dept: Department) => (
        <span className="font-medium">{dept.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (dept: Department) => (
        <span className="text-muted-foreground">{dept.description || "-"}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (dept: Department) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(dept.createdAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "",
      cell: (dept: Department) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingDepartment(dept)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingDepartment(dept)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={departments}
        columns={columns}
        emptyMessage="No departments found"
      />

      {editingDepartment && (
        <EditDepartmentDialog
          department={editingDepartment}
          open={!!editingDepartment}
          onOpenChange={(open) => !open && setEditingDepartment(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog
        open={!!deletingDepartment}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department "
              {deletingDepartment?.name}". This action cannot be undone.
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
