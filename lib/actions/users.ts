"use server";

import { getDatabase } from "@/lib/mongodb";
import type { User } from "@/lib/models/User";
import { hasPermission } from "@/lib/models/User";
import type { UserSerialized } from "@/lib/models/types";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { requireAuth } from "./auth";

// Helper to serialize user for client
function serializeUser(user: User): UserSerialized {
  return {
    ...user,
    _id: user._id?.toString() || "",
    password: undefined, // Never send password to client
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString(),
  };
}

// Get all users
export async function getUsers(): Promise<{
  success: boolean;
  data?: UserSerialized[];
  error?: string;
}> {
  try {
    const authUser = await requireAuth();
    if (!hasPermission(authUser.role, "users", "read")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const db = await getDatabase();
    const collection = db.collection<User>("users");

    const users = await collection.find({}).sort({ createdAt: -1 }).toArray();

    return {
      success: true,
      data: users.map(serializeUser),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

// Get single user by ID
export async function getUser(id: string): Promise<{
  success: boolean;
  data?: UserSerialized;
  error?: string;
}> {
  try {
    const db = await getDatabase();
    const collection = db.collection<User>("users");

    const user = await collection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: serializeUser(user),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

// Create new user
export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role: string;
  name: string;
  employeeId?: string;
  department?: string;
  createdBy?: string;
}): Promise<{ success: boolean; data?: UserSerialized; error?: string }> {
  try {
    const authUser = await requireAuth();
    if (!hasPermission(authUser.role, "users", "create")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const db = await getDatabase();
    const collection = db.collection<User>("users");

    // Check if username or email already exists
    const existingUser = await collection.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        return { success: false, error: "Username already exists" };
      }
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user: User = {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role as any,
      name: data.name,
      employeeId: data.employeeId,
      department: data.department,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(user);
    const createdUser = await collection.findOne({ _id: result.insertedId });

    if (!createdUser) {
      return { success: false, error: "Failed to create user" };
    }

    revalidatePath("/users");
    return {
      success: true,
      data: serializeUser(createdUser),
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

// Update user
export async function updateUser(
  id: string,
  data: {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    name?: string;
    employeeId?: string;
    department?: string;
    isActive?: boolean;
    updatedBy?: string;
  },
): Promise<{ success: boolean; data?: UserSerialized; error?: string }> {
  try {
    const authUser = await requireAuth();
    if (!hasPermission(authUser.role, "users", "update")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const db = await getDatabase();
    const collection = db.collection<User>("users");

    // Check if user exists
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return { success: false, error: "User not found" };
    }

    // Check if username or email is being changed and already exists
    if (data.username || data.email) {
      const duplicateUser = await collection.findOne({
        _id: { $ne: new ObjectId(id) },
        $or: [
          ...(data.username ? [{ username: data.username }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      });

      if (duplicateUser) {
        if (duplicateUser.username === data.username) {
          return { success: false, error: "Username already exists" };
        }
        return { success: false, error: "Email already exists" };
      }
    }

    const updateData: Partial<User> = {
      ...data,
      role: data.role as any,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await collection.findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return { success: false, error: "Failed to update user" };
    }

    revalidatePath("/users");
    return {
      success: true,
      data: serializeUser(updated),
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

// Delete user
export async function deleteUser(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await requireAuth();
    if (!hasPermission(authUser.role, "users", "delete")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const db = await getDatabase();
    const collection = db.collection<User>("users");

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return { success: false, error: "User not found" };
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

// Toggle user active status
export async function toggleUserStatus(
  id: string,
  updatedBy?: string,
): Promise<{ success: boolean; data?: UserSerialized; error?: string }> {
  try {
    const authUser = await requireAuth();
    if (!hasPermission(authUser.role, "users", "update")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const db = await getDatabase();
    const collection = db.collection<User>("users");

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return { success: false, error: "User not found" };
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: !existing.isActive,
          updatedAt: new Date(),
        },
      },
    );

    const updated = await collection.findOne({ _id: new ObjectId(id) });

    if (!updated) {
      return { success: false, error: "Failed to toggle user status" };
    }

    revalidatePath("/users");
    return {
      success: true,
      data: serializeUser(updated),
    };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: "Failed to toggle user status" };
  }
}
