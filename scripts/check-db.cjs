// Kiểm tra kết nối runtime qua Transaction Pooler (DATABASE_URL) + trạng thái RLS.
require("dotenv/config");
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query(
    "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename",
  );
  console.table(r.rows);
  await c.end();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
