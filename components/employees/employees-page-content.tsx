"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import type { EmployeeWithDepartmentSerialized } from "@/lib/models/types";
import { EmployeeList } from "./employee-list";
import { AddEmployeeDialog } from "./add-employee-dialog";
import { getEmployees } from "@/lib/actions/employees";
import { useState, useEffect } from "react";
import { getUserProfile } from "@/lib/actions/user";
import { hasPermission } from "@/lib/models/User";

export function EmployeesPageContent({
  initialEmployees,
}: {
  initialEmployees: EmployeeWithDepartmentSerialized[];
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const result = await getUserProfile();
      if (result.success && result.data) {
        setUserRole(result.data.role);
      }
    };
    fetchUserRole();
  }, []);

  const canCreate =
    userRole && hasPermission(userRole as any, "employees", "create");

  const handleAddSuccess = async () => {
    // Refresh the employee list after successful creation
    const filtered = await getEmployees();
    setEmployees(filtered);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employees for asset issuance"
        actions={
          canCreate ? (
            <AddEmployeeDialog onSuccess={handleAddSuccess}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </AddEmployeeDialog>
          ) : undefined
        }
      />

      <EmployeeList initialEmployees={employees} userRole={userRole} />
    </div>
  );
}
