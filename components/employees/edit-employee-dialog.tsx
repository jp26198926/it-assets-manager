"use client";

import type React from "react";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEmployee, getDepartments } from "@/lib/actions/employees";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  Department,
  EmployeeWithDepartmentSerialized,
} from "@/lib/models/types";

export function EditEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: {
  employee: EmployeeWithDepartmentSerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    employee.departmentId?.toString() || ""
  );

  useEffect(() => {
    const fetchDepartments = async () => {
      const result = await getDepartments();
      if (result.success && result.data) {
        setDepartments(result.data);
      }
    };
    if (open) {
      fetchDepartments();
      setSelectedDepartment(employee.departmentId?.toString() || "");
    }
  }, [open, employee.departmentId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedDepartment) {
      setError("Please select a department");
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateEmployee(employee._id?.toString() || "", {
        employeeId: formData.get("employeeId") as string,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        middleName: formData.get("middleName") as string,
        email: formData.get("email") as string,
        departmentId: selectedDepartment,
        position: formData.get("position") as string,
        phone: formData.get("phone") as string,
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || "Failed to update employee");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <Input
              id="employeeId"
              name="employeeId"
              required
              className="bg-secondary"
              placeholder="e.g., EMP001"
              defaultValue={employee.employeeId}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                className="bg-secondary"
                placeholder="John"
                defaultValue={employee.firstName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                className="bg-secondary"
                placeholder="Doe"
                defaultValue={employee.lastName}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              name="middleName"
              className="bg-secondary"
              placeholder="Optional"
              defaultValue={employee.middleName || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="bg-secondary"
              placeholder="john@company.com"
              defaultValue={employee.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              required
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No departments available
                  </div>
                ) : (
                  departments.map((dept) => (
                    <SelectItem
                      key={dept._id?.toString()}
                      value={dept._id?.toString() || ""}
                    >
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              className="bg-secondary"
              placeholder="Software Engineer"
              defaultValue={employee.position || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              className="bg-secondary"
              placeholder="+1234567890"
              defaultValue={employee.phone || ""}
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
