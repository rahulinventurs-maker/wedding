import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField()
    description = models.TextField(blank=True, null=True)
    date_time = models.DateTimeField()
    location = models.TextField()
    plus_one_allowed = models.BooleanField(default=False)
    max_capacity = models.PositiveIntegerField(null=True, blank=True)  # None = unlimited
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'event'
        ordering = ['-date_time']

    def __str__(self):
        return self.title

    @property
    def confirmed_count(self):
        return self.rsvps.filter(status=RSVP.Status.YES).count()

    @property
    def is_full(self):
        if self.max_capacity is None:
            return False
        return self.confirmed_count >= self.max_capacity


class RSVP(models.Model):
    class Status(models.TextChoices):
        YES = 'yes', 'Yes'
        NO = 'no', 'No'
        WAITLIST = 'waitlist', 'Waitlist'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='rsvps')
    name = models.TextField()
    email = models.EmailField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.YES)
    plus_one_name = models.TextField(blank=True, null=True)
    dietary_preferences = models.TextField(blank=True, null=True)
    qr_token = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    qr_code_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rsvp'
        constraints = [
            models.UniqueConstraint(fields=['event', 'email'], name='uq_rsvp_email_per_event')
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.event.title} ({self.status})'


class WaitlistEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='waitlist')
    name = models.TextField()
    email = models.EmailField()
    dietary_preferences = models.TextField(blank=True, null=True)
    plus_one_name = models.TextField(blank=True, null=True)
    position = models.PositiveIntegerField()
    notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'waitlist_entry'
        constraints = [
            models.UniqueConstraint(fields=['event', 'email'], name='uq_waitlist_email_per_event'),
            models.UniqueConstraint(fields=['event', 'position'], name='uq_waitlist_position'),
        ]
        ordering = ['position']

    def __str__(self):
        return f'{self.name} — waitlist #{self.position} for {self.event.title}'
