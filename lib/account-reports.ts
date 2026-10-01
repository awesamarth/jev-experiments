import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { AccountReport } from "@/lib/account-scorer";

export const REANALYZE_COOLDOWN_MS = 15 * 60_000;
const HOURLY_SCAN_LIMIT = 80;
const HOURLY_IP_LIMIT = 8;

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function findLatestReport(handle: string): Promise<AccountReport | null> {
  const sql = database();
  const rows = await sql`
    SELECT report FROM account_reports
    WHERE handle_key = ${handle.toLowerCase()}
    ORDER BY analyzed_at DESC, id DESC LIMIT 1
  `;
  return (rows[0]?.report as AccountReport | undefined) ?? null;
}

export async function findReportById(id: string): Promise<AccountReport | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const sql = database();
  const rows = await sql`SELECT report FROM account_reports WHERE id = ${id}::uuid LIMIT 1`;
  return (rows[0]?.report as AccountReport | undefined) ?? null;
}

export async function reserveScan(handle: string, token: string): Promise<boolean> {
  const sql = database();
  const rows = await sql`
    INSERT INTO account_scan_locks (handle_key, token, locked_until)
    VALUES (${handle.toLowerCase()}, ${token}::uuid, now() + interval '120 seconds')
    ON CONFLICT (handle_key) DO UPDATE
      SET token = EXCLUDED.token, locked_until = EXCLUDED.locked_until
    WHERE account_scan_locks.locked_until <= now()
    RETURNING handle_key
  `;
  return rows.length > 0;
}

export async function releaseScan(handle: string, token: string, success: boolean) {
  const sql = database();
  if (success) {
    await sql`
      UPDATE account_scan_locks SET locked_until = now() + interval '15 minutes'
      WHERE handle_key = ${handle.toLowerCase()} AND token = ${token}::uuid
    `;
  } else {
    await sql`
      DELETE FROM account_scan_locks
      WHERE handle_key = ${handle.toLowerCase()} AND token = ${token}::uuid
    `;
  }
}

async function consumeLimit(scope: string, maxUses: number) {
  const sql = database();
  const rows = await sql`
    INSERT INTO account_scan_limits (scope, window_start, uses)
    VALUES (${scope}, now(), 1)
    ON CONFLICT (scope) DO UPDATE SET
      uses = CASE WHEN account_scan_limits.window_start <= now() - interval '1 hour'
        THEN 1 ELSE account_scan_limits.uses + 1 END,
      window_start = CASE WHEN account_scan_limits.window_start <= now() - interval '1 hour'
        THEN now() ELSE account_scan_limits.window_start END
    WHERE account_scan_limits.window_start <= now() - interval '1 hour'
      OR account_scan_limits.uses < ${maxUses}
    RETURNING uses
  `;
  return rows.length > 0;
}

export async function allowScan(request: Request): Promise<boolean> {
  if (!await consumeLimit("global", HOURLY_SCAN_LIMIT)) return false;
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip || ip.length > 64) return true;
  const fingerprint = createHmac("sha256", process.env.DATABASE_URL!).update(ip).digest("hex");
  return consumeLimit(`ip:${fingerprint}`, HOURLY_IP_LIMIT);
}

export async function saveReport(report: AccountReport) {
  const sql = database();
  await sql`
    INSERT INTO account_reports (id, handle_key, report, analyzed_at)
    VALUES (${report.shareId}::uuid, ${report.handle.toLowerCase()}, ${JSON.stringify(report)}::jsonb, ${report.analyzedAt}::timestamptz)
  `;
}
