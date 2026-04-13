from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # ── Auth (JWT) ──────────────────────────────
    path('api/auth/login/',   TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
    path('api/auth/logout/',  TokenBlacklistView.as_view(),   name='token_blacklist'),

    # ── App API ─────────────────────────────────
    path('api/', include('rsvp_app.urls')),

    # ── API Docs ─────────────────────────────────
    path('api/schema/',          SpectacularAPIView.as_view(),                        name='schema'),
    path('api/docs/',            SpectacularSwaggerView.as_view(url_name='schema'),   name='swagger-ui'),
    path('api/docs/redoc/',      SpectacularRedocView.as_view(url_name='schema'),     name='redoc'),
]
