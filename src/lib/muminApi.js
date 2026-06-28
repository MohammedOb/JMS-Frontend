// src/lib/muminApi.js
// Axios instance for Mumin portal — uses jms_mumin_token, redirects to /mumin/login on 401.

import axios from 'axios';
import { resolveApiBaseUrl } from './api';

const muminApi = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

muminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jms_mumin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

muminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('jms_mumin_token');
      localStorage.removeItem('jms_mumin_user');
      window.location.href = '/mumin/login';
    }
    return Promise.reject(error);
  }
);

export default muminApi;
