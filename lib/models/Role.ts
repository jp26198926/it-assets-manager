import type { ObjectId } from "mongodb";

export interface Role {
  _id?: ObjectId;
  name: string; // e.g., "Admin", "Manager", "Employee", "Technician"
  slug: string; // e.g., "admin", "manager", "employee", "technician"
  description?: string;
  permissions: Permission[];
  isSystem: boolean; // true for default roles (admin, manager, employee)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Permission {
  resource: string; // e.g., "inventory", "tickets", "users"
  actions: string[]; // e.g., ["create", "read", "update", "delete"]
}

// Available resources in the system
export const AVAILABLE_RESOURCES = [
  "users",
  "inventory",
  "tickets",
  "issuance",
  "departments",
  "employees",
  "categories",
  "knowledge",
  "reports",
  "settings",
  "roles",
] as const;

// Available actions
export const AVAILABLE_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
] as const;

export type Resource = (typeof AVAILABLE_RESOURCES)[number];
export type Action = (typeof AVAILABLE_ACTIONS)[number];
