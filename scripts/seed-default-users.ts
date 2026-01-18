import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  "mongodb+srv://ticketing:POs4KjRONk01yfYV@cluster0.rtohhok.mongodb.net/ticketing?retryWrites=true&w=majority";

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
  {
    username: "technician",
    email: "technician@ticketing.com",
    password: "technician123",
    role: "technician",
    name: "Tech Support",
    isActive: true,
  },
];

async function seedDefaultUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("it_inventory");
    console.log("Database name:", db.databaseName);

    const usersCollection = db.collection("users");

    // Delete all existing users
    const deleteResult = await usersCollection.deleteMany({});
    console.log(`\n✓ Deleted ${deleteResult.deletedCount} existing users`);

    // Create users with hashed passwords
    const usersToInsert = await Promise.all(
      DEFAULT_USERS.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          username: user.username,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          name: user.name,
          isActive: user.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),
    );

    await usersCollection.insertMany(usersToInsert);

    console.log("\n✓ Successfully seeded default users:\n");
    DEFAULT_USERS.forEach((user) => {
      console.log(`  - ${user.name}`);
      console.log(`    Username: ${user.username}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: ${user.password}`);
      console.log(`    Role: ${user.role}\n`);
    });

    console.log("Default users seeded successfully!");
  } catch (error) {
    console.error("Error seeding default users:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedDefaultUsers();
