# ── Stage 1: dependency builder ──────────────────────────────────────────────
FROM python:3.13-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: production image ─────────────────────────────────────────────────
FROM python:3.13-slim

# Runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

WORKDIR /app

# Non-root user for security
RUN useradd --no-create-home --shell /bin/false appuser

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 7777

# Collect static files, run migrations, then start gunicorn
ENTRYPOINT ["sh", "-c", "\
    python manage.py collectstatic --noinput && \
    python manage.py migrate --noinput && \
    gunicorn config.wsgi:application \
        --bind 0.0.0.0:7777 \
        --workers 4 \
        --threads 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
"]
