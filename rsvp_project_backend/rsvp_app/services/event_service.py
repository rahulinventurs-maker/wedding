from django.db import connection


def _fetchall_as_dict(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _fetchone_as_dict(cursor):
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None


def list_events(user_id: int, page: int = 1, page_size: int = 20) -> dict:
    offset = (page - 1) * page_size
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                e.id, e.title, e.description, e.date_time, e.location,
                e.plus_one_allowed, e.max_capacity, e.is_active,
                e.created_by_id, e.created_at, e.updated_at,
                COUNT(r.id) FILTER (WHERE r.status = 'yes') AS confirmed_count,
                COUNT(w.id)                                 AS waitlist_count
            FROM event e
            LEFT JOIN rsvp r ON r.event_id = e.id
            LEFT JOIN waitlist_entry w ON w.event_id = e.id
            WHERE e.created_by_id = %s
            GROUP BY e.id
            ORDER BY e.date_time DESC
            LIMIT %s OFFSET %s
        """, [user_id, page_size, offset])
        events = _fetchall_as_dict(cur)

        cur.execute("SELECT COUNT(*) FROM event WHERE created_by_id = %s", [user_id])
        total = cur.fetchone()[0]

    return {'results': events, 'count': total, 'page': page, 'page_size': page_size}


def get_event(event_id: str) -> dict | None:
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                e.id, e.title, e.description, e.date_time, e.location,
                e.plus_one_allowed, e.max_capacity, e.is_active,
                e.created_by_id, e.created_at, e.updated_at,
                COUNT(r.id) FILTER (WHERE r.status = 'yes')  AS confirmed_count,
                COUNT(r.id) FILTER (WHERE r.status = 'no')   AS declined_count,
                COUNT(w.id)                                   AS waitlist_count,
                (
                    e.max_capacity IS NOT NULL AND
                    COUNT(r.id) FILTER (WHERE r.status = 'yes') >= e.max_capacity
                ) AS is_full
            FROM event e
            LEFT JOIN rsvp r ON r.event_id = e.id
            LEFT JOIN waitlist_entry w ON w.event_id = e.id
            WHERE e.id = %s
            GROUP BY e.id
        """, [event_id])
        return _fetchone_as_dict(cur)


def create_event(data: dict, user_id: int) -> dict:
    with connection.cursor() as cur:
        cur.execute("""
            INSERT INTO event (
                id, title, description, date_time, location,
                plus_one_allowed, max_capacity, is_active, created_by_id,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s,
                %s, %s, TRUE, %s,
                NOW(), NOW()
            )
            RETURNING *
        """, [
            data['title'], data.get('description'), data['date_time'], data['location'],
            data.get('plus_one_allowed', False), data.get('max_capacity'),
            user_id,
        ])
        return _fetchone_as_dict(cur)


def update_event(event_id: str, data: dict, user_id: int) -> dict | None:
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE event SET
                title            = COALESCE(%s, title),
                description      = COALESCE(%s, description),
                date_time        = COALESCE(%s, date_time),
                location         = COALESCE(%s, location),
                plus_one_allowed = COALESCE(%s, plus_one_allowed),
                max_capacity     = %s,
                is_active        = COALESCE(%s, is_active),
                updated_at       = NOW()
            WHERE id = %s AND created_by_id = %s
            RETURNING *
        """, [
            data.get('title'), data.get('description'), data.get('date_time'),
            data.get('location'), data.get('plus_one_allowed'),
            data.get('max_capacity'),
            data.get('is_active'),
            event_id, user_id,
        ])
        return _fetchone_as_dict(cur)


def delete_event(event_id: str, user_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "DELETE FROM event WHERE id = %s AND created_by_id = %s RETURNING id",
            [event_id, user_id]
        )
        return cur.fetchone() is not None
