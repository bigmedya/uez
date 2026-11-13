import { PrismaClient } from "../../generated/prisma/client";

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient();
}

if (process.env.NODE_ENV === "production") {
  prisma = createClient();
} else {
  const stale =
    global.__prisma &&
    typeof (global.__prisma as unknown as { external_payment_entries?: unknown }).external_payment_entries ===
      "undefined";
  if (!global.__prisma || stale) {
    global.__prisma = createClient();
  }
  prisma = global.__prisma;
}

export { prisma };

