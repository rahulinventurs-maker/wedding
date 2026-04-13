-- ─────────────────────────────────────────
-- EVENT QUERIES
-- ─────────────────────────────────────────

-- name: get_event_by_id
SELECT
    e.id,
    e.title,
    e.description,
    e.date_time,
    e.location,
    e.plus_one_allowed,
    e.max_capacity,
    e.is_active,
    e.created_by_id,
    e.created_at,
    e.updated_at,
    COUNT(r.id) FILTER (WHERE r.status = 'yes')  AS confirmed_count,
    COUNT(r.id) FILTER (WHERE r.status = 'no')   AS declined_count,
    COUNT(w.id)                                  AS waitlist_count
FROM event e
LEFT JOIN rsvp r ON r.event_id = e.id
LEFT JOIN waitlist_entry w ON w.event_id = e.id
WHERE e.id = %(event_id)s
GROUP BY e.id;


-- name: list_events
SELECT
    e.id,
    e.title,
    e.description,
    e.date_time,
    e.location,
    e.plus_one_allowed,
    e.max_capacity,
    e.is_active,
    e.created_by_id,
    e.created_at,
    e.updated_at,
    COUNT(r.id) FILTER (WHERE r.status = 'yes')  AS confirmed_count,
    COUNT(w.id)                                  AS waitlist_count
FROM event e
LEFT JOIN rsvp r ON r.event_id = e.id
LEFT JOIN waitlist_entry w ON w.event_id = e.id
WHERE e.created_by_id = %(user_id)s
GROUP BY e.id
ORDER BY e.date_time DESC
LIMIT %(limit)s OFFSET %(offset)s;


-- name: count_events
SELECT COUNT(*) FROM event WHERE created_by_id = %(user_id)s;


-- name: create_event
INSERT INTO event (
    id, title, description, date_time, location,
    plus_one_allowed, max_capacity, is_active, created_by_id,
    created_at, updated_at
) VALUES (
    gen_random_uuid(), %(title)s, %(description)s, %(date_time)s, %(location)s,
    %(plus_one_allowed)s, %(max_capacity)s, TRUE, %(created_by_id)s,
    NOW(), NOW()
)
RETURNING *;


-- name: update_event
UPDATE event SET
    title            = COALESCE(%(title)s,            title),
    description      = COALESCE(%(description)s,      description),
    date_time        = COALESCE(%(date_time)s,         date_time),
    location         = COALESCE(%(location)s,          location),
    plus_one_allowed = COALESCE(%(plus_one_allowed)s,  plus_one_allowed),
    max_capacity     = %(max_capacity)s,
    is_active        = COALESCE(%(is_active)s,         is_active),
    updated_at       = NOW()
WHERE id = %(event_id)s AND created_by_id = %(user_id)s
RETURNING *;


-- name: delete_event
DELETE FROM event
WHERE id = %(event_id)s AND created_by_id = %(user_id)s
RETURNING id;
