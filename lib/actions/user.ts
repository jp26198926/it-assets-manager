"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import type { User } from "@/lib/models/User";
import { getSession } from "./auth";

export async function updateUserProfile(data: {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const { db } = await connectToDatabase();

    // Validate input
    if (!data.name || !data.email) {
      return { success: false, error: "Name and email are required" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Get current user
    const currentUser = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(session.userId) });

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Check if email is being changed and if it's already taken
    if (data.email !== currentUser.email) {
      const existingEmail = await db
        .collection<User>("users")
        .findOne({ email: data.email, _id: { $ne: currentUser._id } });
      if (existingEmail) {
        return { success: false, error: "Email already in use" };
      }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      updatedAt: new Date(),
    };

    // Handle password change
    if (data.newPassword && data.currentPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        data.currentPassword,
        currentUser.password,
      );
      if (!isPasswordValid) {
        return { success: false, error: "Current password is incorrect" };
      }

      // Hash new password
      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    // Update user
    await db
      .collection<User>("users")
      .updateOne({ _id: currentUser._id }, { $set: updateData });

    // Update session if email or name changed
    if (data.email !== currentUser.email || data.name !== currentUser.name) {
      session.email = data.email;
      session.name = data.name;
      await session.save();
    }

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      error: "An error occurred while updating profile",
    };
  }
}

export async function getUserProfile() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const { db } = await connectToDatabase();
    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(session.userId) });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: {
        id: user._id!.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    };
  } catch (error) {
    console.error("Get profile error:", error);
    return {
      success: false,
      error: "An error occurred while fetching profile",
    };
  }
}
