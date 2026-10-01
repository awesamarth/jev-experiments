# Account Scorer storage

Neon Postgres stores immutable public X-account reports. The latest report for a handle is returned until a visitor explicitly requests re-analysis. Each report ID is a permanent share URL at `/score/<id>`.

## Setup

1. Connect a Neon Free-plan database to the Vercel project (Production and Development) with the unprefixed `DATABASE_URL` environment variable.
2. Locally, put `DATABASE_URL` in the ignored `.env.local` alongside `TYPESAFE_API_KEY`.
3. Run `bun run db:migrate` before serving the app or deploying the changes. Migrations are idempotent. The SQL is in `db/001_account_reports.sql`.

The database provisioned for this project is `jev-experiments-scores` in Vercel Storage. The scan budget is 80 total analyses/hour and 8/hour per client IP (IP addresses are HMAC-hashed before storing). A handle may be re-analyzed after 15 minutes. Public report snapshots intentionally persist so shared URLs stay stable. Never commit database connection strings.
