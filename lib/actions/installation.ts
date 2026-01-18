"use server";

import { MongoClient } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { User } from "@/lib/models/User";
import { ROLE_PERMISSIONS } from "@/lib/models/User";

export async function checkEnvironmentVariables() {
  try {
    const requiredVars = ["MONGODB_URI", "SESSION_SECRET"];

    const missingVars: string[] = [];
    const presentVars: string[] = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      } else {
        presentVars.push(varName);
      }
    }

    return {
      success: true,
      allPresent: missingVars.length === 0,
      missingVars,
      presentVars,
    };
  } catch (error) {
    console.error("Error checking environment variables:", error);
    return {
      success: false,
      error: "Failed to check environment variables",
    };
  }
}

export async function checkDatabaseConnection(uri?: string) {
  try {
    const connectionUri = uri || process.env.MONGODB_URI;

    if (!connectionUri) {
      return {
        success: false,
        error: "No database URI provided",
      };
    }

    const client = new MongoClient(connectionUri, {
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    await client.db().admin().ping();
    await client.close();

    return {
      success: true,
      message: "Successfully connected to database",
    };
  } catch (error: any) {
    console.error("Database connection error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to database",
    };
  }
}

export async function checkLocalMongoDB() {
  try {
    const localUris = [
      "mongodb://localhost:27017",
      "mongodb://127.0.0.1:27017",
    ];

    for (const uri of localUris) {
      const result = await checkDatabaseConnection(uri);
      if (result.success) {
        return {
          success: true,
          uri,
          message: "Local MongoDB detected",
        };
      }
    }

    return {
      success: false,
      message: "No local MongoDB instance found",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to check for local MongoDB",
    };
  }
}

export async function checkInstallationStatus() {
  try {
    // Check if database connection works
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.success) {
      return {
        installed: false,
        step: "database",
        message: "Database connection required",
      };
    }

    // Check if users exist
    const { db } = await connectToDatabase();
    const usersCount = await db.collection("users").countDocuments();

    if (usersCount === 0) {
      return {
        installed: false,
        step: "seed",
        message: "Database needs to be seeded",
      };
    }

    return {
      installed: true,
      message: "System is installed and configured",
    };
  } catch (error) {
    console.error("Error checking installation status:", error);
    return {
      installed: false,
      step: "database",
      message: "Installation required",
    };
  }
}

export async function seedDefaultRoles() {
  try {
    const { db } = await connectToDatabase();
    const rolesCollection = db.collection("roles");

    // Clear existing roles
    await rolesCollection.deleteMany({});

    // Insert default roles based on ROLE_PERMISSIONS
    const roles = Object.entries(ROLE_PERMISSIONS).map(
      ([role, permissions]) => ({
        name: role,
        permissions,
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await rolesCollection.insertMany(roles);

    return {
      success: true,
      message: `Successfully seeded ${roles.length} default roles`,
      count: roles.length,
    };
  } catch (error) {
    console.error("Error seeding roles:", error);
    return {
      success: false,
      error: "Failed to seed default roles",
    };
  }
}

export async function seedDefaultUsers(adminData: {
  username: string;
  email: string;
  password: string;
  name: string;
}) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>("users");

    // Check if users already exist
    const existingUsers = await usersCollection.countDocuments();
    if (existingUsers > 0) {
      return {
        success: false,
        error: "Users already exist in the database",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin user
    const adminUser: Omit<User, "_id"> = {
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      role: "admin",
      name: adminData.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(adminUser as User);

    return {
      success: true,
      message: "Successfully created admin user",
    };
  } catch (error) {
    console.error("Error seeding users:", error);
    return {
      success: false,
      error: "Failed to seed default users",
    };
  }
}

export async function runInstallation(data: {
  mongodbUri: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}) {
  try {
    // Step 1: Test database connection
    const dbCheck = await checkDatabaseConnection(data.mongodbUri);
    if (!dbCheck.success) {
      return {
        success: false,
        step: "database",
        error: dbCheck.error,
      };
    }

    // Step 2: Seed roles
    const rolesResult = await seedDefaultRoles();
    if (!rolesResult.success) {
      return {
        success: false,
        step: "roles",
        error: rolesResult.error,
      };
    }

    // Step 3: Seed admin user
    const usersResult = await seedDefaultUsers({
      username: data.adminUsername,
      email: data.adminEmail,
      password: data.adminPassword,
      name: data.adminName,
    });

    if (!usersResult.success) {
      return {
        success: false,
        step: "users",
        error: usersResult.error,
      };
    }

    return {
      success: true,
      message: "Installation completed successfully",
    };
  } catch (error) {
    console.error("Installation error:", error);
    return {
      success: false,
      error: "Installation failed",
    };
  }
}
