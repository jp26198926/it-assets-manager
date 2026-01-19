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

// Get basePath from environment or default to empty string
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long",
  cookieName: "ticketing_session",
  cookieOptions: {
    // For Apache reverse proxy, use env var to control secure flag
    // Set COOKIE_SECURE=false if Apache handles HTTPS but forwards HTTP to app
    secure: process.env.COOKIE_SECURE === "true" || false,
    httpOnly: true,
    sameSite: "lax" as const,
    path: basePath || "/", // Use basePath if set, otherwise "/"
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

export async function register(data: {
  username: string;
  email: string;
  password: string;
  name: string;
}) {
  try {
    const { db } = await connectToDatabase();

    // Validate input
    if (!data.username || !data.email || !data.password || !data.name) {
      return { success: false, error: "All fields are required" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate username length
    if (data.username.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters long",
      };
    }

    // Validate password length
    if (data.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    // Check if username already exists
    const existingUsername = await db
      .collection<User>("users")
      .findOne({ username: data.username });
    if (existingUsername) {
      return { success: false, error: "Username already exists" };
    }

    // Check if email already exists
    const existingEmail = await db
      .collection<User>("users")
      .findOne({ email: data.email });
    if (existingEmail) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new user with employee role by default
    const newUser: User = {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: "employee", // Default role for new registrations
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>("users").insertOne(newUser);

    if (!result.insertedId) {
      return { success: false, error: "Failed to create user" };
    }

    // Automatically log in the user after registration
    const session = await getSession();
    session.userId = result.insertedId.toString();
    session.username = newUser.username;
    session.email = newUser.email;
    session.role = newUser.role;
    session.name = newUser.name;
    session.isLoggedIn = true;
    await session.save();

    return {
      success: true,
      user: {
        id: result.insertedId.toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An error occurred during registration" };
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
