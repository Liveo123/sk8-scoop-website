CREATE TABLE IF NOT EXISTS qr_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 event_type TEXT NOT NULL,
 qr_code TEXT NOT NULL,
 poster_id TEXT,
 venue TEXT,
 area TEXT,
 campaign TEXT,
 source TEXT,
 medium TEXT,
 path TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qr_events_code ON qr_events(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_events_created ON qr_events(created_at);

CREATE TABLE IF NOT EXISTS event_submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 event_name TEXT NOT NULL,
 event_date TEXT NOT NULL,
 event_time TEXT,
 venue TEXT NOT NULL,
 area TEXT NOT NULL,
 cost TEXT,
 booking_url TEXT NOT NULL,
 description TEXT NOT NULL,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 image_note TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS advertiser_enquiries (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 business_name TEXT NOT NULL,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 phone TEXT,
 business_type TEXT,
 area TEXT,
 website TEXT NOT NULL,
 package TEXT NOT NULL,
 preferred_date TEXT NOT NULL,
 advert_copy TEXT,
 image_link TEXT,
 invoice_details TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 submission_type TEXT NOT NULL,
 organisation_name TEXT NOT NULL,
 title TEXT NOT NULL,
 area TEXT NOT NULL,
 relevant_date TEXT,
 cost_or_pay TEXT,
 official_url TEXT NOT NULL,
 details TEXT NOT NULL,
 image_note TEXT,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 sponsored_interest TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_business_submissions_status ON business_submissions(status);
CREATE INDEX IF NOT EXISTS idx_business_submissions_type ON business_submissions(submission_type);

CREATE TABLE IF NOT EXISTS subscriber_preferences (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT NOT NULL UNIQUE,
 families_children INTEGER NOT NULL DEFAULT 0,
 events INTEGER NOT NULL DEFAULT 0,
 food_drink INTEGER NOT NULL DEFAULT 0,
 offers_savings INTEGER NOT NULL DEFAULT 0,
 home_property INTEGER NOT NULL DEFAULT 0,
 pets_outdoors INTEGER NOT NULL DEFAULT 0,
 practical_updates INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS contact_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 category TEXT NOT NULL,
 message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 notification_status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL,
 notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON contact_messages(category);
