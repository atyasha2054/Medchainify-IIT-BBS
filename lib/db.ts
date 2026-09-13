import { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "medchainify";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI");
}

let cachedMongoose: any = (global as any).mongoose;

if (!cachedMongoose) {
  cachedMongoose = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // 1. Handle Mongoose connection
  if (!cachedMongoose.conn) {
    if (!cachedMongoose.promise) {
      const opts = {
        bufferCommands: false,
        dbName: MONGODB_DB,
      };
      cachedMongoose.promise = mongoose
        .connect(MONGODB_URI!, opts)
        .then((m) => m);
    }
    cachedMongoose.conn = await cachedMongoose.promise;
  }

  // 2. Handle Native MongoDB connection
  if ((global as any).mongoClient && (global as any).mongoDb) {
    return {
      client: (global as any).mongoClient,
      db: (global as any).mongoDb,
      mongoose: cachedMongoose.conn,
    };
  }

  const client = await MongoClient.connect(MONGODB_URI as string);
  const db = client.db(MONGODB_DB);

  (global as any).mongoClient = client;
  (global as any).mongoDb = db;

  return { client, db, mongoose: cachedMongoose.conn };
}

export const connectDB = connectToDatabase;

export const clientPromise = (async () => {
  const { client } = await connectToDatabase();
  return client;
})();

export function getSafeId(id: string) {
  if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}
