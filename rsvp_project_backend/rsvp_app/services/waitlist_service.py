from django.db import connection


def _fetchone_as_dict(cursor):
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None


def _fetchall_as_dict(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def add_to_waitlist(event_id: str, data: dict) -> dict:
    with connection.cursor() as cur:
        # Get next queue position
        cur.execute(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM waitlist_entry WHERE event_id = %s",
            [event_id]
        )
        position = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO waitlist_entry (
                id, event_id, name, email,
                dietary_preferences, plus_one_name,
                position, notified,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), %s, %s, %s,
                %s, %s,
                %s, FALSE,
                NOW(), NOW()
            )
            RETURNING *
        """, [
            event_id, data['name'], data['email'],
            data.get('dietary_preferences'), data.get('plus_one_name'),
            position,
        ])
        return _fetchone_as_dict(cur)


def list_waitlist(event_id: str, page: int = 1, page_size: int = 20) -> dict:
    offset = (page - 1) * page_size
    with connection.cursor() as cur:
        cur.execute("""
            SELECT * FROM waitlist_entry
            WHERE event_id = %s
            ORDER BY position ASC
            LIMIT %s OFFSET %s
        """, [event_id, page_size, offset])
        results = _fetchall_as_dict(cur)

        cur.execute(
            "SELECT COUNT(*) FROM waitlist_entry WHERE event_id = %s",
            [event_id]
        )
        total = cur.fetchone()[0]

    return {'results': results, 'count': total, 'page': page, 'page_size': page_size}


def remove_from_waitlist(entry_id: str, event_id: str) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "DELETE FROM waitlist_entry WHERE id = %s AND event_id = %s RETURNING id",
            [entry_id, event_id]
        )
        return cur.fetchone() is not None
