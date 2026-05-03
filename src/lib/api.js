// src/lib/api.js
// Axios instance — all requests go through here.
// Automatically attaches JWT from localStorage.
// Handles 401 (redirect to login) and 403 (permission denied).

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s — some SP calls are slow
});

// ── Request interceptor: attach JWT ──────────────────────────────────────
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

// ── Response interceptor: handle auth errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong.';

    if (status === 401) {
      // Token expired or invalid — clear and redirect to login
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
