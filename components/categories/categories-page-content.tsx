"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddCategoryDialog } from "./add-category-dialog";
import { CategoryList } from "./category-list";
import { getCategories } from "@/lib/actions/categories";
import type { CategorySerialized } from "@/lib/models/types";

interface CategoriesPageContentProps {
  initialCategories: CategorySerialized[];
}

export function CategoriesPageContent({
  initialCategories,
}: CategoriesPageContentProps) {
  const [categories, setCategories] =
    useState<CategorySerialized[]>(initialCategories);

  const handleRefresh = async () => {
    const result = await getCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage asset and ticket categories
          </p>
        </div>
        <AddCategoryDialog onSuccess={handleRefresh}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </AddCategoryDialog>
      </div>

      <CategoryList
        initialCategories={categories}
        onCategoryChange={handleRefresh}
      />
    </div>
  );
}
