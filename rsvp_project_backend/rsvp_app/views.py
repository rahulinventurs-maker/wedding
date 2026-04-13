from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, OpenApiParameter

from django.contrib.auth import get_user_model
from .serializers import (
    EventCreateSerializer, EventUpdateSerializer, EventSerializer,
    RSVPSubmitSerializer, RSVPSerializer, RSVPCheckInSerializer,
    WaitlistEntrySerializer, RegisterSerializer, UserSerializer,
)

User = get_user_model()
from .services import event_service, rsvp_service, waitlist_service


# Read page and page_size from query params with safe fallbacks
def _pagination_params(request):
    try:
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
    except (ValueError, TypeError):
        page, page_size = 1, 20
    return page, page_size


# Event views — require a valid JWT token (admin only)

class EventListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=EventSerializer(many=True))
    def get(self, request):
        page, page_size = _pagination_params(request)
        data = event_service.list_events(request.user.id, page, page_size)
        return Response(data)

    @extend_schema(request=EventCreateSerializer, responses=EventSerializer)
    def post(self, request):
        ser = EventCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        event = event_service.create_event(ser.validated_data, request.user.id)
        return Response(event, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=EventSerializer)
    def get(self, request, event_id):
        event = event_service.get_event(str(event_id))
        if not event:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(event)

    @extend_schema(request=EventUpdateSerializer, responses=EventSerializer)
    def patch(self, request, event_id):
        ser = EventUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        event = event_service.update_event(str(event_id), ser.validated_data, request.user.id)
        if not event:
            return Response({'detail': 'Not found or forbidden'}, status=status.HTTP_404_NOT_FOUND)
        return Response(event)

    # PUT — same logic as PATCH, used by frontend to avoid browser preflight cache issues
    def put(self, request, event_id):
        return self.patch(request, event_id)

    def delete(self, request, event_id):
        deleted = event_service.delete_event(str(event_id), request.user.id)
        if not deleted:
            return Response({'detail': 'Not found or forbidden'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


# Attendee list — admin can filter by status and search by name

class AttendeeListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter('status', str, enum=['yes', 'no', 'waitlist']),
            OpenApiParameter('search', str),
            OpenApiParameter('page', int),
            OpenApiParameter('page_size', int),
        ],
        responses=RSVPSerializer(many=True),
    )
    def get(self, request, event_id):
        event = event_service.get_event(str(event_id))
        if not event:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        # Make sure the requesting admin actually owns this event
        if event['created_by_id'] != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        rsvp_status = request.query_params.get('status') or None
        search      = request.query_params.get('search') or None
        page, page_size = _pagination_params(request)

        data = rsvp_service.list_rsvps(str(event_id), rsvp_status, search, page, page_size)
        return Response(data)


# Public event view — no auth needed, used for the guest landing page

class PublicEventView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=EventSerializer)
    def get(self, request, event_id):
        event = event_service.get_event(str(event_id))
        if not event or not event['is_active']:
            return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        # Only expose what a guest needs to see — no admin metadata
        public_fields = [
            'id', 'title', 'description', 'date_time', 'location',
            'plus_one_allowed', 'max_capacity', 'is_active', 'is_full',
            'confirmed_count', 'waitlist_count',
        ]
        return Response({k: event[k] for k in public_fields if k in event})


# RSVP submission — open to anyone with the event link

class RSVPSubmitView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RSVPSubmitSerializer, responses=RSVPSerializer)
    def post(self, request, event_id):
        ser = RSVPSubmitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            result = rsvp_service.submit_rsvp(str(event_id), ser.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # If capacity was full, the guest was added to the waitlist instead
        if result['type'] == 'waitlist':
            return Response(
                {'status': 'waitlist', 'data': result['data']},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {'status': result['data']['status'], 'data': result['data']},
            status=status.HTTP_201_CREATED,
        )


# QR code check-in — scanned at the event door to verify a guest

class QRCheckInView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=RSVPCheckInSerializer)
    def get(self, request, qr_token):
        rsvp = rsvp_service.get_rsvp_by_qr(str(qr_token))
        if not rsvp:
            return Response({'detail': 'Invalid QR code'}, status=status.HTTP_404_NOT_FOUND)
        return Response(rsvp)


# Register — open endpoint, creates either an admin or participant account

class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses=UserSerializer)
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        if User.objects.filter(username=d['username']).exists():
            return Response({'detail': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=d['email']).exists():
            return Response({'detail': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        # is_staff = True gives the user access to the admin dashboard
        user = User.objects.create_user(
            username   = d['username'],
            email      = d['email'],
            password   = d['password'],
            first_name = d.get('first_name', ''),
            last_name  = d.get('last_name', ''),
            is_staff   = d['role'] == 'admin',
        )

        return Response({
            'id':         user.id,
            'username':   user.username,
            'email':      user.email,
            'first_name': user.first_name,
            'last_name':  user.last_name,
            'is_staff':   user.is_staff,
        }, status=status.HTTP_201_CREATED)


# Analytics view — aggregated stats for an event

class EventAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        event = event_service.get_event(str(event_id))
        if not event:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if event['created_by_id'] != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        data = rsvp_service.get_event_analytics(str(event_id))
        return Response(data)


# Waitlist view — admin can see who is queued up for their event

class WaitlistView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=WaitlistEntrySerializer(many=True))
    def get(self, request, event_id):
        event = event_service.get_event(str(event_id))
        if not event:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if event['created_by_id'] != request.user.id:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        page, page_size = _pagination_params(request)
        data = waitlist_service.list_waitlist(str(event_id), page, page_size)
        return Response(data)
