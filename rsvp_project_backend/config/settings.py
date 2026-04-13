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

SECRET_KEY = 'django-insecure-whddcf7!3!xu@eeqw10im$=atr@mcxi01mboq+&ew@3kn^&ukl'

DEBUG = True

ALLOWED_HOSTS = ['*']


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
        'NAME':     'RSVP_PLATFORM',
        'USER':     'lucifer',
        'PASSWORD': 'password123',
        'HOST':     '172.23.0.20',
        'PORT':     '5432',
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
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ─────────────────────────────────────────
# drf-spectacular (Swagger / OpenAPI)
# ─────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'RSVP Platform API',
    'DESCRIPTION': 'Wedding RSVP platform — Admin and Participant endpoints',
    'VERSION': '1.0.0',
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
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# ─────────────────────────────────────────
# CORS — allow the Next.js frontend to call the API
# ─────────────────────────────────────────

# Open for all origins in dev — lock this down in production
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'x-csrftoken',
]

# Keep preflight cache short in dev so method changes take effect immediately
CORS_PREFLIGHT_MAX_AGE = 1
