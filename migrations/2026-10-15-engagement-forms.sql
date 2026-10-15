-- Apply to the D1 database used by worker-business-v2 BEFORE merging the pages.
-- These tables are distinct from the editorial Issue 16 poll tables.
CREATE TABLE IF NOT EXISTS sk8_advertiser_interest (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 business_name TEXT NOT NULL,
 area TEXT,
 interest TEXT NOT NULL,
 notes TEXT,
 contact_name TEXT,
 email TEXT NOT NULL,
 phone TEXT,
 source TEXT,
 notification_status TEXT NOT NULL DEFAULT 'pending',
 notified_at TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sk8_advertiser_interest_email_time ON sk8_advertiser_interest(email, created_at);
CREATE TABLE IF NOT EXISTS sk8_reader_demographics (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 area TEXT NOT NULL,
 relationship TEXT NOT NULL,
 age_band TEXT NOT NULL,
 children_bands TEXT NOT NULL,
 interests TEXT NOT NULL,
 link_consent INTEGER NOT NULL DEFAULT 0,
 linked_email TEXT,
 confirmed_at TEXT,
 link_status TEXT NOT NULL DEFAULT 'anonymous',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sk8_reader_demographics_created ON sk8_reader_demographics(created_at);
CREATE TABLE IF NOT EXISTS sk8_demographics_confirmations (
 token_hash TEXT PRIMARY KEY,
 response_id INTEGER NOT NULL,
 email TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 used_at TEXT
);
CREATE INDEX IF NOT EXISTS sk8_demographics_confirmations_expiry ON sk8_demographics_confirmations(expires_at);
