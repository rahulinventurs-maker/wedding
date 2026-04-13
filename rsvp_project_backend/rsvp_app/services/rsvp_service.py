import io
import qrcode
import base64
from django.db import connection
from .waitlist_service import add_to_waitlist


def _fetchone_as_dict(cursor):
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None


def _fetchall_as_dict(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _get_confirmed_count(cursor, event_id: str) -> int:
    cursor.execute(
        "SELECT COUNT(*) FROM rsvp WHERE event_id = %s AND status = 'yes'",
        [event_id]
    )
    return cursor.fetchone()[0]


def _get_event(cursor, event_id: str) -> dict | None:
    cursor.execute(
        "SELECT id, max_capacity, plus_one_allowed, is_active FROM event WHERE id = %s",
        [event_id]
    )
    row = cursor.fetchone()
    if not row:
        return None
    cols = [d[0] for d in cursor.description]
    return dict(zip(cols, row))


def generate_qr_code_base64(data: str) -> str:
    """Generate a QR code and return it as a base64 data URI."""
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{encoded}"


def submit_rsvp(event_id: str, data: dict) -> dict:
    """
    Main entry point for guest RSVP submission.
    Handles capacity check, waitlist fallback, and QR generation.
    Returns dict with keys: rsvp | waitlist_entry, and status.
    """
    with connection.cursor() as cur:
        event = _get_event(cur, event_id)
        if not event:
            raise ValueError('Event not found')
        if not event['is_active']:
            raise ValueError('This event is no longer accepting RSVPs')

        # Validate +1
        plus_one_name = data.get('plus_one_name')
        if plus_one_name and not event['plus_one_allowed']:
            raise ValueError('This event does not allow +1 guests')

        status = data.get('status', 'yes')

        # Capacity check only applies to 'yes' RSVPs
        if status == 'yes' and event['max_capacity'] is not None:
            confirmed = _get_confirmed_count(cur, event_id)
            if confirmed >= event['max_capacity']:
                # Auto-redirect to waitlist
                entry = add_to_waitlist(event_id, data)
                return {'type': 'waitlist', 'data': entry}

        # Insert RSVP
        cur.execute("""
            INSERT INTO rsvp (
                id, event_id, name, email, status,
                plus_one_name, dietary_preferences,
                qr_token, qr_code_url,
                created_at, updated_at
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s,
                %s, %s,
                gen_random_uuid(), NULL,
                NOW(), NOW()
            )
            RETURNING *
        """, [
            event_id, data['name'], data['email'], status,
            plus_one_name, data.get('dietary_preferences'),
        ])
        rsvp = _fetchone_as_dict(cur)

        # Generate QR code for confirmed 'yes' RSVPs
        if status == 'yes':
            qr_data = str(rsvp['qr_token'])
            qr_code_url = generate_qr_code_base64(qr_data)
            cur.execute(
                "UPDATE rsvp SET qr_code_url = %s WHERE id = %s RETURNING *",
                [qr_code_url, rsvp['id']]
            )
            rsvp = _fetchone_as_dict(cur)

        return {'type': 'rsvp', 'data': rsvp}


def list_rsvps(event_id: str, status: str = None, search: str = None,
               page: int = 1, page_size: int = 20) -> dict:
    offset = (page - 1) * page_size
    search_param = f'%{search}%' if search else None

    with connection.cursor() as cur:
        cur.execute("""
            SELECT * FROM rsvp
            WHERE event_id = %s
              AND (%s IS NULL OR status::text = %s)
              AND (%s IS NULL OR name ILIKE %s)
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, [event_id, status, status, search_param, search_param, page_size, offset])
        results = _fetchall_as_dict(cur)

        cur.execute("""
            SELECT COUNT(*) FROM rsvp
            WHERE event_id = %s
              AND (%s IS NULL OR status::text = %s)
              AND (%s IS NULL OR name ILIKE %s)
        """, [event_id, status, status, search_param, search_param])
        total = cur.fetchone()[0]

    return {'results': results, 'count': total, 'page': page, 'page_size': page_size}


def get_event_analytics(event_id: str) -> dict:
    with connection.cursor() as cur:
        # RSVP status breakdown
        cur.execute("""
            SELECT status::text, COUNT(*) AS count
            FROM rsvp WHERE event_id = %s
            GROUP BY status
        """, [event_id])
        status_rows = cur.fetchall()
        status_counts = {row[0]: row[1] for row in status_rows}

        total_rsvps = sum(status_counts.values())
        confirmed   = status_counts.get('yes', 0)
        declined    = status_counts.get('no', 0)
        maybe       = status_counts.get('maybe', 0)

        # +1 breakdown (only confirmed guests)
        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE plus_one_name IS NOT NULL AND plus_one_name != '') AS with_plus_one,
                COUNT(*) FILTER (WHERE plus_one_name IS NULL OR plus_one_name = '')       AS without_plus_one
            FROM rsvp WHERE event_id = %s AND status = 'yes'
        """, [event_id])
        plus_row = cur.fetchone()
        with_plus_one    = plus_row[0] if plus_row else 0
        without_plus_one = plus_row[1] if plus_row else 0

        # Dietary preferences breakdown
        cur.execute("""
            SELECT
                LOWER(TRIM(dietary_preferences)) AS diet,
                COUNT(*) AS count
            FROM rsvp
            WHERE event_id = %s
              AND dietary_preferences IS NOT NULL
              AND TRIM(dietary_preferences) != ''
            GROUP BY LOWER(TRIM(dietary_preferences))
            ORDER BY count DESC
        """, [event_id])
        dietary_rows = cur.fetchall()
        dietary = [{'label': row[0], 'count': row[1]} for row in dietary_rows]

        # RSVPs over time (by day)
        cur.execute("""
            SELECT DATE(created_at) AS day, COUNT(*) AS count
            FROM rsvp WHERE event_id = %s
            GROUP BY day ORDER BY day ASC
        """, [event_id])
        timeline = [{'date': str(row[0]), 'count': row[1]} for row in cur.fetchall()]

        # Waitlist count
        cur.execute("SELECT COUNT(*) FROM waitlist_entry WHERE event_id = %s", [event_id])
        waitlist_count = cur.fetchone()[0]

    return {
        'total_rsvps':       total_rsvps,
        'confirmed':         confirmed,
        'declined':          declined,
        'maybe':             maybe,
        'waitlist':          waitlist_count,
        'with_plus_one':     with_plus_one,
        'without_plus_one':  without_plus_one,
        'dietary':           dietary,
        'timeline':          timeline,
    }


def get_rsvp_by_qr(qr_token: str) -> dict | None:
    with connection.cursor() as cur:
        cur.execute("""
            SELECT r.*, e.title AS event_title, e.date_time, e.location
            FROM rsvp r
            JOIN event e ON e.id = r.event_id
            WHERE r.qr_token = %s
        """, [qr_token])
        return _fetchone_as_dict(cur)


def delete_rsvp(rsvp_id: str, event_id: str) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "DELETE FROM rsvp WHERE id = %s AND event_id = %s RETURNING id",
            [rsvp_id, event_id]
        )
        return cur.fetchone() is not None
