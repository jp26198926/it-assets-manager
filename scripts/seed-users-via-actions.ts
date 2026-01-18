import { createUser } from "../lib/actions/users";

const DEFAULT_USERS = [
  {
    username: "admin",
    email: "admin@ticketing.com",
    password: "admin123",
    role: "admin" as const,
    name: "System Administrator",
  },
  {
    username: "manager",
    email: "manager@ticketing.com",
    password: "manager123",
    role: "manager" as const,
    name: "Department Manager",
  },
  {
    username: "employee",
    email: "employee@ticketing.com",
    password: "employee123",
    role: "employee" as const,
    name: "Regular Employee",
  },
];

async function seedUsers() {
  console.log("Starting to seed users...\n");

  for (const user of DEFAULT_USERS) {
    console.log(`Creating user: ${user.username}...`);
    const result = await createUser(user);

    if (result.success) {
      console.log(`✓ ${user.name} created successfully`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}\n`);
    } else {
      console.log(`✗ Failed to create ${user.username}: ${result.error}\n`);
    }
  }

  console.log("User seeding completed!");
}

seedUsers();
