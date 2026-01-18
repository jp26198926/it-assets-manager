"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddCategoryDialog } from "./add-category-dialog";
import { CategoryList } from "./category-list";
import { getCategories } from "@/lib/actions/categories";
import { getCurrentUser } from "@/lib/actions/auth";
import { hasPermission } from "@/lib/models/User";
import type { CategorySerialized } from "@/lib/models/types";

interface CategoriesPageContentProps {
  initialCategories: CategorySerialized[];
}

export function CategoriesPageContent({
  initialCategories,
}: CategoriesPageContentProps) {
  const [categories, setCategories] =
    useState<CategorySerialized[]>(initialCategories);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserRole(user.role);
      }
    };
    fetchUser();
  }, []);

  const handleRefresh = async () => {
    const result = await getCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  const canCreate =
    userRole && hasPermission(userRole as any, "categories", "create");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage asset and ticket categories
          </p>
        </div>
        {canCreate && (
          <AddCategoryDialog onSuccess={handleRefresh}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </AddCategoryDialog>
        )}
      </div>

      <CategoryList
        initialCategories={categories}
        onCategoryChange={handleRefresh}
        userRole={userRole}
      />
    </div>
  );
}
