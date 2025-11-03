/**
 * MongoDB Client Configuration for Next.js
 * This file sets up the MongoDB connection with proper connection pooling
 * and error handling for production use.
 *
 * SETUP REQUIRED: Add MONGODB_URI to your .env.local file
 */

// Load environment variables (for scripts running outside Next.js)
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { MongoClient, Db, ServerApiVersion } from "mongodb";

function getMongoDbUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  return uri;
}
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false, // Set to false to allow text search with $meta
    deprecationErrors: true,
  },
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function initializeClient(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = getMongoDbUri();

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

/**
 * Get MongoDB database instance
 * @param dbName - Optional database name (defaults to the one in connection string)
 */
export async function getDatabase(dbName?: string): Promise<Db> {
  const promise = initializeClient();
  const client = await promise;
  return client.db(dbName);
}

/**
 * Get MongoDB client instance
 */
export async function getClient(): Promise<MongoClient> {
  return initializeClient();
}

// Export a function that returns the client promise
export default function getClientPromise(): Promise<MongoClient> {
  return initializeClient();
}
