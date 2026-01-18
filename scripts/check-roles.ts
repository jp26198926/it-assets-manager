import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "ticketing";

async function checkRoles() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DB_NAME);
    const rolesCollection = db.collection("roles");

    const count = await rolesCollection.countDocuments();
    console.log(`\nTotal roles in database: ${count}`);

    if (count > 0) {
      console.log("\nExisting roles:");
      const roles = await rolesCollection.find({}).toArray();
      roles.forEach((role) => {
        console.log(`\n- Name: ${role.name}`);
        console.log(`  Slug: ${role.slug}`);
        console.log(`  Is System: ${role.isSystem}`);
        console.log(`  Is Active: ${role.isActive}`);
        console.log(`  Permissions: ${role.permissions.length}`);
      });
    } else {
      console.log("\nNo roles found in the database.");
      console.log("Run 'npm run seed:roles' to seed default roles.");
    }
  } catch (error) {
    console.error("Error checking roles:", error);
    throw error;
  } finally {
    await client.close();
  }
}

checkRoles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
