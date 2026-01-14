"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddDepartmentDialog } from "./add-department-dialog";
import { DepartmentList } from "./department-list";
import { getDepartments } from "@/lib/actions/employees";
import type { Department } from "@/lib/models/types";

interface DepartmentsPageContentProps {
  initialDepartments: Department[];
}

export function DepartmentsPageContent({
  initialDepartments,
}: DepartmentsPageContentProps) {
  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);

  const handleRefresh = async () => {
    const result = await getDepartments();
    if (result.success && result.data) {
      setDepartments(result.data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">
            Manage organizational departments
          </p>
        </div>
        <AddDepartmentDialog onSuccess={handleRefresh}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </AddDepartmentDialog>
      </div>

      <DepartmentList
        initialDepartments={departments}
        onDepartmentChange={handleRefresh}
      />
    </div>
  );
}
