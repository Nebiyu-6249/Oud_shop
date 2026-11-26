import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server instance. In a Netlify function the module scope
// survives warm invocations, so the pool is reused; in dev the global
// guard stops hot reload from opening a new pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Keep the pool small: each function instance holds its own, and Neon's
  // pooler multiplexes them.
  const adapter = new PrismaPg({ connectionString, max: 3 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
