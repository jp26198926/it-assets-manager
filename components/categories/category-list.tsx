"use client";

import { useState, useEffect } from "react";
import type { CategorySerialized } from "@/lib/models/types";
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
import { EditCategoryDialog } from "./edit-category-dialog";
import { deleteCategory } from "@/lib/actions/categories";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

interface CategoryListProps {
  initialCategories: CategorySerialized[];
  onCategoryChange?: () => void;
}

export function CategoryList({
  initialCategories,
  onCategoryChange,
}: CategoryListProps) {
  const [categories, setCategories] =
    useState<CategorySerialized[]>(initialCategories);
  const [editingCategory, setEditingCategory] =
    useState<CategorySerialized | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<CategorySerialized | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleEditSuccess = () => {
    onCategoryChange?.();
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    try {
      const result = await deleteCategory(deletingCategory._id);

      if (result.success) {
        toast.success("Category deleted successfully");
        setDeletingCategory(null);
        onCategoryChange?.();
      } else {
        toast.error(result.error || "Failed to delete category");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the category");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Code",
      cell: (cat: CategorySerialized) => (
        <span className="font-mono text-sm">{cat.code}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (cat: CategorySerialized) => (
        <span className="font-medium">{cat.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (cat: CategorySerialized) => (
        <span className="text-muted-foreground">{cat.description || "-"}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (cat: CategorySerialized) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(cat.createdAt), "MMM d, yyyy")}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      header: "",
      cell: (cat: CategorySerialized) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingCategory(cat)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingCategory(cat)}
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
        data={categories}
        columns={columns}
        emptyMessage="No categories found"
      />

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "
              {deletingCategory?.name}". This action cannot be undone.
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
