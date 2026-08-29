-- SK8 Scoop reader submission form
-- Preview branch release preparation, updated 29 August 2026
-- Contact messages now use Formspark and do not require a D1 table.
-- Apply to the production D1 database only after explicit production approval.

CREATE TABLE IF NOT EXISTS reader_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_type TEXT NOT NULL,
  message TEXT NOT NULL,
  reference TEXT,
  link TEXT,
  name TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reader_submissions_status ON reader_submissions(status);
CREATE INDEX IF NOT EXISTS idx_reader_submissions_type ON reader_submissions(submission_type);
