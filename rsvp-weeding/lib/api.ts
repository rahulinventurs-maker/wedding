import axios from 'axios';

// All API calls go through this instance.
// The base URL points to our Django backend.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:7777/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If we get a 401 on a protected endpoint, clear the session and redirect to login.
// Skip this for the refresh and logout endpoints — those 401s are handled by the auth store.
const AUTH_SKIP_PATHS = ['/auth/refresh/', '/auth/logout/'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? '';
    const isAuthEndpoint = AUTH_SKIP_PATHS.some((p) => url.includes(p));

    if (err.response?.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
