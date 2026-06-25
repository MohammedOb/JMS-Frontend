// src/lib/api.js
// Axios instance for all frontend API calls.
// Automatically attaches JWT from localStorage.
// Handles common auth and server-side failures.

import axios from 'axios';
import toast from 'react-hot-toast';

export function resolveApiBaseUrl() {
  const fallback = 'http://localhost:5000/';
  const configured = process.env.NEXT_PUBLIC_API_URL || fallback;

  if (typeof window === 'undefined') {
    return configured;
  }

  try {
    const url = new URL(configured, window.location.origin);
    const configHost = url.hostname;
    const pageHost = window.location.hostname;

    // If the app is opened via LAN IP, don't keep sending API traffic to the
    // browser's own localhost. Reuse the current hostname and preserve port/path.
    if (
      pageHost &&
      !['localhost', '127.0.0.1', '::1'].includes(pageHost) &&
      ['localhost', '127.0.0.1', '::1'].includes(configHost)
    ) {
      url.hostname = pageHost;
    }

    return url.toString();
  } catch {
    return configured;
  }
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jms_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong.';

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jms_token');
        localStorage.removeItem('jms_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error(`Access denied: ${message}`);
      return Promise.reject(error);
    }

    if (status === 429) {
      toast.error('Too many requests. Please wait a moment.');
      return Promise.reject(error);
    }

    if (status >= 500) {
      toast.error('Server error. Please try again.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Public API — for unauthenticated pages (e.g. public reg forms) ──────────
// No auth token attached, no login redirect on 401.
export const publicApi = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
    }
    return Promise.reject(error);
  }
);
