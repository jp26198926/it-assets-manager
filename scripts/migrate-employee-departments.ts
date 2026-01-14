import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ticketing:incorrectP%40ssw0rd%2123@cluster0.rtohhok.mongodb.net/ticketing?retryWrites=true&w=majority";

async function migrateEmployees() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const employeesCollection = db.collection("employees");
    const departmentsCollection = db.collection("departments");

    // Get all employees
    const employees = await employeesCollection.find({}).toArray();
    console.log(`Found ${employees.length} employees to migrate`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const employee of employees) {
      // Skip if already migrated (has departmentId field)
      if (employee.departmentId instanceof ObjectId) {
        console.log(`Skipping ${employee.name} - already migrated`);
        skipped++;
        continue;
      }

      // If employee has old string department field
      if (typeof employee.department === "string") {
        // Try to find matching department by name
        const department = await departmentsCollection.findOne({
          name: { $regex: new RegExp(`^${employee.department}$`, "i") },
        });

        if (department) {
          // Update employee with department reference
          await employeesCollection.updateOne(
            { _id: employee._id },
            {
              $set: { departmentId: department._id },
              $unset: { department: "" },
            }
          );
          console.log(`✓ Migrated ${employee.name} -> ${department.name}`);
          migrated++;
        } else {
          // Create new department if it doesn't exist
          const newDept = {
            name: employee.department,
            code: employee.department.substring(0, 3).toUpperCase(),
            createdAt: new Date(),
          };
          const result = await departmentsCollection.insertOne(newDept);

          // Update employee with new department reference
          await employeesCollection.updateOne(
            { _id: employee._id },
            {
              $set: { departmentId: result.insertedId },
              $unset: { department: "" },
            }
          );
          console.log(
            `✓ Created department "${newDept.name}" and migrated ${employee.name}`
          );
          migrated++;
        }
      } else {
        console.log(
          `⚠ Failed to migrate ${employee.name} - no department field`
        );
        failed++;
      }
    }

    console.log("\n✅ Migration complete!");
    console.log(`==================`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${employees.length}`);
  } catch (error) {
    console.error("Error migrating employees:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

migrateEmployees();
