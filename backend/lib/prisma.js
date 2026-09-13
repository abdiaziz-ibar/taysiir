const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance across hot-reloads (nodemon) and
// across warm serverless invocations (Vercel) instead of opening a new
// connection pool on every require().
const globalForPrisma = global;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
