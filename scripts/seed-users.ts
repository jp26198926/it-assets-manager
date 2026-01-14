import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ticketing:incorrectP%40ssw0rd%2123@cluster0.rtohhok.mongodb.net/ticketing?retryWrites=true&w=majority";

const demoUsers = [
  {
    username: "admin",
    email: "admin@ticketing.com",
    password: "admin123",
    role: "admin" as const,
    name: "Admin User",
    employeeId: "EMP001",
    department: "IT",
    isActive: true,
  },
  {
    username: "manager",
    email: "manager@ticketing.com",
    password: "manager123",
    role: "manager" as const,
    name: "Manager User",
    employeeId: "EMP002",
    department: "IT",
    isActive: true,
  },
  {
    username: "employee",
    email: "employee@ticketing.com",
    password: "employee123",
    role: "employee" as const,
    name: "Employee User",
    employeeId: "EMP003",
    department: "Operations",
    isActive: true,
  },
];

async function seedUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const usersCollection = db.collection("users");

    // Clear existing users (optional - comment out if you want to preserve existing users)
    await usersCollection.deleteMany({});
    console.log("Cleared existing users");

    // Hash passwords and insert users
    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await usersCollection.insertOne({
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Created user: ${user.username} (${user.role})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    }

    console.log("\n✅ Demo users created successfully!");
    console.log("\nLogin credentials:");
    console.log("==================");
    demoUsers.forEach((user) => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

seedUsers();
