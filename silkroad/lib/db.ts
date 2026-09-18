/**
 * MongoDB connection, cached across hot reloads and warm serverless
 * invocations so each request doesn't open a new pool.
 */

import mongoose from 'mongoose';
import { CONFIG } from '@/config/constants';

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: CachedConnection | undefined;
}

const cached: CachedConnection = (global.mongooseCache ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!CONFIG.MONGODB_URI) throw new Error('MONGODB_URI is not configured');

  cached.promise ??= mongoose
    .connect(CONFIG.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    .catch((error) => {
      cached.promise = null; // let the next request retry
      throw error;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
