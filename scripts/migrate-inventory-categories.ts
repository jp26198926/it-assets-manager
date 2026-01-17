import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI || !MONGODB_DB) {
  throw new Error(
    "Please define MONGODB_URI and MONGODB_DB in your .env.local file"
  );
}

// Map old category enum values to new category codes
const categoryMapping: Record<string, string> = {
  laptop: "LAPTOP",
  desktop: "DESKTOP",
  monitor: "MONITOR",
  keyboard: "KEYBOARD",
  mouse: "MOUSE",
  printer: "PRINTER",
  network: "NETWORK",
  storage: "STORAGE",
  accessory: "ACCESSORY",
  other: "OTHER",
};

async function migrateCategoryToReference() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(MONGODB_DB);
    const inventoryCollection = db.collection("inventory");
    const categoriesCollection = db.collection("categories");

    // First, check if categories exist, if not create them
    console.log("\n1. Checking/Creating categories...");

    const defaultCategories = [
      { name: "Laptop", code: "LAPTOP", description: "Laptop computers" },
      { name: "Desktop", code: "DESKTOP", description: "Desktop computers" },
      { name: "Monitor", code: "MONITOR", description: "Display monitors" },
      { name: "Keyboard", code: "KEYBOARD", description: "Keyboards" },
      { name: "Mouse", code: "MOUSE", description: "Mouse devices" },
      {
        name: "Printer",
        code: "PRINTER",
        description: "Printers and scanners",
      },
      {
        name: "Network Device",
        code: "NETWORK",
        description: "Network equipment",
      },
      {
        name: "Storage Device",
        code: "STORAGE",
        description: "Storage devices",
      },
      {
        name: "Accessory",
        code: "ACCESSORY",
        description: "Computer accessories",
      },
      { name: "Other", code: "OTHER", description: "Other IT assets" },
    ];

    const categoryIdMap: Record<string, ObjectId> = {};

    for (const cat of defaultCategories) {
      const existing = await categoriesCollection.findOne({ code: cat.code });
      if (existing) {
        console.log(`  ✓ Category ${cat.code} already exists`);
        categoryIdMap[cat.code] = existing._id as ObjectId;
      } else {
        const result = await categoriesCollection.insertOne({
          ...cat,
          createdAt: new Date(),
        });
        console.log(`  + Created category ${cat.code}`);
        categoryIdMap[cat.code] = result.insertedId;
      }
    }

    // Get all inventory items that have old category field
    console.log("\n2. Migrating inventory items...");
    const itemsWithOldCategory = await inventoryCollection
      .find({ category: { $type: "string" } })
      .toArray();

    console.log(`  Found ${itemsWithOldCategory.length} items to migrate`);

    if (itemsWithOldCategory.length === 0) {
      console.log("  No items to migrate. All done!");
      return;
    }

    let migrated = 0;
    let failed = 0;

    for (const item of itemsWithOldCategory) {
      const oldCategory = item.category as string;
      const categoryCode = categoryMapping[oldCategory];

      if (!categoryCode || !categoryIdMap[categoryCode]) {
        console.log(
          `  ✗ Failed to migrate item ${item.barcode}: Unknown category "${oldCategory}"`
        );
        failed++;
        continue;
      }

      const categoryId = categoryIdMap[categoryCode];

      try {
        await inventoryCollection.updateOne(
          { _id: item._id },
          {
            $set: { categoryId },
            $unset: { category: "" },
          }
        );
        console.log(
          `  ✓ Migrated item ${item.barcode}: ${oldCategory} -> ${categoryCode}`
        );
        migrated++;
      } catch (error) {
        console.log(`  ✗ Failed to migrate item ${item.barcode}:`, error);
        failed++;
      }
    }

    console.log(`\n3. Migration Summary:`);
    console.log(`  Total items: ${itemsWithOldCategory.length}`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Failed: ${failed}`);

    // Verify migration
    console.log("\n4. Verification:");
    const remainingOldItems = await inventoryCollection.countDocuments({
      category: { $type: "string" },
    });
    const newItems = await inventoryCollection.countDocuments({
      categoryId: { $exists: true },
    });

    console.log(`  Items with old category field: ${remainingOldItems}`);
    console.log(`  Items with new categoryId field: ${newItems}`);

    if (remainingOldItems === 0) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log("\n⚠️  Some items still have the old category field");
    }
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run the migration
migrateCategoryToReference()
  .then(() => {
    console.log("\nMigration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration script failed:", error);
    process.exit(1);
  });
