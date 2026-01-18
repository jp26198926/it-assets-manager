import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const DEFAULT_USERS = [
  {
    username: "admin",
    email: "admin@ticketing.com",
    password: "admin123",
    role: "admin",
    name: "System Administrator",
    isActive: true,
  },
  {
    username: "manager",
    email: "manager@ticketing.com",
    password: "manager123",
    role: "manager",
    name: "Department Manager",
    isActive: true,
  },
  {
    username: "employee",
    email: "employee@ticketing.com",
    password: "employee123",
    role: "employee",
    name: "Regular Employee",
    isActive: true,
  },
];

export async function POST() {
  let client: MongoClient | null = null;

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: "MongoDB URI not configured" },
        { status: 500 },
      );
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db("it_inventory");
    const usersCollection = db.collection("users");

    // Check current user count
    const currentCount = await usersCollection.countDocuments();
    console.log(`Current user count: ${currentCount}`);

    const createdUsers = [];
    const errors = [];

    for (const user of DEFAULT_USERS) {
      // Check if user exists
      const existing = await usersCollection.findOne({
        username: user.username,
      });

      if (existing) {
        console.log(`User ${user.username} already exists, skipping`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Create user
      await usersCollection.insertOne({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createdUsers.push({
        username: user.username,
        name: user.name,
        role: user.role,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${createdUsers.length} users`,
      users: createdUsers,
    });
  } catch (error: any) {
    console.error("Error seeding users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed users" },
      { status: 500 },
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
