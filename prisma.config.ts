import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI config (Prisma 7+).
 *
 * - `prisma db push` / `prisma migrate` cần kết nối TRỰC TIẾP (Session/Direct, port 5432),
 *   vì Transaction Pooler (port 6543) không hỗ trợ các lệnh DDL/advisory lock.
 * - Runtime của ứng dụng dùng DATABASE_URL (Transaction Pooler) tại `src/lib/prisma.ts`.
 *
 * Không dùng helper `env()` (sẽ throw nếu thiếu biến) để `prisma generate`
 * vẫn chạy được trong môi trường build không có biến DB.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
