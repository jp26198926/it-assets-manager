"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddDepartmentDialog } from "./add-department-dialog";
import { DepartmentList } from "./department-list";
import { getDepartments } from "@/lib/actions/employees";
import { getCurrentUser } from "@/lib/actions/auth";
import { hasPermission } from "@/lib/models/User";
import type { Department } from "@/lib/models/types";

interface DepartmentsPageContentProps {
  initialDepartments: Department[];
}

export function DepartmentsPageContent({
  initialDepartments,
}: DepartmentsPageContentProps) {
  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);
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
    const result = await getDepartments();
    if (result.success && result.data) {
      setDepartments(result.data);
    }
  };

  const canCreate =
    userRole && hasPermission(userRole as any, "departments", "create");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">
            Manage organizational departments
          </p>
        </div>
        {canCreate && (
          <AddDepartmentDialog onSuccess={handleRefresh}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </AddDepartmentDialog>
        )}
      </div>

      <DepartmentList
        initialDepartments={departments}
        onDepartmentChange={handleRefresh}
        userRole={userRole}
      />
    </div>
  );
}
