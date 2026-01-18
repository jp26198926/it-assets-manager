import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function initializeClient() {
  if (
    !uri ||
    (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))
  ) {
    throw new Error(
      "Invalid or missing MongoDB URI. Please check your .env configuration.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    return client.connect();
  }
}

export async function getDatabase(): Promise<Db> {
  try {
    if (!clientPromise) {
      clientPromise = initializeClient();
    }
    const client = await clientPromise;
    return client.db("it_inventory");
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

export async function connectToDatabase(): Promise<{
  db: Db;
  client: MongoClient;
}> {
  try {
    if (!clientPromise) {
      clientPromise = initializeClient();
    }
    const client = await clientPromise;
    const db = client.db("it_inventory");
    return { db, client };
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

export default async function getClientPromise() {
  if (!clientPromise) {
    clientPromise = initializeClient();
  }
  return clientPromise;
}
