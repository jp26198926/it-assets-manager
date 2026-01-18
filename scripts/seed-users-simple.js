const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

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
];

async function seedUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");

    const db = client.db("it_inventory");
    const usersCollection = db.collection("users");

    console.log("\nCurrent users:");
    const currentUsers = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray();
    currentUsers.forEach((user) =>
      console.log(`  - ${user.username} (${user.role})`),
    );

    console.log(`\n Creating ${DEFAULT_USERS.length} default users...\n`);

    for (const user of DEFAULT_USERS) {
      const existing = await usersCollection.findOne({
        username: user.username,
      });

      if (existing) {
        console.log(`  ✓ ${user.username} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

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

      console.log(`  ✓ Created ${user.username}`);
      console.log(`     Name: ${user.name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Password: ${user.password}`);
      console.log(`     Role: ${user.role}\n`);
    }

    console.log("\n✅ User seeding completed!");

    const finalUsers = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray();
    console.log(`\nTotal users in database: ${finalUsers.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedUsers();
