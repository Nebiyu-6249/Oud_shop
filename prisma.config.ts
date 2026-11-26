import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Local development reads .env.local; on Netlify the variables come from the UI.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations want a direct connection; Neon's pooled URL is for the app.
    // DIRECT_URL is optional and falls back to DATABASE_URL.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
