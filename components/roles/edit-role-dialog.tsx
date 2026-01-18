"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { updateRole } from "@/lib/actions/roles";
import { AVAILABLE_RESOURCES, AVAILABLE_ACTIONS } from "@/lib/models/Role";
import { RoleSerialized } from "@/lib/models/types";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      actions: z.array(z.string()),
    }),
  ),
});

type FormData = z.infer<typeof formSchema>;

interface EditRoleDialogProps {
  role: RoleSerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRoleDialog({
  role,
  open,
  onOpenChange,
  onSuccess,
}: EditRoleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, string[]>
  >({});

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    },
  });

  // Initialize permissions from role
  useEffect(() => {
    const permissionsMap: Record<string, string[]> = {};
    role.permissions.forEach((perm) => {
      permissionsMap[perm.resource] = perm.actions;
    });
    setSelectedPermissions(permissionsMap);
  }, [role]);

  const handlePermissionToggle = (resource: string, action: string) => {
    if (role.isSystem) return; // Cannot modify system role permissions

    setSelectedPermissions((prev) => {
      const current = prev[resource] || [];
      const updated = current.includes(action)
        ? current.filter((a) => a !== action)
        : [...current, action];

      return {
        ...prev,
        [resource]: updated,
      };
    });
  };

  const handleSelectAllForResource = (resource: string) => {
    if (role.isSystem) return;

    setSelectedPermissions((prev) => {
      const current = prev[resource] || [];
      const allSelected = current.length === AVAILABLE_ACTIONS.length;

      return {
        ...prev,
        [resource]: allSelected ? [] : [...AVAILABLE_ACTIONS],
      };
    });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Convert selected permissions to array format
      const permissions = Object.entries(selectedPermissions)
        .filter(([_, actions]) => actions.length > 0)
        .map(([resource, actions]) => ({
          resource,
          actions,
        }));

      if (permissions.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one permission",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const updateData = role.isSystem
        ? { description: data.description }
        : { name: data.name, description: data.description, permissions };

      const result = await updateRole(role._id, updateData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Role: {role.name}
            {role.isSystem && (
              <Badge variant="outline" className="ml-2">
                System Role
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {role.isSystem
              ? "System roles cannot be deleted. You can only modify the description."
              : "Update role details and permissions"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Content Editor"
                      {...field}
                      disabled={role.isSystem}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Role description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Permissions</h3>
              {role.isSystem && (
                <p className="text-sm text-muted-foreground">
                  System role permissions cannot be modified
                </p>
              )}
              <div className="rounded-lg border p-4 space-y-4">
                {AVAILABLE_RESOURCES.map((resource) => {
                  const resourcePermissions =
                    selectedPermissions[resource] || [];
                  const allSelected =
                    resourcePermissions.length === AVAILABLE_ACTIONS.length;

                  return (
                    <div key={resource} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">{resource}</h4>
                        {!role.isSystem && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectAllForResource(resource)}
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {AVAILABLE_ACTIONS.map((action) => (
                          <div
                            key={action}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${resource}-${action}`}
                              checked={resourcePermissions.includes(action)}
                              onCheckedChange={() =>
                                handlePermissionToggle(resource, action)
                              }
                              disabled={role.isSystem}
                            />
                            <label
                              htmlFor={`${resource}-${action}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                            >
                              {action}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
