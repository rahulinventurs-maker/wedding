from django.urls import path
from .views import (
    RegisterView,
    EventListCreateView,
    EventDetailView,
    AttendeeListView,
    EventAnalyticsView,
    PublicEventView,
    RSVPSubmitView,
    QRCheckInView,
    WaitlistView,
)

urlpatterns = [
    # Public: register a new admin or participant account
    path('auth/register/', RegisterView.as_view(), name='register'),

    # Admin: list all events or create a new one
    path('events/', EventListCreateView.as_view(), name='event-list-create'),

    # Admin: get, update, or delete a specific event
    path('events/<uuid:event_id>/', EventDetailView.as_view(), name='event-detail'),

    # Admin: view all RSVPs for an event, with optional status filter and name search
    path('events/<uuid:event_id>/attendees/', AttendeeListView.as_view(), name='attendee-list'),

    # Admin: see who is on the waitlist for a full event
    path('events/<uuid:event_id>/waitlist/', WaitlistView.as_view(), name='waitlist'),

    # Admin: aggregated analytics for an event
    path('events/<uuid:event_id>/analytics/', EventAnalyticsView.as_view(), name='event-analytics'),

    # Public: guest landing page — returns event info needed to render the RSVP form
    path('events/<uuid:event_id>/public/', PublicEventView.as_view(), name='event-public'),

    # Public: guest submits their RSVP — server decides confirmed vs waitlist
    path('events/<uuid:event_id>/rsvp/', RSVPSubmitView.as_view(), name='rsvp-submit'),

    # Public: scan a QR code to verify a guest at the door
    path('checkin/<uuid:qr_token>/', QRCheckInView.as_view(), name='qr-checkin'),
]
