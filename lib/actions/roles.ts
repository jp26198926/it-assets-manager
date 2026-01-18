"use server";

import { getDatabase } from "@/lib/mongodb";
import type { Role } from "@/lib/models/Role";
import type { RoleSerialized } from "@/lib/models/types";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { requireAuth } from "./auth";
import { hasPermission } from "../models/User";

// Helper to serialize role for client
function serializeRole(role: Role): RoleSerialized {
  return {
    ...role,
    _id: role._id?.toString() || "",
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

// Get all roles
export async function getRoles(): Promise<{
  success: boolean;
  data?: RoleSerialized[];
  error?: string;
}> {
  try {
    const db = await getDatabase();
    console.log("[SERVER] getRoles - Database name:", db.databaseName);
    console.log(
      "[SERVER] getRoles - MongoDB URI (first 50 chars):",
      process.env.MONGODB_URI?.substring(0, 50),
    );

    const collection = db.collection<Role>("roles");

    // List all collections in the database
    const collections = await db.listCollections().toArray();
    console.log(
      "[SERVER] getRoles - Collections in database:",
      collections.map((c) => c.name),
    );

    const roles = await collection.find({}).sort({ name: 1 }).toArray();

    console.log("[SERVER] getRoles - Found roles count:", roles.length);
    if (roles.length > 0) {
      console.log(
        "[SERVER] getRoles - First role:",
        JSON.stringify(roles[0], null, 2),
      );
    }

    return {
      success: true,
      data: roles.map(serializeRole),
    };
  } catch (error) {
    console.error("Error fetching roles:", error);
    return { success: false, error: "Failed to fetch roles" };
  }
}

// Get single role by ID
export async function getRole(id: string): Promise<{
  success: boolean;
  data?: RoleSerialized;
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<Role>("roles");

    const role = await collection.findOne({ _id: new ObjectId(id) });

    if (!role) {
      return { success: false, error: "Role not found" };
    }

    return {
      success: true,
      data: serializeRole(role),
    };
  } catch (error) {
    console.error("Error fetching role:", error);
    return { success: false, error: "Failed to fetch role" };
  }
}

// Create new role
export async function createRole(data: {
  name: string;
  slug: string;
  description?: string;
  permissions: { resource: string; actions: string[] }[];
  createdBy?: string;
}): Promise<{ success: boolean; data?: RoleSerialized; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "create")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<Role>("roles");

    // Check if slug already exists
    const existing = await collection.findOne({ slug: data.slug });
    if (existing) {
      return { success: false, error: "Role with this slug already exists" };
    }

    const role: Role = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      permissions: data.permissions,
      isSystem: false, // Custom roles are not system roles
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
    };

    const result = await collection.insertOne(role);
    const createdRole = await collection.findOne({ _id: result.insertedId });

    if (!createdRole) {
      return { success: false, error: "Failed to create role" };
    }

    revalidatePath("/roles");
    return {
      success: true,
      data: serializeRole(createdRole),
    };
  } catch (error) {
    console.error("Error creating role:", error);
    return { success: false, error: "Failed to create role" };
  }
}

// Update role
export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
    permissions?: { resource: string; actions: string[] }[];
    isActive?: boolean;
    updatedBy?: string;
  },
): Promise<{ success: boolean; data?: RoleSerialized; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<Role>("roles");

    // Check if role exists and is not a system role
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return { success: false, error: "Role not found" };
    }

    if (existing.isSystem) {
      return {
        success: false,
        error: "Cannot modify system roles",
      };
    }

    const updateData: Partial<Role> = {
      ...data,
      updatedAt: new Date(),
    };

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await collection.findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return { success: false, error: "Failed to update role" };
    }

    revalidatePath("/roles");
    return {
      success: true,
      data: serializeRole(updated),
    };
  } catch (error) {
    console.error("Error updating role:", error);
    return { success: false, error: "Failed to update role" };
  }
}

// Delete role
export async function deleteRole(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "delete")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<Role>("roles");

    // Check if role exists and is not a system role
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return { success: false, error: "Role not found" };
    }

    if (existing.isSystem) {
      return {
        success: false,
        error: "Cannot delete system roles",
      };
    }

    // Check if any users have this role
    const usersCollection = db.collection("users");
    const userCount = await usersCollection.countDocuments({
      role: existing.slug,
    });

    if (userCount > 0) {
      return {
        success: false,
        error: `Cannot delete role. ${userCount} user(s) are assigned to this role.`,
      };
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/roles");
    return { success: true };
  } catch (error) {
    console.error("Error deleting role:", error);
    return { success: false, error: "Failed to delete role" };
  }
}

// Toggle role active status
export async function toggleRoleStatus(
  id: string,
  updatedBy?: string,
): Promise<{ success: boolean; data?: RoleSerialized; error?: string }> {
  try {
    const user = await requireAuth();
    if (!hasPermission(user.role, "users", "update")) {
      return { success: false, error: "Unauthorized" };
    }

    const db = await getDatabase();
    const collection = db.collection<Role>("roles");

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return { success: false, error: "Role not found" };
    }

    if (existing.isSystem) {
      return {
        success: false,
        error: "Cannot modify system roles",
      };
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: !existing.isActive,
          updatedAt: new Date(),
          updatedBy,
        },
      },
    );

    const updated = await collection.findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return { success: false, error: "Failed to toggle role status" };
    }

    revalidatePath("/roles");
    return {
      success: true,
      data: serializeRole(updated),
    };
  } catch (error) {
    console.error("Error toggling role status:", error);
    return { success: false, error: "Failed to toggle role status" };
  }
}
