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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmployee, getDepartments } from "@/lib/actions/employees";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Department } from "@/lib/models/types";

export function AddEmployeeDialog({
  children,
  onSuccess,
}: {
  children: React.ReactNode;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  useEffect(() => {
    const fetchDepartments = async () => {
      const result = await getDepartments();
      if (result.success && result.data) {
        setDepartments(result.data);
      }
    };
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedDepartment) {
      setError("Please select a department");
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createEmployee({
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
        setOpen(false);
        setSelectedDepartment("");
        router.refresh();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error || "Failed to create employee");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
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
              placeholder="e.g., Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              className="bg-secondary"
              placeholder="+1 234 567 890"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
