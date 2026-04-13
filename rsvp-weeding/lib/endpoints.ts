import api from './api';

// Auth
export const authApi = {
  login:    (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
  refresh:  (refresh: string) =>
    api.post('/auth/refresh/', { refresh }),
  logout:   (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  register: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: 'admin' | 'participant';
  }) => api.post('/auth/register/', data),
};

// Events (admin)
export const eventsApi = {
  list:   (page = 1, pageSize = 20) =>
    api.get('/events/', { params: { page, page_size: pageSize } }),
  get:    (id: string) =>
    api.get(`/events/${id}/`),
  create: (data: object) =>
    api.post('/events/', data),
  update: (id: string, data: object) =>
    api.put(`/events/${id}/`, data),
  delete: (id: string) =>
    api.delete(`/events/${id}/`),
};

// Analytics (admin)
export const analyticsApi = {
  get: (eventId: string) => api.get(`/events/${eventId}/analytics/`),
};

// Attendees (admin)
export const attendeesApi = {
  list: (eventId: string, params?: { status?: string; search?: string; page?: number }) =>
    api.get(`/events/${eventId}/attendees/`, { params }),
  waitlist: (eventId: string, page = 1) =>
    api.get(`/events/${eventId}/waitlist/`, { params: { page } }),
};

// Public (no auth)
export const publicApi = {
  getEvent: (eventId: string) =>
    api.get(`/events/${eventId}/public/`),
  submitRsvp: (eventId: string, data: object) =>
    api.post(`/events/${eventId}/rsvp/`, data),
  checkIn: (qrToken: string) =>
    api.get(`/checkin/${qrToken}/`),
};
