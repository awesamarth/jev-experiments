import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to apply the database migration.");

const sql = neon(databaseUrl);
const migration = await readFile(new URL("../db/001_account_reports.sql", import.meta.url), "utf8");
for (const statement of migration.split(";").map((part) => part.trim()).filter(Boolean)) {
  await sql.query(statement, []);
}
console.log("Account Scorer database schema is ready.");
