"use server";

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import type { User, UserRole } from "@/lib/models/User";

export interface SessionData {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  isLoggedIn: boolean;
}

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long",
  cookieName: "ticketing_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function login(username: string, password: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection<User>("users").findOne({
      $or: [{ username }, { email: username }],
      isActive: true,
    });

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Update last login
    await db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Create session
    const session = await getSession();
    session.userId = user._id!.toString();
    session.username = user.username;
    session.email = user.email;
    session.role = user.role;
    session.name = user.name;
    session.isLoggedIn = true;
    await session.save();

    return {
      success: true,
      user: {
        id: user._id!.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

export async function logout() {
  try {
    const session = await getSession();
    session.destroy();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An error occurred during logout" };
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return null;
    }

    return {
      id: session.userId,
      username: session.username,
      email: session.email,
      role: session.role,
      name: session.name,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return user;
}

// Get all active users for ticket assignment
export async function getTechniciansAndAdmins() {
  try {
    const { db } = await connectToDatabase();
    const users = await db
      .collection<User>("users")
      .find({
        isActive: true,
      })
      .sort({ name: 1 })
      .toArray();

    // Serialize for client components
    return {
      success: true,
      data: users.map((user) => ({
        _id: user._id!.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}
