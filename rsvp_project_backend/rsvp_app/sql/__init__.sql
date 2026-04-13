-- ─────────────────────────────────────────
-- REFERENCE ONLY — do not run manually.
-- Applied via Django migration RunSQL.
-- Run:  python manage.py migrate
-- ─────────────────────────────────────────

-- Extensions (also in initial migration)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigram index for guest name search
CREATE INDEX IF NOT EXISTS idx_rsvp_name_trgm ON rsvp USING gin (name gin_trgm_ops);


-- updated_at triggers (Django auto_now handles this in ORM,
-- but these keep it consistent for any direct SQL writes)
CREATE TRIGGER trg_event_updated_at
    BEFORE UPDATE ON event
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rsvp_updated_at
    BEFORE UPDATE ON rsvp
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_waitlist_updated_at
    BEFORE UPDATE ON waitlist_entry
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
