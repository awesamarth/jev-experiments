-- Each row is an immutable, publicly shareable snapshot of one public X account.
CREATE TABLE IF NOT EXISTS account_reports (
  id uuid PRIMARY KEY,
  handle_key varchar(15) NOT NULL,
  report jsonb NOT NULL,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_reports_latest_idx
  ON account_reports (handle_key, analyzed_at DESC, id DESC);

-- Prevent duplicate concurrent analyses of a handle across serverless instances.
CREATE TABLE IF NOT EXISTS account_scan_locks (
  handle_key varchar(15) PRIMARY KEY,
  token uuid NOT NULL,
  locked_until timestamptz NOT NULL
);

-- A shared scan budget protects the paid inference API from unbounded anonymous traffic.
CREATE TABLE IF NOT EXISTS account_scan_limits (
  scope text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  uses integer NOT NULL DEFAULT 1
);
