-- =============================================================================
-- Bảo mật Supabase: bật Row Level Security cho các bảng do Prisma tạo.
-- -----------------------------------------------------------------------------
-- Supabase tự động expose schema "public" qua Data API (PostgREST) bằng anon key.
-- Bật RLS mà KHÔNG tạo policy => chặn toàn bộ truy cập qua anon/authenticated key.
-- Prisma kết nối bằng role "postgres" (bypass RLS) nên ứng dụng vẫn hoạt động bình thường.
--
-- Chạy: npm run db:rls
-- =============================================================================

ALTER TABLE "buildings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rooms"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants"   ENABLE ROW LEVEL SECURITY;
