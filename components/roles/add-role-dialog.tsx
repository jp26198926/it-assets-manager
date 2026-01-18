"use client";

import { useState } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createRole } from "@/lib/actions/roles";
import { AVAILABLE_RESOURCES, AVAILABLE_ACTIONS } from "@/lib/models/Role";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z][a-z0-9-]*$/,
      "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      actions: z.array(z.string()),
    }),
  ),
});

type FormData = z.infer<typeof formSchema>;

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddRoleDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddRoleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, string[]>
  >({});

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      permissions: [],
    },
  });

  const handlePermissionToggle = (resource: string, action: string) => {
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

      const result = await createRole({
        ...data,
        permissions,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        form.reset();
        setSelectedPermissions({});
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create role",
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

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    if (!form.getValues("slug")) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Role</DialogTitle>
          <DialogDescription>
            Create a new role with custom permissions
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="content-editor" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unique identifier (lowercase, hyphens allowed)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAllForResource(resource)}
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </Button>
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
                {loading ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
