from rest_framework import serializers


# Event serializers
# Used for creating, updating, and returning event data

class EventCreateSerializer(serializers.Serializer):
    title            = serializers.CharField()
    description      = serializers.CharField(required=False, allow_blank=True)
    date_time        = serializers.DateTimeField()
    location         = serializers.CharField()
    plus_one_allowed = serializers.BooleanField(default=False)
    # Leave max_capacity empty for unlimited attendance
    max_capacity     = serializers.IntegerField(required=False, allow_null=True, min_value=1)


class EventUpdateSerializer(serializers.Serializer):
    # All fields are optional since this is a partial update
    title            = serializers.CharField(required=False)
    description      = serializers.CharField(required=False, allow_blank=True)
    date_time        = serializers.DateTimeField(required=False)
    location         = serializers.CharField(required=False)
    plus_one_allowed = serializers.BooleanField(required=False)
    max_capacity     = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    is_active        = serializers.BooleanField(required=False)


class EventSerializer(serializers.Serializer):
    # Full event response — includes live stats like confirmed count and is_full flag
    id               = serializers.UUIDField()
    title            = serializers.CharField()
    description      = serializers.CharField(allow_null=True)
    date_time        = serializers.DateTimeField()
    location         = serializers.CharField()
    plus_one_allowed = serializers.BooleanField()
    max_capacity     = serializers.IntegerField(allow_null=True)
    is_active        = serializers.BooleanField()
    created_by_id    = serializers.IntegerField()
    created_at       = serializers.DateTimeField()
    updated_at       = serializers.DateTimeField()
    confirmed_count  = serializers.IntegerField(default=0)
    declined_count   = serializers.IntegerField(default=0)
    waitlist_count   = serializers.IntegerField(default=0)
    is_full          = serializers.BooleanField(default=False)


# RSVP serializers
# Used for guest submissions and admin attendee views

class RSVPSubmitSerializer(serializers.Serializer):
    name                = serializers.CharField()
    email               = serializers.EmailField()
    # Guests can only submit yes or no — waitlist is assigned automatically by the server
    status              = serializers.ChoiceField(choices=['yes', 'no'], default='yes')
    plus_one_name       = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    dietary_preferences = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class RSVPSerializer(serializers.Serializer):
    id                  = serializers.UUIDField()
    event_id            = serializers.UUIDField()
    name                = serializers.CharField()
    email               = serializers.EmailField()
    status              = serializers.CharField()
    plus_one_name       = serializers.CharField(allow_null=True)
    dietary_preferences = serializers.CharField(allow_null=True)
    # qr_token is the raw UUID used in the QR code payload
    qr_token            = serializers.UUIDField()
    # qr_code_url holds the base64 data URI of the generated QR image
    qr_code_url         = serializers.CharField(allow_null=True)
    created_at          = serializers.DateTimeField()
    updated_at          = serializers.DateTimeField()


class RSVPCheckInSerializer(serializers.Serializer):
    # Returned when scanning a QR code at the door
    # Includes just enough event info to verify the guest on-site
    id          = serializers.UUIDField()
    name        = serializers.CharField()
    email       = serializers.EmailField()
    status      = serializers.CharField()
    qr_token    = serializers.UUIDField()
    event_title = serializers.CharField()
    date_time   = serializers.DateTimeField()
    location    = serializers.CharField()


# Register serializer
# role = 'admin' creates a staff user who can manage events
# role = 'participant' creates a regular user (public guest account, optional)

class RegisterSerializer(serializers.Serializer):
    username   = serializers.CharField()
    email      = serializers.EmailField()
    password   = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name  = serializers.CharField(required=False, allow_blank=True)
    role       = serializers.ChoiceField(choices=['admin', 'participant'], default='participant')


class UserSerializer(serializers.Serializer):
    # Returned after a successful registration — never includes the password
    id         = serializers.IntegerField()
    username   = serializers.CharField()
    email      = serializers.EmailField()
    first_name = serializers.CharField()
    last_name  = serializers.CharField()
    is_staff   = serializers.BooleanField()


# Waitlist serializer

class WaitlistEntrySerializer(serializers.Serializer):
    id                  = serializers.UUIDField()
    event_id            = serializers.UUIDField()
    name                = serializers.CharField()
    email               = serializers.EmailField()
    dietary_preferences = serializers.CharField(allow_null=True)
    plus_one_name       = serializers.CharField(allow_null=True)
    # position tells the guest where they are in the queue
    position            = serializers.IntegerField()
    notified            = serializers.BooleanField()
    created_at          = serializers.DateTimeField()
