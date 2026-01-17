/**
 * Script to drop the repairs collection from MongoDB
 *
 * Run with: npx tsx scripts/drop-repairs-collection.ts
 */

import { connectDB } from "@/lib/mongodb";
import { MongoClient } from "mongodb";

async function dropRepairsCollection() {
  try {
    console.log("Connecting to MongoDB...");
    const client = (await connectDB()) as MongoClient;
    const db = client.db();

    // Check if repairs collection exists
    const collections = await db.listCollections({ name: "repairs" }).toArray();

    if (collections.length === 0) {
      console.log("✅ Repairs collection does not exist - nothing to drop");
      return;
    }

    console.log("Found repairs collection. Dropping...");
    await db.collection("repairs").drop();

    console.log("✅ Successfully dropped repairs collection from database");
    console.log("\nNote: All repair data has been permanently deleted.");
    console.log(
      "The app code has already been cleaned up to remove repairs functionality.",
    );
  } catch (error) {
    console.error("❌ Error dropping repairs collection:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

dropRepairsCollection();
