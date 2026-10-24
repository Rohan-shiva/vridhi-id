import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;
let useMemoryStore = false;

export async function connectDatabase(): Promise<boolean> {
  if (config.NODE_ENV === 'test') {
    useMemoryStore = true;
    return true;
  }

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${config.MONGODB_URI}`);
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500
    });
    isConnected = true;
    useMemoryStore = false;
    console.log(`[Database] Connected successfully to MongoDB instance.`);
    return true;
  } catch (error) {
    console.warn(`[Database] Real MongoDB instance at ${config.MONGODB_URI} is currently offline.`);
    console.warn(`[Database] Activating integrated in-memory fallback persistence. Data will be preserved for the lifetime of this server process.`);
    isConnected = false;
    useMemoryStore = true;
    return false;
  }
}

export function getDatabaseState() {
  return {
    connectedToMongo: isConnected,
    usingMemoryFallback: useMemoryStore,
    mongoUri: config.MONGODB_URI
  };
}
