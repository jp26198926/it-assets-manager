import { getDatabase } from "../lib/mongodb";
import type { Role } from "../lib/models/Role";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "it_inventory";

// Default system roles based on current ROLE_PERMISSIONS
const DEFAULT_ROLES: Omit<Role, "_id">[] = [
  {
    name: "Administrator",
    slug: "admin",
    description: "Full system access with all permissions",
    permissions: [
      { resource: "users", actions: ["create", "read", "update", "delete"] },
      {
        resource: "inventory",
        actions: ["create", "read", "update", "delete"],
      },
      { resource: "tickets", actions: ["create", "read", "update", "delete"] },
      { resource: "issuance", actions: ["create", "read", "update", "delete"] },
      {
        resource: "departments",
        actions: ["create", "read", "update", "delete"],
      },
      {
        resource: "employees",
        actions: ["create", "read", "update", "delete"],
      },
      {
        resource: "categories",
        actions: ["create", "read", "update", "delete"],
      },
      {
        resource: "knowledge",
        actions: ["create", "read", "update", "delete"],
      },
      { resource: "reports", actions: ["read"] },
      { resource: "settings", actions: ["create", "read", "update", "delete"] },
      { resource: "roles", actions: ["create", "read", "update", "delete"] },
    ],
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Manager",
    slug: "manager",
    description: "Manage inventory, tickets, and team operations",
    permissions: [
      { resource: "inventory", actions: ["create", "read", "update"] },
      { resource: "tickets", actions: ["create", "read", "update"] },
      { resource: "issuance", actions: ["create", "read", "update"] },
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] },
      { resource: "categories", actions: ["read"] },
      { resource: "knowledge", actions: ["create", "read", "update"] },
      { resource: "reports", actions: ["read"] },
    ],
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Employee",
    slug: "employee",
    description: "Basic access to view resources and create tickets",
    permissions: [
      { resource: "inventory", actions: ["read"] },
      { resource: "tickets", actions: ["create", "read"] },
      { resource: "issuance", actions: ["read"] },
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] },
      { resource: "categories", actions: ["read"] },
      { resource: "knowledge", actions: ["read"] },
    ],
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Technician",
    slug: "technician",
    description: "Handle tickets, repairs, and equipment management",
    permissions: [
      { resource: "inventory", actions: ["read", "update"] },
      { resource: "tickets", actions: ["create", "read", "update"] },
      { resource: "issuance", actions: ["create", "read", "update"] },
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] },
      { resource: "categories", actions: ["read"] },
      { resource: "knowledge", actions: ["create", "read", "update"] },
      { resource: "reports", actions: ["read"] },
    ],
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedDefaultRoles() {
  try {
    const db = await getDatabase();
    console.log("Connected to MongoDB");
    console.log("Database name:", db.databaseName);
    const rolesCollection = db.collection<Role>("roles");

    // Check if roles already exist
    const existingRolesCount = await rolesCollection.countDocuments({});

    if (existingRolesCount > 0) {
      console.log(
        `Found ${existingRolesCount} existing roles. Deleting them first...`,
      );
      await rolesCollection.deleteMany({});
      console.log("Deleted all existing roles.");
    }

    // Insert default roles
    console.log("Seeding default system roles...");
    const result = await rolesCollection.insertMany(DEFAULT_ROLES);

    console.log(`✓ Successfully created ${result.insertedCount} system roles:`);
    DEFAULT_ROLES.forEach((role) => {
      console.log(
        `  - ${role.name} (${role.slug}): ${role.permissions.length} permissions`,
      );
    });

    console.log("\nSystem roles have been seeded successfully!");
  } catch (error) {
    console.error("Error seeding roles:", error);
    throw error;
  }
}

// Run the script
seedDefaultRoles()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
