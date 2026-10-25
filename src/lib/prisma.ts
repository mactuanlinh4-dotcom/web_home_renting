import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma Client singleton cho Next.js (App Router) chạy trên Vercel.
 *
 * - Kết nối qua Supabase Transaction Pooler (DATABASE_URL, port 6543).
 * - Dùng driver adapter `@prisma/adapter-pg` (bắt buộc từ Prisma 7).
 * - `max: 1`–`5` là đủ cho serverless: mỗi lambda giữ ít kết nối, pooler lo phần còn lại.
 * - Cache trên globalThis để tránh tạo nhiều client khi HMR ở môi trường dev.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Thiếu biến môi trường DATABASE_URL. Hãy cấu hình trong file .env (local) hoặc Vercel Project Settings.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 3 : 5,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
