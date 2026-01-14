import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

async function migrateEmployeeNames() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const employeesCollection = db.collection("employees");

    // Find all employees that still have the old 'name' field
    const employeesWithOldSchema = await employeesCollection
      .find({ name: { $exists: true } })
      .toArray();

    console.log(`Found ${employeesWithOldSchema.length} employees to migrate`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const employee of employeesWithOldSchema) {
      try {
        const fullName = employee.name as string;

        // Simple name splitting logic
        // Format: "FirstName LastName" or "FirstName MiddleName LastName"
        const nameParts = fullName.trim().split(/\s+/);

        let firstName = "";
        let lastName = "";
        let middleName = undefined;

        if (nameParts.length === 1) {
          // Only one name part - treat as last name
          lastName = nameParts[0];
          firstName = "";
        } else if (nameParts.length === 2) {
          // Two parts: FirstName LastName
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else if (nameParts.length >= 3) {
          // Three or more parts: FirstName MiddleNames LastName
          firstName = nameParts[0];
          lastName = nameParts[nameParts.length - 1];
          middleName = nameParts.slice(1, -1).join(" ");
        }

        // Update the employee document
        const updateResult = await employeesCollection.updateOne(
          { _id: employee._id },
          {
            $set: {
              firstName,
              lastName,
              ...(middleName && { middleName }),
              updatedAt: new Date(),
            },
            $unset: {
              name: "",
            },
          }
        );

        if (updateResult.modifiedCount > 0) {
          migrated++;
          console.log(
            `✓ Migrated: ${fullName} → First: "${firstName}", Middle: "${
              middleName || "N/A"
            }", Last: "${lastName}"`
          );
        } else {
          skipped++;
          console.log(`⊘ Skipped: ${fullName} (already migrated)`);
        }
      } catch (error) {
        failed++;
        console.error(`✗ Failed to migrate employee ${employee._id}:`, error);
      }
    }

    console.log("\n--- Migration Summary ---");
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${employeesWithOldSchema.length}`);
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

migrateEmployeeNames()
  .then(() => {
    console.log("\n✓ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  });
