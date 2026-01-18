import { getDatabase } from "../lib/mongodb";
import bcrypt from "bcryptjs";

async function createTechnicianUser() {
  try {
    const db = await getDatabase();
    console.log("Connected to MongoDB");
    console.log("Database name:", db.databaseName);

    const usersCollection = db.collection("users");

    // Check if technician user already exists
    const existingUser = await usersCollection.findOne({
      username: "technician",
    });

    if (existingUser) {
      console.log("Technician user already exists. Skipping creation.");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("technician123", 10);

    // Create technician user
    const technicianUser = {
      username: "technician",
      email: "technician@ticketing.com",
      password: hashedPassword,
      role: "technician",
      name: "Tech Support",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(technicianUser);

    console.log("\n✓ Successfully created technician user:");
    console.log("  Username: technician");
    console.log("  Email: technician@ticketing.com");
    console.log("  Password: technician123");
    console.log("  Role: technician");
    console.log("  Name: Tech Support");

    console.log("\nTechnician user created successfully!");
  } catch (error) {
    console.error("Error creating technician user:", error);
    throw error;
  }
}

// Run the script
createTechnicianUser()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
