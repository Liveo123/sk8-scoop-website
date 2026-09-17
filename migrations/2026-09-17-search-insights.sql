CREATE TABLE IF NOT EXISTS search_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 query_text TEXT NOT NULL,
 query_normalised TEXT NOT NULL,
 result_count INTEGER NOT NULL DEFAULT 0,
 search_type TEXT NOT NULL DEFAULT 'all',
 search_area TEXT NOT NULL DEFAULT 'all',
 source TEXT NOT NULL DEFAULT 'search_page',
 created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(query_normalised);
CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at);
CREATE INDEX IF NOT EXISTS idx_search_events_results ON search_events(result_count);
