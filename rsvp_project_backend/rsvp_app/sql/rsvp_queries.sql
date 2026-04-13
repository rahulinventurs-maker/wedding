-- ─────────────────────────────────────────
-- RSVP QUERIES
-- ─────────────────────────────────────────

-- name: get_rsvp_by_id
SELECT * FROM rsvp
WHERE id = %(rsvp_id)s AND event_id = %(event_id)s;


-- name: get_rsvp_by_qr_token
SELECT r.*, e.title AS event_title, e.date_time, e.location
FROM rsvp r
JOIN event e ON e.id = r.event_id
WHERE r.qr_token = %(qr_token)s;


-- name: list_rsvps
SELECT * FROM rsvp
WHERE event_id = %(event_id)s
  AND (%(status)s IS NULL OR status = %(status)s::rsvp_status)
  AND (%(search)s IS NULL OR name ILIKE %(search)s)
ORDER BY created_at DESC
LIMIT %(limit)s OFFSET %(offset)s;


-- name: count_rsvps
SELECT COUNT(*) FROM rsvp
WHERE event_id = %(event_id)s
  AND (%(status)s IS NULL OR status = %(status)s::rsvp_status)
  AND (%(search)s IS NULL OR name ILIKE %(search)s);


-- name: count_confirmed
SELECT COUNT(*) FROM rsvp
WHERE event_id = %(event_id)s AND status = 'yes';


-- name: create_rsvp
INSERT INTO rsvp (
    id, event_id, name, email, status,
    plus_one_name, dietary_preferences,
    qr_token, qr_code_url,
    created_at, updated_at
) VALUES (
    gen_random_uuid(), %(event_id)s, %(name)s, %(email)s, %(status)s,
    %(plus_one_name)s, %(dietary_preferences)s,
    gen_random_uuid(), NULL,
    NOW(), NOW()
)
RETURNING *;


-- name: update_rsvp_qr_url
UPDATE rsvp SET qr_code_url = %(qr_code_url)s, updated_at = NOW()
WHERE id = %(rsvp_id)s
RETURNING *;


-- name: delete_rsvp
DELETE FROM rsvp
WHERE id = %(rsvp_id)s AND event_id = %(event_id)s
RETURNING id;
