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
    strict: false,
    deprecationErrors: true,
  },
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function initializeClient(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = getMongoDbUri();

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDatabase(dbName?: string): Promise<Db> {
  const promise = initializeClient();
  const client = await promise;
  return client.db(dbName);
}

export async function getClient(): Promise<MongoClient> {
  return initializeClient();
}

export default function getClientPromise(): Promise<MongoClient> {
  return initializeClient();
}
