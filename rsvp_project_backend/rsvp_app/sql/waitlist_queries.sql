-- ─────────────────────────────────────────
-- WAITLIST QUERIES
-- ─────────────────────────────────────────

-- name: get_next_position
SELECT COALESCE(MAX(position), 0) + 1 AS next_position
FROM waitlist_entry
WHERE event_id = %(event_id)s;


-- name: add_to_waitlist
INSERT INTO waitlist_entry (
    id, event_id, name, email,
    dietary_preferences, plus_one_name,
    position, notified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(), %(event_id)s, %(name)s, %(email)s,
    %(dietary_preferences)s, %(plus_one_name)s,
    %(position)s, FALSE,
    NOW(), NOW()
)
RETURNING *;


-- name: list_waitlist
SELECT * FROM waitlist_entry
WHERE event_id = %(event_id)s
ORDER BY position ASC
LIMIT %(limit)s OFFSET %(offset)s;


-- name: count_waitlist
SELECT COUNT(*) FROM waitlist_entry
WHERE event_id = %(event_id)s;


-- name: remove_from_waitlist
DELETE FROM waitlist_entry
WHERE id = %(entry_id)s AND event_id = %(event_id)s
RETURNING id;
