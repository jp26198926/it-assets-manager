import type { ObjectId } from "mongodb";

export type UserRole = "admin" | "manager" | "employee" | "technician";

export interface Permission {
  resource: string;
  actions: string[]; // e.g., ['create', 'read', 'update', 'delete']
}

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string; // hashed
  role: UserRole;
  name: string;
  employeeId?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: "users", actions: ["create", "read", "update", "delete"] },
    { resource: "inventory", actions: ["create", "read", "update", "delete"] },
    { resource: "tickets", actions: ["create", "read", "update", "delete"] },
    { resource: "issuance", actions: ["create", "read", "update", "delete"] },
    {
      resource: "departments",
      actions: ["create", "read", "update", "delete"],
    },
    { resource: "employees", actions: ["create", "read", "update", "delete"] },
    { resource: "knowledge", actions: ["create", "read", "update", "delete"] },
    { resource: "reports", actions: ["read"] },
  ],
  manager: [
    { resource: "inventory", actions: ["create", "read", "update"] },
    { resource: "tickets", actions: ["create", "read", "update"] },
    { resource: "issuance", actions: ["create", "read", "update"] },
    { resource: "departments", actions: ["read"] },
    { resource: "employees", actions: ["read"] },
    { resource: "knowledge", actions: ["create", "read", "update"] },
    { resource: "reports", actions: ["read"] },
  ],
  employee: [
    { resource: "inventory", actions: ["read"] },
    { resource: "tickets", actions: ["create", "read"] },
    { resource: "issuance", actions: ["read"] },
    { resource: "departments", actions: ["read"] },
    { resource: "employees", actions: ["read"] },
    { resource: "knowledge", actions: ["read"] },
  ],
  technician: [
    { resource: "inventory", actions: ["read", "update"] },
    { resource: "tickets", actions: ["create", "read", "update"] },
    { resource: "issuance", actions: ["create", "read", "update"] },
    { resource: "departments", actions: ["read"] },
    { resource: "employees", actions: ["read"] },
    { resource: "categories", actions: ["read"] },
    { resource: "knowledge", actions: ["create", "read", "update"] },
    { resource: "reports", actions: ["read"] },
  ],
};

// Helper function to check if a user has permission
export function hasPermission(
  role: UserRole,
  resource: string,
  action: string,
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  const resourcePermission = permissions.find((p) => p.resource === resource);
  return resourcePermission?.actions.includes(action) ?? false;
}
