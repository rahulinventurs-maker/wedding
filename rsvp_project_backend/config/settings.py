import os
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent


def _parse_db_url(url: str) -> dict:
    p = urlparse(url)
    return {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     p.path.lstrip('/'),
        'USER':     p.username,
        'PASSWORD': p.password,
        'HOST':     p.hostname,
        'PORT':     str(p.port or 5432),
    }


# ─────────────────────────────────────────
# Core
# ─────────────────────────────────────────
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-me-in-production')

DEBUG = os.environ.get('DEBUG', 'true').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')


# ─────────────────────────────────────────
# Apps
# ─────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',

    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',

    # Local
    'rsvp_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
_db_url = os.environ.get('DATABASE_URL')
DATABASES = {
    'default': _parse_db_url(_db_url) if _db_url else {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.environ.get('DB_NAME',     'RSVP_PLATFORM'),
        'USER':     os.environ.get('DB_USER',     'lucifer'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'password123'),
        'HOST':     os.environ.get('DB_HOST',     '172.23.0.20'),
        'PORT':     os.environ.get('DB_PORT',     '5432'),
    }
}


# ─────────────────────────────────────────
# Django REST Framework
# ─────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}


# ─────────────────────────────────────────
# JWT — SimpleJWT
# ─────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES':        ('Bearer',),
}


# ─────────────────────────────────────────
# drf-spectacular (Swagger / OpenAPI)
# ─────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE':               'RSVP Platform API',
    'DESCRIPTION':         'Wedding RSVP platform — Admin and Participant endpoints',
    'VERSION':             '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}


# ─────────────────────────────────────────
# Password validation
# ─────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ─────────────────────────────────────────
# Internationalisation
# ─────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# ─────────────────────────────────────────
# CORS
# ─────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'true').lower() == 'true'

_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins and not CORS_ALLOW_ALL_ORIGINS:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',')]

CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

CORS_ALLOW_HEADERS = ['accept', 'authorization', 'content-type', 'x-csrftoken']

CORS_PREFLIGHT_MAX_AGE = int(os.environ.get('CORS_PREFLIGHT_MAX_AGE', '1'))
