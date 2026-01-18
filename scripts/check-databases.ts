import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function checkDatabases() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db1 = client.db("ticketing");
    const db2 = client.db("it_inventory");

    const count1 = await db1.collection("roles").countDocuments();
    const count2 = await db2.collection("roles").countDocuments();

    console.log("\n=== Database Check ===");
    console.log("ticketing database roles:", count1);
    console.log("it_inventory database roles:", count2);

    if (count1 > 0) {
      console.log("\nRoles found in 'ticketing' database:");
      const roles = await db1.collection("roles").find({}).toArray();
      roles.forEach((role) => console.log(`  - ${role.name} (${role.slug})`));
    }

    if (count2 > 0) {
      console.log("\nRoles found in 'it_inventory' database:");
      const roles = await db2.collection("roles").find({}).toArray();
      roles.forEach((role) => console.log(`  - ${role.name} (${role.slug})`));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkDatabases();
